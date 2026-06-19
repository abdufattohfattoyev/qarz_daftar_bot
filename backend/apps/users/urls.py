from django.urls import path
from . import views

urlpatterns = [
    path('telegram/', views.telegram_auth, name='telegram-auth'),
    path('me/', views.me, name='me'),
    path('refresh/', views.token_refresh_view, name='token-refresh'),
]
