from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.contrib.auth import views as auth_views
from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from kakeibo.views import (
    MemberViewSet, 
    CategoryViewSet, 
    ExpensesViewSet, 
    get_dashboard_summary,
)

# ルーター（案内板）を作成し、作ったビューを登録していく
router = DefaultRouter()
router.register(r'members', MemberViewSet, basename='member')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'expenses', ExpensesViewSet, basename='expense')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # http://localhost:8000/api/ の後ろに、ルーターが作ったURLを合流させる
    path('api/', include(router.urls)),
    path('', auth_views.LoginView.as_view(template_name='kakeibo/login.html'), name='login'),

    # JWT認証用エンドポイント
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # ダッシュボードのサマリー情報を取得するエンドポイント
    path('api/dashboard/', get_dashboard_summary, name='dashboard'),
]

# 独自の404エラーを返す関数（最低限の情報だけ返す）
def custom_404_view(request, exception):
    return render(request, 'kakeibo/404.html', status=404)

# ハンドラーに登録
handler404 = 'config.urls.custom_404_view'