from rest_framework import serializers
from decimal import Decimal
from .models import Debt, Payment
from apps.contacts.serializers import ContactSerializer


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'amount', 'note', 'paid_at']
        read_only_fields = ['id', 'paid_at']


class DebtSerializer(serializers.ModelSerializer):
    contact_detail = ContactSerializer(source='contact', read_only=True)
    remaining_amount = serializers.ReadOnlyField()
    paid_percent = serializers.ReadOnlyField()
    payments = PaymentSerializer(many=True, read_only=True)
    contact_name = serializers.CharField(source='contact.name', read_only=True)
    contact_initials = serializers.CharField(source='contact.initials', read_only=True)

    class Meta:
        model = Debt
        fields = [
            'id', 'contact', 'contact_name', 'contact_initials',
            'contact_detail', 'debt_type', 'amount', 'paid_amount',
            'remaining_amount', 'paid_percent', 'currency', 'status',
            'note', 'due_date', 'photo', 'payments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'paid_amount', 'status', 'created_at', 'updated_at']

    def validate_contact(self, contact):
        user = self.context['request'].user
        if contact.owner != user:
            raise serializers.ValidationError("Bu kontakt sizga tegishli emas")
        return contact

    def validate_amount(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("Miqdor 0 dan katta bo'lishi kerak")
        return value


class DebtCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Debt
        fields = ['contact', 'debt_type', 'amount', 'currency', 'note', 'due_date', 'photo']

    def validate_contact(self, contact):
        user = self.context['request'].user
        if contact.owner != user:
            raise serializers.ValidationError("Bu kontakt sizga tegishli emas")
        return contact


class PayDebtSerializer(serializers.Serializer):
    """Qarzni to'lash uchun"""
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    note = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_amount(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("To'lov miqdori 0 dan katta bo'lishi kerak")
        return value
