import datetime
from rest_framework import serializers
from .models import Member, Category, Expenses

# DRFのエラーを無視するクラス
class SafeDateField(serializers.DateField):
    def to_representation(self, value):
        # もし中身が datetime 型だったら、安全に date 型に変換して親に渡す
        if isinstance(value, datetime.datetime):
            value = value.date()
        return super().to_representation(value)

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = '__all__'
    
    # 全ての日付フィールドの挙動を安全クラスに強制変更
    serializer_field_mapping = {
        **serializers.ModelSerializer.serializer_field_mapping,
        serializers.models.DateField: SafeDateField
    }

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

    serializer_field_mapping = {
        **serializers.ModelSerializer.serializer_field_mapping,
        serializers.models.DateField: SafeDateField
    }

class ExpensesSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)
    member_detail = MemberSerializer(source='member', read_only=True)

    class Meta:
        model = Expenses
        fields = '__all__'

    # Expenses内のすべての DateField も一網打尽にする
    serializer_field_mapping = {
        **serializers.ModelSerializer.serializer_field_mapping,
        serializers.models.DateField: SafeDateField
    }