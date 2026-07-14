from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0004_smslog'),
    ]

    operations = [
        migrations.AddField(
            model_name='appconfig',
            name='sms_mode',
            field=models.CharField(
                choices=[('all', 'Hammaga'), ('selected', 'Tanlangan'), ('off', "O'chiq")],
                default='all', max_length=10, verbose_name='SMS rejimi',
            ),
        ),
    ]
