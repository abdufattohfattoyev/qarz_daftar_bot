"""
Claude API ulanishini va o'zbekcha qarz parsing'ini tekshirish.

Ishlatish:
    python manage.py test_ai
    python manage.py test_ai "Akmaldan 50 dollar oldim"
"""
from django.core.management.base import BaseCommand
from apps.notifications.ai_parser import parse_debt_text

EXAMPLES = [
    "Diyorga 200 ming berdim",
    "Akmaldan 50 dollar oldim",
    "Farruxga ikki yarim million berdim",
]


class Command(BaseCommand):
    help = "Claude API orqali o'zbekcha qarz parsing'ini sinaydi"

    def add_arguments(self, parser):
        parser.add_argument('text', nargs='?', default=None, help='Sinov uchun gap')

    def handle(self, *args, **options):
        texts = [options['text']] if options['text'] else EXAMPLES
        for t in texts:
            self.stdout.write(f"\n🎤 \"{t}\"")
            data = parse_debt_text(t)
            if data:
                self.stdout.write(self.style.SUCCESS(f"   ✅ {data}"))
            else:
                self.stdout.write(self.style.ERROR("   ❌ Ajratib bo'lmadi (API kalitni tekshiring)"))
