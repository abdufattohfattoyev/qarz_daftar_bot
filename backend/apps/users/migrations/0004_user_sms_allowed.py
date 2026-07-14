from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_user_phone_verified'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='sms_allowed',
            field=models.BooleanField(default=False, verbose_name='SMS yuborishga ruxsat (tanlangan rejim)'),
        ),
    ]
