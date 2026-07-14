from django.db import models
from apps.users.models import User


class AppConfig(models.Model):
    """Global ilova sozlamalari — singleton (har doim id=1)."""
    SMS_MODE_CHOICES = [
        ('all', 'Hammaga'),          # barcha (telefoni tasdiqlangan) foydalanuvchilar
        ('selected', 'Tanlangan'),   # faqat user.sms_allowed=True bo'lganlar
        ('off', "O'chiq"),           # hech kim
    ]
    sms_enabled = models.BooleanField(default=True)  # eski maydon (ishlatilmaydi)
    sms_mode = models.CharField(max_length=10, choices=SMS_MODE_CHOICES, default='all',
                                verbose_name='SMS rejimi')
    updated_at = models.DateTimeField(auto_now=True)

    def user_can_send(self, user):
        """Shu foydalanuvchi SMS yubora oladimi (rejim bo'yicha)."""
        if self.sms_mode == 'off':
            return False
        if self.sms_mode == 'all':
            return True
        return bool(getattr(user, 'sms_allowed', False))  # 'selected'

    class Meta:
        db_table = 'app_config'
        verbose_name = 'Ilova sozlamasi'
        verbose_name_plural = 'Ilova sozlamalari'

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class SmsLog(models.Model):
    """Yuborilgan har bir SMS yozuvi — kim, kimga, qanday matn, holati."""
    KIND_CHOICES = [('reminder', 'Qarz eslatma'), ('otp', 'Tasdiqlash kodi')]
    STATUS_CHOICES = [('sent', 'Yuborildi'), ('failed', 'Xato')]

    sender = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='sms_sent', verbose_name='Yuboruvchi'
    )
    debt = models.ForeignKey(
        'debts.Debt', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='sms_logs', verbose_name='Qarz'
    )
    recipient_name = models.CharField(max_length=200, blank=True, verbose_name='Qabul qiluvchi')
    recipient_phone = models.CharField(max_length=20, blank=True, verbose_name='Telefon')
    message = models.TextField(blank=True)
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default='reminder')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')
    sms_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sms_logs'
        verbose_name = 'SMS yozuvi'
        verbose_name_plural = 'SMS yozuvlari'
        ordering = ['-created_at']


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
