from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_user_sms_allowed'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='real_name',
            field=models.CharField(blank=True, max_length=100, verbose_name='Haqiqiy ism (SMS uchun)'),
        ),
    ]
