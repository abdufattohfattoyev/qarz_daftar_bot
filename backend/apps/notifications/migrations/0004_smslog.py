import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('debts', '0001_initial'),
        ('notifications', '0003_appconfig'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SmsLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('recipient_name', models.CharField(blank=True, max_length=200, verbose_name='Qabul qiluvchi')),
                ('recipient_phone', models.CharField(blank=True, max_length=20, verbose_name='Telefon')),
                ('message', models.TextField(blank=True)),
                ('kind', models.CharField(choices=[('reminder', 'Qarz eslatma'), ('otp', 'Tasdiqlash kodi')], default='reminder', max_length=20)),
                ('status', models.CharField(choices=[('sent', 'Yuborildi'), ('failed', 'Xato')], default='sent', max_length=10)),
                ('sms_id', models.CharField(blank=True, max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('debt', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sms_logs', to='debts.debt', verbose_name='Qarz')),
                ('sender', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sms_sent', to=settings.AUTH_USER_MODEL, verbose_name='Yuboruvchi')),
            ],
            options={
                'verbose_name': 'SMS yozuvi',
                'verbose_name_plural': 'SMS yozuvlari',
                'db_table': 'sms_logs',
                'ordering': ['-created_at'],
            },
        ),
    ]
