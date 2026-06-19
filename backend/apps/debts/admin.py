from django.contrib import admin
from .models import Debt, Payment


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ['paid_at']


@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = ['contact', 'user', 'debt_type', 'amount', 'paid_amount', 'currency', 'status', 'created_at']
    list_filter = ['debt_type', 'status', 'currency']
    search_fields = ['contact__name', 'user__full_name', 'note']
    readonly_fields = ['paid_amount', 'status', 'created_at', 'updated_at']
    inlines = [PaymentInline]
    raw_id_fields = ['user', 'contact']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['debt', 'amount', 'paid_at', 'created_by']
    readonly_fields = ['paid_at']
