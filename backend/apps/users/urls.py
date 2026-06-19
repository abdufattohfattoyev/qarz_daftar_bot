from django.urls import path
from . import views

urlpatterns = [
    path('telegram/', views.telegram_auth, name='telegram-auth'),
    path('dev-login/', views.dev_login, name='dev-login'),
    path('me/', views.me, name='me'),
    path('refresh/', views.token_refresh_view, name='token-refresh'),
]
