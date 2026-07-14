from django.db import models
from apps.users.models import User


class AppConfig(models.Model):
    """Global ilova sozlamalari — singleton (har doim id=1)."""
    sms_enabled = models.BooleanField(
        default=True, verbose_name='SMS eslatma yoqilgan (barcha foydalanuvchilar uchun)'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'app_config'
        verbose_name = 'Ilova sozlamasi'
        verbose_name_plural = 'Ilova sozlamalari'

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Notification(models.Model):
    TYPE_CHOICES = [
        ('debt_created', 'Qarz yaratildi'),
        ('debt_paid', 'Qarz to\'landi'),
        ('reminder', 'Eslatma'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notif_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    body = models.TextField()
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
