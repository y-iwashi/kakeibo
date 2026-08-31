import logging
from rest_framework import viewsets
from .models import Member, Category, Expenses
from .serializers import MemberSerializer, CategorySerializer, ExpensesSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Max
from datetime import datetime
from dateutil.relativedelta import relativedelta
from rest_framework.views import APIView
from django.utils import timezone
from .serializers import ExpensesSerializer

class MemberViewSet(viewsets.ModelViewSet):
    """
    メンバー情報のCRUD（取得・登録・更新・削除）を担当するビュー
    """
    queryset = Member.objects.all()
    serializer_class = MemberSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """
    カテゴリ情報のCRUDを担当するビュー
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ExpensesViewSet(viewsets.ModelViewSet):
    """
    出費（家計簿データ）のCRUDを担当するビュー
    """
    # 開発効率アップのポイント：
    # 今後React側で「一括登録」や「メモ検索」などの特殊な機能を実装したくなったら、
    # この ExpensesViewSet の中にメソッドを追加していくだけで簡単に拡張できます。
    queryset = Expenses.objects.all().order_by('-use_date') # 取引日の新しい順に並び替えて取得
    serializer_class = ExpensesSerializer

logger = logging.getLogger(__name__)

# 定数設定
RENT_AMOUNT = 167000         # 家賃
RENEWAL_FEE_AMOUNT = 7000    # 更新料
WRX_AMOUNT = 20000           # WRX

# ダッシュボードのサマリー情報を取得するビュー
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_summary(request):
    
    logger.info("=== ダッシュボード初期表示開始 ===")
    logger.info("User: %s", request.user)
    
    try:

        # 最新のcsvファイルの名称を取得する（6桁の数字 + .csv）
        latest_record = (
            Expenses.objects
            .filter(source_file__regex=r'^\d{6}\.csv$')
            .order_by('-source_file')
            .first()
        )

        # 最新のcsvファイルが存在しない場合は、デフォルト値を返す
        if not latest_record:
            return Response({
                'source_file': 'なし',
                'total_expense': 0,
                'total_count': 0,
                'max_expense': 0,
                'max_expense_shop': 'なし',
                'mom_change_rate': None, # データなし
            })

        current_file_name = latest_record.source_file  # 例: '202608.csv'
        
        logger.info("Source File: %s", current_file_name)

        # 当月データの取得
        current_qs = Expenses.objects.filter(source_file=current_file_name)
        current_summary = current_qs.aggregate(
            total_expense=Sum('amount'),
            total_count=Count('expenses_id')
        )
        current_total = current_summary['total_expense'] or 0

        logger.info("Calculated Total: %s", current_total)

        # ファイル名から前月ファイル名を計算
        yyyymm_str = current_file_name.replace('.csv', '')
        current_date = datetime.strptime(yyyymm_str, '%Y%m')
        
        # 1ヶ月前の年月を取得
        prev_date = current_date - relativedelta(months=1)
        prev_file_name = f"{prev_date.strftime('%Y%m')}.csv"

        # 前月データの集計
        prev_total = Expenses.objects.filter(source_file=prev_file_name).aggregate(
            total_expense=Sum('amount')
        )['total_expense'] or 0

        # 先月比の計算
        if prev_total > 0:
            # ((当月 - 前月) / 前月) * 100
            mom_change_rate = round(((current_total - prev_total) / prev_total) * 100, 1)
        else:
            mom_change_rate = None  # 前月のデータが存在しない・0円の場合は比較不可

        # 当月の最高金額データ
        max_item = current_qs.order_by('-amount').first()

        logger.info("Max Expense Amount: %s", max_item.amount if max_item else 0)
        logger.info("Max Expense Shop: %s", max_item.shop if max_item else 'なし')
        logger.info("Month-over-Month Change Rate: %s", mom_change_rate)

        # MEMBER_ID別（1:な, 2:ゆ, 3:共有）の合計を集計
        member_sums = current_qs.values('member_id').annotate(total=Sum('amount'))

        # MEMBER_IDごとの合計金額を辞書に格納
        totals = {1: 0, 2: 0, 3: 0}
        for item in member_sums:
            m_id = item['member_id']
            if m_id in totals:
                totals[m_id] = item['total'] or 0

        total_na = totals[1]       # な (member_id: 1)
        total_yu = totals[2]       # ゆ (member_id: 2)
        total_kyoyu = totals[3]    # 共有 (member_id: 3)

        logger.info("Total for な: %s", total_na)
        logger.info("Total for ゆ: %s", total_yu)
        logger.info("Total for 共有: %s", total_kyoyu)

        # 共有項目（折半対象）の一人当たり（/2）金額を計算
        kyoyu_per_person = round(total_kyoyu / 2)              # 共有費の一人当たり金額
        rent_per_person = round(RENT_AMOUNT / 2)               # 家賃の一人当たり金額
        renewal_per_person = round(RENEWAL_FEE_AMOUNT / 2)     # 更新料の一人当たり金額
        wrx_per_person = round(WRX_AMOUNT / 2)                 # WRXの一人当たり金額

        logger.info("Shared Total per Person: %s", kyoyu_per_person)
        logger.info("Rent per Person: %s", rent_per_person)
        logger.info("Renewal Fee per Person: %s", renewal_per_person)
        logger.info("WRX per Person: %s", wrx_per_person)

        # 「住信SBI振込額」の計算
        # （一人当たりの共有固定費＋変動共有費の合計）
        shared_total_per_person = kyoyu_per_person + rent_per_person + renewal_per_person + wrx_per_person
        
        sbi_na = total_na + shared_total_per_person  # な の振込額
        sbi_yu = total_yu + shared_total_per_person  # ゆ の振込額

        logger.info("SBI Transfer Amount for な: %s", sbi_na)
        logger.info("SBI Transfer Amount for ゆ: %s", sbi_yu)

        # サマリテーブルデータの構造化
        summary_table = [
            {'label': 'な', 'total': total_na, 'per_person': None, 'sbi': sbi_na},
            {'label': 'ゆ', 'total': total_yu, 'per_person': None, 'sbi': sbi_yu},
            {'label': '共有', 'total': total_kyoyu, 'per_person': kyoyu_per_person, 'sbi': None},
            {'label': '家賃', 'total': RENT_AMOUNT, 'per_person': rent_per_person, 'sbi': None},
            {'label': '更新料', 'total': RENEWAL_FEE_AMOUNT, 'per_person': renewal_per_person, 'sbi': None},
            {'label': 'WRX', 'total': WRX_AMOUNT, 'per_person': wrx_per_person, 'sbi': None},
        ]

        # logger.info("Summary Table: %s", summary_table)

        # 過去の月別合計金額を抽出するロジック
        monthly_qs = (
            Expenses.objects
            .filter(source_file__regex=r'^\d{6}\.csv$')
            .values('source_file')
            .annotate(total_amount=Sum('amount'))
            .order_by('source_file') # 古い順（例: 202603.csv -> 202608.csv）
        )

        # logger.info("Monthly QuerySet: %s", list(monthly_qs))

        # 配列フォーマットを作成（直近6ヶ月分に絞り込み）
        monthly_trends = []

        # 過去13ヶ月分のデータを抽出して整形
        for item in list(monthly_qs)[-13:]: 
            filename = item['source_file'] # '202608.csv'
            month_num = int(filename[4:6])  # '08' -> 8
            
            # 共有固定費（家賃等）を含める場合はここで計算する
            total_with_fixed = (item['total_amount'] or 0)

            monthly_trends.append({
                'month': f"{month_num}月",
                'amount': total_with_fixed
            })

        # logger.info("Monthly Trends: %s", monthly_trends)

        return Response({
            'source_file': current_file_name,
            'total_expense': current_total,
            'total_count': current_summary['total_count'] or 0,
            'max_expense': max_item.amount if max_item else 0,
            'max_expense_shop': max_item.shop if max_item else 'なし',
            'mom_change_rate': mom_change_rate,
            'summary_table': summary_table,
            'monthly_trends': monthly_trends,
        })

    except Exception as e:
        # エラーの内容をターミナルに表示させる
        logger.error("ERROR IN VIEW: %s", str(e))
        raise e

# 1. 最新データの取得 API
@permission_classes([IsAuthenticated])
class LatestExpensesView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        # DB内で最も最新の source_file (例: 202608.csv) を取得
        # latest_file = Expenses.objects.values_list('source_file', flat=True).order_by('-source_file').first()

        # DB内で最も最新の source_file (例: 202608.csv) を取得
        latest_record = (
            Expenses.objects
            .filter(source_file__regex=r'^\d{6}\.csv$')
            .order_by('-source_file')
            .first()
        )

        latest_file = latest_record.source_file  # 例: '202608.csv'

        logger.info("Latest Source File: %s", latest_file)

        # 最新ファイルが存在しない場合は、空のリストを返す
        if not latest_file:
            return Response({"expenses": [], "source_file": "", "categories": [], "members": []})

        # 最新ファイルの全レコード取得 (ID降順)
        expenses_qs = Expenses.objects.filter(source_file=latest_file).order_by('-expenses_id')

        logger.info("Number of Expenses Records: %s", expenses_qs.count())

        serializer = ExpensesSerializer(expenses_qs, many=True)

        # logger.info("Serialized Expenses Data: %s", serializer.data[:5])  # 最初の5件だけログに出力

        # ドロップダウン用マスタリスト
        categories = list(Category.objects.values('category_id', 'category_name'))
        members = list(Member.objects.values('member_id', 'member_name'))

        return Response({
            "source_file": latest_file,
            "expenses": serializer.data,
            "categories": categories, # [{'category_id': 10, 'category_name': '娯楽'}, ...]
            "members": members,       # [{'member_id': 1, 'member_name': 'な'}, ...]
        })


# 2. 単一行の個別更新 API (PATCH)
@permission_classes([IsAuthenticated])
class ExpenseUpdateView(APIView):
    # permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            expense = Expenses.objects.get(pk=pk)
        except Expenses.DoesNotExist:
            logger.warning("Expense not found for ID: %s", pk)
            return Response({"error": "対象のデータが存在しません"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()

        # 自動更新用カラムを設定
        expense.db_update_date = timezone.now()
        expense.db_update_user = request.user.username if request.user else "system"

        serializer = ExpensesSerializer(expense, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            expense.save() # 更新日・更新ユーザーを保存

            # 登録・更新されたデータをログ出力
            updated_instance = Expenses.objects.get(pk=pk)
            updated_data = ExpensesSerializer(updated_instance).data
            logger.info("【データ更新成功】 ID: %s | 内容: %s", pk, updated_data)

            return Response(serializer.data)

        # バリデーションエラー時のログ出力
        logger.error("【データ更新失敗】 ID: %s | エラー: %s", pk, serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 3. 一括更新 API (POST)
@permission_classes([IsAuthenticated])
class BulkExpenseUpdateView(APIView):
    # permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            logger.warning("No IDs provided for bulk update")
            return Response({"error": "更新対象が指定されていません"}, status=status.HTTP_400_BAD_REQUEST)

        update_fields = {}
        if 'category' in request.data:
            update_fields['category'] = request.data['category']
        if 'member' in request.data:
            update_fields['member'] = request.data['member']
        if 'is_closed' in request.data:
            update_fields['is_closed'] = request.data['is_closed']

        # 自動更新用メタ情報
        update_fields['db_update_date'] = timezone.now()
        update_fields['db_update_user'] = request.user.username if request.user else "system"

        # 一括更新実行
        updated_count = Expenses.objects.filter(expenses_id__in=ids).update(**update_fields)

        logger.info("【一括更新成功】 対象ID一覧: %s | 更新パラメータ: %s | 件数: %d件", ids, update_fields, updated_count)

        return Response({"message": f"{updated_count}件を更新しました", "updated_count": updated_count})