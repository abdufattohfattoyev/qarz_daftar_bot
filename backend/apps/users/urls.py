from django.urls import path
from . import views

urlpatterns = [
    path('telegram/', views.telegram_auth, name='telegram-auth'),
    path('dev-login/', views.dev_login, name='dev-login'),
    path('bot-register/', views.bot_register, name='bot-register'),
    path('bot-state/', views.bot_state, name='bot-state'),
    path('bot-toggle-notif/', views.bot_toggle_notif, name='bot-toggle-notif'),
    path('me/', views.me, name='me'),
    path('pin/set/', views.set_pin, name='pin-set'),
    path('pin/verify/', views.verify_pin, name='pin-verify'),
    path('pin/disable/', views.disable_pin, name='pin-disable'),
    path('refresh/', views.token_refresh_view, name='token-refresh'),
]
