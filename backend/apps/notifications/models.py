from django.db import models
from apps.users.models import User


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
