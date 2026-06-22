"""
Muddati o'tgan qarzlar uchun Telegram eslatma yuboradi.
Har kuni cron orqali chaqiriladi:
    docker compose exec backend python manage.py send_reminders
"""
from django.core.management.base import BaseCommand
from apps.notifications.tasks import _send_overdue_reminders


class Command(BaseCommand):
    help = "Muddati o'tgan qarzlar egalariga Telegram eslatma yuboradi"

    def handle(self, *args, **options):
        self.stdout.write('Muddati o\'tgan qarzlar tekshirilmoqda...')
        _send_overdue_reminders()
        self.stdout.write(self.style.SUCCESS('Eslatmalar yuborildi.'))
