from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Telegram orqali kiruvchi foydalanuvchi"""
    telegram_id = models.BigIntegerField(unique=True, null=True, blank=True)
    telegram_username = models.CharField(max_length=100, blank=True)
    full_name = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    photo_url = models.URLField(blank=True)
    currency = models.CharField(
        max_length=3,
        choices=[('UZS', 'So\'m'), ('USD', 'Dollar'), ('RUB', 'Rubl')],
        default='UZS'
    )
    language = models.CharField(
        max_length=5,
        choices=[('uz', 'O\'zbek'), ('ru', 'Русский')],
        default='uz'
    )
    notifications_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'username'

    class Meta:
        db_table = 'users'
        verbose_name = 'Foydalanuvchi'
        verbose_name_plural = 'Foydalanuvchilar'

    def __str__(self):
        return self.full_name or self.telegram_username or str(self.telegram_id)

    @property
    def display_name(self):
        return self.full_name or self.telegram_username or f'User {self.telegram_id}'
