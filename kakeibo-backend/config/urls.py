"""
configプロジェクトのURL設定

`urlpatterns`リストは、URLをビューにルーティングします。詳細については、以下を参照してください。
https://docs.djangoproject.com/en/4.2/topics/http/urls/

例：

関数ビュー
1. インポートを追加します：`from my_app import views`
2. `urlpatterns`にURLを追加します：`path('', views.home, name='home')`

クラスベースビュー
1. インポートを追加します：`from other_app.views import Home`
2. `urlpatterns`にURLを追加します：`path('', Home.as_view(), name='home')`

別のURLconfを含める
1. `include()`関数をインポートします：`from django.urls import include, path`
2. `urlpatterns`にURLを追加します：`path('blog/', include('blog.urls'))`
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from kakeibo.views import MemberViewSet, CategoryViewSet, ExpensesViewSet
from django.contrib.auth import views as auth_views


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
]
