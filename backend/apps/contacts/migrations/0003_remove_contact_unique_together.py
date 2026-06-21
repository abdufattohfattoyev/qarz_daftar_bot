from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('contacts', '0002_initial'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='contact',
            unique_together=set(),
        ),
    ]
