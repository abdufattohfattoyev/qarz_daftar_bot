"""
Haftalik hisobotni barcha foydalanuvchilarga yuboradi.
Scheduler dushanba kunlari chaqiradi:
    docker compose exec backend python manage.py send_weekly_report
"""
from django.core.management.base import BaseCommand
from apps.notifications.tasks import _send_weekly_reports


class Command(BaseCommand):
    help = "Foydalanuvchilarga haftalik Telegram hisobot yuboradi"

    def handle(self, *args, **options):
        self.stdout.write('Haftalik hisobotlar yuborilmoqda...')
        _send_weekly_reports()
        self.stdout.write(self.style.SUCCESS('Haftalik hisobotlar yuborildi.'))
