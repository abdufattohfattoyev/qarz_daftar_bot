"""
TextUP SMS ulanishini tekshirish:
    python manage.py test_sms +998901234567
    python manage.py test_sms +998901234567 --text "Salom, bu test"
"""
from django.core.management.base import BaseCommand

from apps.notifications import sms


class Command(BaseCommand):
    help = 'TextUP orqali test SMS yuboradi'

    def add_arguments(self, parser):
        parser.add_argument('phone', help='Qabul qiluvchi raqam, masalan +998901234567')
        parser.add_argument('--text', default='Test SMS — Qarz Yordamchi (TextUP ulandi)')
        parser.add_argument('--template-id', default=None, help='TextUP shablon UUID (ixtiyoriy)')

    def handle(self, *args, **opts):
        if not sms.is_configured():
            self.stderr.write(self.style.ERROR(
                "TEXTUP_EMAIL / TEXTUP_PASSWORD .env faylda o'rnatilmagan"))
            return
        try:
            sms_id = sms.send_sms(opts['phone'], opts['text'], name='test-sms',
                                  template_id=opts['template_id'])
        except sms.SmsError as e:
            self.stderr.write(self.style.ERROR(f'Xato: {e}'))
            return
        self.stdout.write(self.style.SUCCESS(f'Yuborildi! smsId={sms_id}'))
