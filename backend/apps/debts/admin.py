from django.contrib import admin
from django.utils.html import format_html
from .models import Debt, Payment


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ['paid_at']
    fields = ['amount', 'note', 'paid_at', 'created_by']


@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display  = [
        'contact_name', 'owner_name', 'type_badge', 'amount_fmt',
        'paid_fmt', 'remaining_fmt', 'currency', 'status_badge', 'due_date', 'created_at',
    ]
    list_filter   = ['debt_type', 'status', 'currency']
    search_fields = ['contact__name', 'user__full_name', 'user__telegram_username', 'note']
    ordering      = ['-created_at']
    readonly_fields = ['paid_amount', 'status', 'created_at', 'updated_at']
    inlines       = [PaymentInline]
    raw_id_fields  = ['user', 'contact']
    list_per_page  = 30
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Asosiy', {'fields': ('user', 'contact', 'debt_type', 'amount', 'currency')}),
        ('Holat', {'fields': ('paid_amount', 'status', 'due_date', 'note')}),
        ('Vaqtlar', {'fields': ('created_at', 'updated_at')}),
    )

    @admin.display(description='Kontakt')
    def contact_name(self, obj):
        return obj.contact.name

    @admin.display(description='Foydalanuvchi')
    def owner_name(self, obj):
        return format_html(
            '<a href="/admin/users/user/{}/change/">{}</a>',
            obj.user_id,
            obj.user.full_name or obj.user.telegram_username or obj.user_id,
        )

    @admin.display(description='Turi')
    def type_badge(self, obj):
        if obj.debt_type == 'gave':
            return format_html('<span style="color:#16a34a;font-weight:700">↗ Berdim</span>')
        return format_html('<span style="color:#ef4444;font-weight:700">↙ Oldim</span>')

    @admin.display(description='Summa')
    def amount_fmt(self, obj):
        return f'{obj.amount:,.0f}'

    @admin.display(description='To\'landi')
    def paid_fmt(self, obj):
        if obj.paid_amount:
            return format_html('<span style="color:#16a34a">{}</span>', f'{obj.paid_amount:,.0f}')
        return '—'

    @admin.display(description='Qoldi')
    def remaining_fmt(self, obj):
        r = obj.remaining_amount
        if r > 0:
            return format_html('<b style="color:#f97316">{}</b>', f'{r:,.0f}')
        return format_html('<span style="color:#94a3b8">0</span>')

    @admin.display(description='Holat')
    def status_badge(self, obj):
        colors = {'active': '#ef4444', 'partial': '#f97316', 'paid': '#16a34a'}
        labels = {'active': 'Faol', 'partial': 'Qisman', 'paid': 'Tugadi'}
        c = colors.get(obj.status, '#94a3b8')
        l = labels.get(obj.status, obj.status)
        return format_html(
            '<span style="color:{};font-weight:700;background:{}22;padding:2px 8px;border-radius:99px">{}</span>',
            c, c, l,
        )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = ['contact_name', 'owner_name', 'amount_fmt', 'currency', 'note', 'paid_at']
    search_fields = ['debt__contact__name', 'debt__user__full_name', 'note']
    ordering      = ['-paid_at']
    readonly_fields = ['paid_at']
    raw_id_fields  = ['debt', 'created_by']
    list_per_page  = 30
    date_hierarchy = 'paid_at'

    @admin.display(description='Kontakt')
    def contact_name(self, obj):
        return obj.debt.contact.name

    @admin.display(description='Foydalanuvchi')
    def owner_name(self, obj):
        u = obj.debt.user
        return u.full_name or u.telegram_username or str(u.id)

    @admin.display(description='Summa')
    def amount_fmt(self, obj):
        return format_html('<b style="color:#16a34a">{:,.0f}</b>', obj.amount)

    @admin.display(description='Valyuta')
    def currency(self, obj):
        return obj.debt.currency
