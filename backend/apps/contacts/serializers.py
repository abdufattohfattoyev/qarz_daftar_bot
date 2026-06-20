from rest_framework import serializers
from .models import Contact


class ContactSerializer(serializers.ModelSerializer):
    balance_uzs = serializers.ReadOnlyField()
    balance_usd = serializers.ReadOnlyField()
    initials = serializers.ReadOnlyField()

    class Meta:
        model = Contact
        fields = [
            'id', 'name', 'phone', 'telegram_id', 'telegram_username',
            'photo', 'category', 'note', 'balance_uzs', 'balance_usd',
            'initials', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ContactCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        # 'id' va 'balance_uzs' javobga kiritiladi — frontend yangi kontakt id'sini
        # darhol ishlatadi (qarz yaratish uchun shart)
        fields = ['id', 'name', 'phone', 'telegram_id', 'telegram_username',
                  'photo', 'category', 'note', 'balance_uzs']
        read_only_fields = ['id', 'balance_uzs']

    balance_uzs = serializers.ReadOnlyField()

    def validate_phone(self, value):
        if value:
            # Raqamlar va + dan iborat bo'lsin
            cleaned = ''.join(c for c in value if c.isdigit() or c == '+')
            return cleaned
        return value
