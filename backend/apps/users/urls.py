from django.urls import path
from . import views
from . import admin_api

urlpatterns = [
    path('telegram/', views.telegram_auth, name='telegram-auth'),
    path('dev-login/', views.dev_login, name='dev-login'),
    # Kod orqali web kirish
    path('bot-gen-code/', views.bot_gen_login_code, name='bot-gen-code'),
    path('code-login/', views.code_login, name='code-login'),
    # Admin panel API
    path('admin/overview/', admin_api.admin_overview, name='admin-overview'),
    path('admin/users/', admin_api.admin_users, name='admin-users'),
    path('admin/user/<int:user_id>/debts/', admin_api.admin_user_debts, name='admin-user-debts'),
    path('admin/broadcast/', admin_api.admin_broadcast, name='admin-broadcast'),
    path('admin/broadcast/<str:bc_id>/status/', admin_api.admin_broadcast_status, name='admin-broadcast-status'),
    path('bot-register/', views.bot_register, name='bot-register'),
    path('bot-state/', views.bot_state, name='bot-state'),
    path('bot-toggle-notif/', views.bot_toggle_notif, name='bot-toggle-notif'),
    path('bot-users/', views.bot_users, name='bot-users'),
    path('bot-parse-debt/', views.bot_parse_debt, name='bot-parse-debt'),
    path('bot-create-debt/', views.bot_create_debt, name='bot-create-debt'),
    path('bot-pay-debt/', views.bot_pay_debt, name='bot-pay-debt'),
    path('me/', views.me, name='me'),
    path('app-meta/', views.app_meta, name='app-meta'),
    path('pin/set/', views.set_pin, name='pin-set'),
    path('pin/verify/', views.verify_pin, name='pin-verify'),
    path('pin/disable/', views.disable_pin, name='pin-disable'),
    path('phone/send-code/', views.send_phone_code, name='phone-send-code'),
    path('phone/verify-code/', views.verify_phone_code, name='phone-verify-code'),
    path('refresh/', views.token_refresh_view, name='token-refresh'),
]
