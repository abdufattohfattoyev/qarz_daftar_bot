from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from apps.users.models import User
from apps.contacts.models import Contact


class Debt(models.Model):
    """Qarz modeli"""
    TYPE_CHOICES = [
        ('gave', 'Men berdim'),   # Men berdim — menga qaytarsin
        ('got', 'Men oldim'),     # Mendan oldi — men qaytaraman
    ]
    STATUS_CHOICES = [
        ('active', 'Faol'),
        ('partial', 'Qisman to\'langan'),
        ('paid', 'To\'liq to\'langan'),
    ]
    CURRENCY_CHOICES = [
        ('UZS', 'So\'m'),
        ('USD', 'Dollar'),
        ('RUB', 'Rubl'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='debts', verbose_name='Foydalanuvchi'
    )
    contact = models.ForeignKey(
        Contact, on_delete=models.CASCADE,
        related_name='debts', verbose_name='Kontakt'
    )
    debt_type = models.CharField(
        max_length=10, choices=TYPE_CHOICES, verbose_name='Turi'
    )
    amount = models.DecimalField(
        max_digits=15, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Miqdor'
    )
    paid_amount = models.DecimalField(
        max_digits=15, decimal_places=2,
        default=Decimal('0'),
        verbose_name='To\'langan miqdor'
    )
    currency = models.CharField(
        max_length=3, choices=CURRENCY_CHOICES,
        default='UZS', verbose_name='Valyuta'
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES,
        default='active', verbose_name='Holat'
    )
    note = models.TextField(blank=True, verbose_name='Izoh')
    due_date = models.DateField(null=True, blank=True, verbose_name='Qaytarish muddati')
    photo = models.ImageField(
        upload_to='debts/', null=True, blank=True, verbose_name='Rasm'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'debts'
        verbose_name = 'Qarz'
        verbose_name_plural = 'Qarzlar'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_debt_type_display()} — {self.contact.name}: {self.amount} {self.currency}'

    @property
    def remaining_amount(self):
        return max(Decimal('0'), self.amount - self.paid_amount)

    @property
    def paid_percent(self):
        if self.amount == 0:
            return 0
        return int((self.paid_amount / self.amount) * 100)

    def update_status(self):
        if self.paid_amount >= self.amount:
            self.status = 'paid'
        elif self.paid_amount > 0:
            self.status = 'partial'
        else:
            self.status = 'active'

    def save(self, *args, **kwargs):
        self.update_status()
        super().save(*args, **kwargs)


class Payment(models.Model):
    """To'lov tarixi"""
    debt = models.ForeignKey(
        Debt, on_delete=models.CASCADE,
        related_name='payments', verbose_name='Qarz'
    )
    amount = models.DecimalField(
        max_digits=15, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='To\'lov miqdori'
    )
    note = models.TextField(blank=True, verbose_name='Izoh')
    paid_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, related_name='payments_made'
    )

    class Meta:
        db_table = 'payments'
        verbose_name = 'To\'lov'
        verbose_name_plural = 'To\'lovlar'
        ordering = ['-paid_at']

    def __str__(self):
        return f'{self.debt.contact.name}: {self.amount} {self.debt.currency}'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Qarz paid_amount ni yangilash
        debt = self.debt
        total_paid = sum(p.amount for p in debt.payments.all())
        debt.paid_amount = total_paid
        debt.save(update_fields=['paid_amount', 'status'])
