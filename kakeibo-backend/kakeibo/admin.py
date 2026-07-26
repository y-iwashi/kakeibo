from django.contrib import admin
from .models import Member, Category, Expenses
from django.db import connection

# 管理画面に表示する項目や、並び順、検索機能をカスタマイズする設定
@admin.register(Expenses)
class ExpensesAdmin(admin.ModelAdmin):

    # 管理画面の一覧に表示するカラム
    list_display = ('expenses_id','use_date','shop', 'amount','category','member','memo','is_closed','source_file','db_update_date','db_update_user','db_insert_date','db_insert_user')

    # 管理サイトの入力画面で、手動で変更できないようにする（自動入力させるため）
    readonly_fields = ('db_insert_user', 'db_update_user')

    # クリックして詳細画面に移動できるリンクにするカラム
    list_display_links = ()

    # 右側に表示するフィルター（絞り込み）機能
    list_filter = ('member', 'source_file')

    # キーワード検索ができる対象のカラム（※文字型のみ指定可能）
    search_fields = ('shop', 'memo')

    # データの並び順（取引日の新しい順）
    ordering = ('-expenses_id',)

    # 管理画面で保存ボタンを押したときに、誰が更新したかを自動で記録する処理
    def save_model(self, request, obj, form, change):
        current_user_name = request.user.username 

        if not change:
            obj.db_insert_user = current_user_name
            obj.db_update_user = current_user_name
        else:
            obj.db_update_user = current_user_name

        # DBにデータを書き込む際、パラレル処理を使用しない命令
        with connection.cursor() as cursor:
            cursor.execute("ALTER SESSION DISABLE PARALLEL DML")

        super().save_model(request, obj, form, change)

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('member_id', 'member_name')
    ordering = ('member_id',)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('category_id', 'category_name')
    ordering = ('category_id',)