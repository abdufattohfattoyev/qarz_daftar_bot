from django.db import models
from apps.users.models import User


class Contact(models.Model):
    """Foydalanuvchining kontaktlari"""
    CATEGORY_CHOICES = [
        ('friends', 'Do\'stlar'),
        ('family', 'Qarindoshlar'),
        ('work', 'Ish'),
        ('other', 'Boshqa'),
    ]

    owner = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='contacts', verbose_name='Egasi'
    )
    name = models.CharField(max_length=200, verbose_name='Ism')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Telefon')
    telegram_id = models.BigIntegerField(null=True, blank=True, verbose_name='Telegram ID')
    telegram_username = models.CharField(max_length=100, blank=True)
    photo = models.ImageField(upload_to='contacts/', null=True, blank=True)
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES,
        default='other', verbose_name='Kategoriya'
    )
    note = models.TextField(blank=True, verbose_name='Izoh')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contacts'
        verbose_name = 'Kontakt'
        verbose_name_plural = 'Kontaktlar'
        ordering = ['-created_at']
        unique_together = [['owner', 'phone']]

    def __str__(self):
        return f'{self.name} ({self.owner})'

    @property
    def balance_uzs(self):
        """Kontakt bo'yicha UZS balansi"""
        from apps.debts.models import Debt
        debts = Debt.objects.filter(
            contact=self, currency='UZS', status__in=['active', 'partial']
        )
        gave = sum(d.remaining_amount for d in debts if d.debt_type == 'gave')
        got = sum(d.remaining_amount for d in debts if d.debt_type == 'got')
        return gave - got

    @property
    def balance_usd(self):
        """Kontakt bo'yicha USD balansi"""
        from apps.debts.models import Debt
        debts = Debt.objects.filter(
            contact=self, currency='USD', status__in=['active', 'partial']
        )
        gave = sum(d.remaining_amount for d in debts if d.debt_type == 'gave')
        got = sum(d.remaining_amount for d in debts if d.debt_type == 'got')
        return gave - got

    @property
    def initials(self):
        parts = self.name.split()
        if len(parts) >= 2:
            return f'{parts[0][0]}{parts[1][0]}'.upper()
        return self.name[:2].upper()
