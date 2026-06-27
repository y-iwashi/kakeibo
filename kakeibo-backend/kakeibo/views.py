from rest_framework import viewsets
from .models import Member, Category, Expenses
from .serializers import MemberSerializer, CategorySerializer, ExpensesSerializer

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