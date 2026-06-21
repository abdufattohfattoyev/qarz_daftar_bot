from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'telegram_badge', 'full_name', 'telegram_username',
        'language', 'currency', 'debt_count', 'contact_count', 'created_at',
    ]
    list_filter  = ['language', 'currency', 'is_active', 'is_staff']
    search_fields = ['full_name', 'telegram_username', 'telegram_id', 'phone']
    ordering     = ['-created_at']
    readonly_fields = ['telegram_id', 'created_at', 'updated_at', 'last_login', 'date_joined']
    list_per_page = 30
    date_hierarchy = 'created_at'
    actions = ['reset_pin']

    @admin.action(description="PIN kodni tiklash (o'chirish)")
    def reset_pin(self, request, queryset):
        n = queryset.update(pin_code='')
        self.message_user(request, f"{n} ta foydalanuvchi PIN kodi tiklandi")

    fieldsets = (
        ('Telegram', {'fields': ('telegram_id', 'telegram_username', 'full_name', 'photo_url')}),
        ('Sozlamalar', {'fields': ('language', 'currency', 'notifications_enabled', 'phone')}),
        ('Huquqlar', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Vaqtlar', {'fields': ('created_at', 'updated_at', 'last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {'fields': ('username', 'password1', 'password2')}),
    )

    @admin.display(description='Telegram ID')
    def telegram_badge(self, obj):
        if obj.telegram_id:
            return format_html(
                '<span style="font-family:monospace;background:#f1f5f9;padding:2px 6px;border-radius:4px">{}</span>',
                obj.telegram_id,
            )
        return '—'

    @admin.display(description='Qarzlar')
    def debt_count(self, obj):
        c = obj.debts.filter(status__in=['active', 'partial']).count()
        return format_html('<b style="color:#16a34a">{}</b>', c) if c else '0'

    @admin.display(description='Kontaktlar')
    def contact_count(self, obj):
        return obj.contacts.count()
