"""
Bir xil ismli (va bir xil telefonli — yoki ikkalasi ham telefonsiz) dublikat
kontaktlarni bitta kontaktga birlashtiradi. Qarzlar eng eski kontaktga ko'chiriladi.

Ishlatish:
    python manage.py merge_duplicates            # ko'rsatadi (o'zgartirmaydi)
    python manage.py merge_duplicates --apply     # birlashtiradi
"""
from collections import defaultdict
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.contacts.models import Contact
from apps.debts.models import Debt


class Command(BaseCommand):
    help = "Dublikat kontaktlarni birlashtiradi (bir xil ism + telefon)"

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help="O'zgartirishlarni saqlaydi")

    def handle(self, *args, **options):
        apply = options['apply']
        # owner + lower(name) + phone bo'yicha guruhlaymiz
        groups = defaultdict(list)
        for c in Contact.objects.all().order_by('created_at'):
            key = (c.owner_id, c.name.strip().lower(), (c.phone or '').strip())
            groups[key].append(c)

        merged = 0
        moved = 0
        dup_groups = 0       # nechta ism dublikatlangan
        dup_extra = 0        # ortiqcha kontaktlar soni (o'chiriladiganlar)
        for key, items in groups.items():
            if len(items) < 2:
                continue
            dup_groups += 1
            dup_extra += len(items) - 1
            keep = items[0]            # eng eski — saqlanadi
            dups = items[1:]
            phone = keep.phone or 'raqamsiz'
            self.stdout.write(
                f"👥 '{keep.name}' ({phone}) — {len(items)} ta → bittaga birlashtiriladi")
            if apply:
                with transaction.atomic():
                    for d in dups:
                        cnt = Debt.objects.filter(contact=d).update(contact=keep)
                        moved += cnt
                        d.delete()
                        merged += 1

        # Umumiy xulosa
        self.stdout.write("")
        if dup_groups == 0:
            self.stdout.write(self.style.SUCCESS("✅ Dublikat yo'q — hammasi toza!"))
            return
        self.stdout.write(
            f"📊 Jami: {dup_groups} ta ism dublikatlangan, "
            f"{dup_extra} ta ortiqcha kontakt birlashtiriladi.")
        if not apply:
            self.stdout.write(self.style.WARNING(
                "— Bu faqat KO'RSATISH (hech narsa o'zgarmadi).\n"
                "  Birlashtirish uchun: python manage.py merge_duplicates --apply"))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"✅ {merged} ta dublikat o'chirildi, {moved} ta qarz ko'chirildi"))
