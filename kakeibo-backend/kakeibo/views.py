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

        logger.info("Summary Table: %s", summary_table)

        return Response({
            'source_file': current_file_name,
            'total_expense': current_total,
            'total_count': current_summary['total_count'] or 0,
            'max_expense': max_item.amount if max_item else 0,
            'max_expense_shop': max_item.shop if max_item else 'なし',
            'mom_change_rate': mom_change_rate,
            'summary_table': summary_table,
        })

    except Exception as e:
        # エラーの内容をターミナルに表示させる
        logger.error("ERROR IN VIEW: %s", str(e))
        raise e