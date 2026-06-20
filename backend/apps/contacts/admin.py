from django.contrib import admin
from django.utils.html import format_html
from .models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display  = ['name', 'owner_link', 'phone', 'category', 'active_debts', 'balance_uzs_fmt', 'created_at']
    list_filter   = ['category']
    search_fields = ['name', 'phone', 'owner__full_name', 'owner__telegram_username']
    ordering      = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'balance_uzs', 'balance_usd']
    raw_id_fields  = ['owner']
    list_per_page  = 30
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Asosiy', {'fields': ('owner', 'name', 'phone', 'category', 'note')}),
        ('Telegram', {'fields': ('telegram_id', 'telegram_username')}),
        ('Hisob', {'fields': ('balance_uzs', 'balance_usd')}),
        ('Vaqtlar', {'fields': ('created_at', 'updated_at')}),
    )

    @admin.display(description='Egasi')
    def owner_link(self, obj):
        return format_html(
            '<a href="/admin/users/user/{}/change/">{}</a>',
            obj.owner_id,
            obj.owner.full_name or obj.owner.telegram_username or obj.owner_id,
        )

    @admin.display(description='Faol qarzlar')
    def active_debts(self, obj):
        c = obj.debts.filter(status__in=['active', 'partial']).count()
        return format_html('<b style="color:#ef4444">{}</b>', c) if c else '0'

    @admin.display(description='Balans UZS')
    def balance_uzs_fmt(self, obj):
        b = obj.balance_uzs
        color = '#16a34a' if b >= 0 else '#ef4444'
        sign  = '+' if b > 0 else ''
        return format_html('<b style="color:{}">{}{}</b>', color, sign, f'{b:,.0f}')
