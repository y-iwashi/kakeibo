import logging
from rest_framework import viewsets
from .models import Member, Category, Expenses
from .serializers import MemberSerializer, CategorySerializer, ExpensesSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_summary(request):
    
    print("=== get_dashboard_summary CALL START ===")
    print("User:", request.user)
    logger.info("=== get_dashboard_summary CALL START ===")
    logger.info("User: %s", request.user)
    
    try:
        # 今月の合計を計算
        total = Expenses.objects.filter(
            # TODO ここが実際には今月のデータに絞り込む条件になるように修正する必要があります。
            source_file = "202608.csv" 
        ).aggregate(Sum('amount'))['amount__sum'] or 0

        print("Calculated Total:", total)
        logger.info("Calculated Total: %s", total)
        
        return Response({'total_expense': total})

    except Exception as e:
        # エラーの内容をターミナルに表示させる
        print("ERROR IN VIEW:", str(e))
        logger.error("ERROR IN VIEW: %s", str(e))
        raise e