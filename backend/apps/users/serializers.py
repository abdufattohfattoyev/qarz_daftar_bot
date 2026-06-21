import hashlib
import hmac
import time
from urllib.parse import parse_qsl
from django.conf import settings
from rest_framework import serializers
from .models import User


class TelegramAuthSerializer(serializers.Serializer):
    """Telegram WebApp initData validatsiyasi"""
    init_data = serializers.CharField()

    def validate_init_data(self, value):
        try:
            # parse_qsl qiymatlarni URL-decode qiladi — Telegram hash'ni aynan
            # decode qilingan qiymatlar ustidan hisoblaydi (avval decode qilinmasdi → "Yaroqsiz imzo")
            parsed = dict(parse_qsl(value, keep_blank_values=True))

            received_hash = parsed.pop('hash', None)
            if not received_hash:
                raise serializers.ValidationError("Hash topilmadi")

            # auth_date tekshiruvi (24 soat)
            auth_date = int(parsed.get('auth_date', 0))
            if time.time() - auth_date > 86400:  # 24 soat
                raise serializers.ValidationError("initData muddati o'tgan")

            # HMAC tekshiruvi — decode qilingan qiymatlar bilan
            data_check_string = '\n'.join(
                f'{k}={v}' for k, v in sorted(parsed.items())
            )
            secret_key = hmac.new(
                b'WebAppData',
                settings.BOT_TOKEN.encode(),
                hashlib.sha256
            ).digest()
            computed_hash = hmac.new(
                secret_key,
                data_check_string.encode(),
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(computed_hash, received_hash):
                raise serializers.ValidationError("Yaroqsiz imzo")

            return parsed
        except serializers.ValidationError:
            raise
        except Exception:
            raise serializers.ValidationError("initData xato formatda")


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.ReadOnlyField()
    has_pin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'telegram_id', 'telegram_username',
            'full_name', 'display_name', 'phone',
            'photo_url', 'currency', 'language',
            'notifications_enabled', 'has_pin', 'created_at'
        ]
        read_only_fields = ['id', 'telegram_id', 'created_at']

    def get_has_pin(self, obj):
        return bool(obj.pin_code)


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['currency', 'language', 'notifications_enabled', 'phone']
