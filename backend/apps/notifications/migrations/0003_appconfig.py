from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AppConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sms_enabled', models.BooleanField(default=True, verbose_name='SMS eslatma yoqilgan (barcha foydalanuvchilar uchun)')),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Ilova sozlamasi',
                'verbose_name_plural': 'Ilova sozlamalari',
                'db_table': 'app_config',
            },
        ),
    ]
