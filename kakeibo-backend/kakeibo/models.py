# kakeibo/models.py
from django.db import models

class Member(models.Model):
    member_id = models.BigIntegerField(primary_key=True, db_column='MEMBER_ID', db_comment='メンバーID')
    member_name = models.CharField(max_length=50, db_column='MEMBER_NAME', db_comment='メンバー名')
    
    # 共通カラム
    db_update_date = models.DateField(auto_now=True, db_column='DB_UPDATE_DATE', db_comment='DB更新日時')
    db_update_user = models.CharField(max_length=50, db_column='DB_UPDATE_USER', db_comment='DB更新者')
    db_insert_date = models.DateField(auto_now_add=True, db_column='DB_INSERT_DATE', db_comment='DB登録日時')
    db_insert_user = models.CharField(max_length=50, db_column='DB_INSERT_USER', db_comment='DB登録者')

    class Meta:
        managed = False  # Djangoはテーブルを勝手にいじらないモード
        db_table = 'T_MEMBER'

    def __str__(self):
        return self.member_name  # 管理画面にはメンバー名を表示する


class Category(models.Model):
    category_id = models.BigIntegerField(primary_key=True, db_column='CATEGORY_ID', db_comment='カテゴリID')
    category_name = models.CharField(max_length=50, db_column='CATEGORY_NAME', db_comment='カテゴリ名')
    
    # 共通カラム
    db_update_date = models.DateField(auto_now=True, db_column='DB_UPDATE_DATE', db_comment='DB更新日時')
    db_update_user = models.CharField(max_length=50, db_column='DB_UPDATE_USER', db_comment='DB更新者')
    db_insert_date = models.DateField(auto_now_add=True, db_column='DB_INSERT_DATE', db_comment='DB登録日時')
    db_insert_user = models.CharField(max_length=50, db_column='DB_INSERT_USER', db_comment='DB登録者')

    class Meta:
        managed = False  # Djangoはテーブルを勝手にいじらないモード
        db_table = 'T_CATEGORY'

    def __str__(self):
        return self.category_name  # 管理画面にはカテゴリ名を表示する


class Expenses(models.Model):
    expenses_id = models.BigIntegerField(primary_key=True, db_column='EXPENSES_ID', db_comment='出費ID')
    use_date = models.DateField(db_column='USE_DATE', db_comment='取引日')
    shop = models.CharField(max_length=255, db_column='SHOP', db_comment='店名')
    amount = models.IntegerField(db_column='AMOUNT', db_comment='金額')
    memo = models.CharField(max_length=255, blank=True, null=True, db_column='MEMO', db_comment='メモ')
    is_closed = models.BooleanField(db_column='IS_CLOSED', db_comment='確定フラグ')
    source_file = models.CharField(max_length=255, blank=True, null=True, db_column='SOURCE_FILE', db_comment='取り込みファイル名')
    
    # ポイント①：単なる数値ではなく、ForeignKeyとしてモデル同士を紐付ける
    # (db_constraint=False にすることで、Oracle側へ余計なFK制約を作りにいかない安全仕様です)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, blank=True, null=True, db_column='CATEGORY_ID', db_constraint=False, db_comment='カテゴリID')
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, blank=True, null=True, db_column='MEMBER_ID', db_constraint=False, db_comment='メンバーID')

    # 共通カラム
    db_update_date = models.DateField(auto_now=True, db_column='DB_UPDATE_DATE', db_comment='DB更新日時')
    db_update_user = models.CharField(max_length=50, db_column='DB_UPDATE_USER', db_comment='DB更新者')
    db_insert_date = models.DateField(auto_now_add=True, db_column='DB_INSERT_DATE', db_comment='DB登録日時')
    db_insert_user = models.CharField(max_length=50, db_column='DB_INSERT_USER', db_comment='DB登録者')

    class Meta:
        managed = False  # Djangoはテーブルを勝手にいじらないモード
        db_table = 'T_EXPENSES'