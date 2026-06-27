from django.contrib import admin
from .models import Member, Category, Expenses

# 管理画面に表示する項目や、並び順、検索機能をカスタマイズする設定
@admin.register(Expenses)
class ExpensesAdmin(admin.ModelAdmin):
    # 管理画面の一覧に表示するカラム
    list_display = ('expenses_id','use_date','shop', 'amount','category','member','memo','is_closed','source_file','db_update_date','db_update_user','db_insert_date','db_insert_user')
    # クリックして詳細画面に移動できるリンクにするカラム
    list_display_links = ()
    # 右側に表示するフィルター（絞り込み）機能
    # list_filter = ('use_date', 'member', 'category')
    # キーワード検索ができる対象のカラム（※文字型のみ指定可能）
    search_fields = ('shop', 'memo')
    # データの並び順（取引日の新しい順）
    ordering = ('-use_date',)


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('member_id', 'member_name')
    ordering = ('member_id',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('category_id', 'category_name')
    ordering = ('category_id',)