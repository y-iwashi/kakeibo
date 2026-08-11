import logging
from rest_framework import viewsets
from .models import Member, Category, Expenses
from .serializers import MemberSerializer, CategorySerializer, ExpensesSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Max

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

        # 最新のファイル名を取得（データが無い場合はフォールバック）
        source_file = latest_record.source_file if latest_record else "なし"

        logger.info("Source File: %s", source_file)

        # 対象月のデータを取得
        queryset = Expenses.objects.filter(
            source_file = source_file
        )
        
        # 対象月の合計を計算
        summary =queryset.aggregate(
            total_expense = Sum('amount'),
            total_count = Count('expenses_id'),
        )

        # 金額が高い順（-amount）に並び替えて最上位の1件を取得
        max_item = queryset.order_by('-amount').first()

        # データが存在する場合はその値を取得（存在しない場合は初期値）
        max_expense = max_item.amount if max_item else 0
        
        # データが存在する場合はそのショップ名を取得（存在しない場合は「なし」）
        max_expense_shop = max_item.shop if max_item else 'なし'
        
        logger.info("Calculated Total: %s", summary)
        logger.info("Max Expense Amount: %s", max_expense)
        logger.info("Max Expense Shop: %s", max_expense_shop)

        return Response({
            'total_expense': summary['total_expense'] or 0,
            'total_count': summary['total_count'] or 0,
            'max_expense': max_expense,
            'max_expense_shop': max_expense_shop,
            'source_file': source_file,
        })

    except Exception as e:
        # エラーの内容をターミナルに表示させる
        logger.error("ERROR IN VIEW: %s", str(e))
        raise e