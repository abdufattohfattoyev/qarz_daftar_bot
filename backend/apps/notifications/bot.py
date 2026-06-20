"""
Telegram bot helper — barcha xabar yuborish va keyboard logikasi shu yerda.
views.py webhook'dan chaqiradi, tasks.py notification'lardan chaqiradi.
"""
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

API = 'https://api.telegram.org/bot{token}/{method}'


def send(chat_id: int, text: str, reply_markup=None, parse_mode='HTML'):
    token = settings.BOT_TOKEN
    if not token:
        return
    payload = {'chat_id': chat_id, 'text': text, 'parse_mode': parse_mode}
    if reply_markup:
        payload['reply_markup'] = reply_markup
    try:
        requests.post(
            API.format(token=token, method='sendMessage'),
            json=payload, timeout=6,
        )
    except Exception as e:
        logger.error('Telegram send error: %s', e)


def open_app_btn(label='📒 Ilovani ochish'):
    return {'inline_keyboard': [[{'text': label, 'web_app': {'url': settings.WEBAPP_URL}}]]}


# ── Formatted helpers ──────────────────────────────────────────────────────────

def fmt_amount(amount, currency):
    return f"{amount:,.0f} {currency}"


def fmt_date(d):
    return d.strftime('%d.%m.%Y') if d else None


# ── Commands ───────────────────────────────────────────────────────────────────

def handle_start(chat_id, user_obj=None):
    if user_obj:
        from apps.debts.models import Debt
        from django.db.models import Sum
        from decimal import Decimal

        agg = Debt.objects.filter(
            user=user_obj, currency='UZS', status__in=['active', 'partial']
        ).aggregate(
            gave_s=Sum('amount', filter=__import__('django.db.models', fromlist=['Q']).Q(debt_type='gave')),
            gave_p=Sum('paid_amount', filter=__import__('django.db.models', fromlist=['Q']).Q(debt_type='gave')),
            got_s=Sum('amount', filter=__import__('django.db.models', fromlist=['Q']).Q(debt_type='got')),
            got_p=Sum('paid_amount', filter=__import__('django.db.models', fromlist=['Q']).Q(debt_type='got')),
        )
        gave = (agg['gave_s'] or Decimal(0)) - (agg['gave_p'] or Decimal(0))
        got  = (agg['got_s']  or Decimal(0)) - (agg['got_p']  or Decimal(0))
        net  = gave - got

        sign  = '🟢' if net >= 0 else '🔴'
        name  = user_obj.full_name or user_obj.telegram_username or 'Foydalanuvchi'

        text = (
            f"👋 Xush kelibsiz, <b>{name}</b>!\n\n"
            f"📊 <b>Joriy holat (UZS):</b>\n"
            f"  ↗ Menga berishadi: <b>{fmt_amount(gave, 'UZS')}</b>\n"
            f"  ↙ Men beraman:     <b>{fmt_amount(got, 'UZS')}</b>\n"
            f"  {sign} Sof balans:      <b>{fmt_amount(abs(net), 'UZS')}</b>\n\n"
            f"Batafsil ko'rish yoki qarz kiritish uchun ilovani oching 👇"
        )
    else:
        text = (
            "👋 <b>Qarz Daftar</b>ga xush kelibsiz!\n\n"
            "Bu bot qarzlaringizni kuzatib borish uchun.\n\n"
            "Boshlash uchun ilovani oching 👇"
        )
    send(chat_id, text, reply_markup=open_app_btn())


def handle_stats(chat_id, user_obj):
    from apps.debts.models import Debt
    from django.db.models import Sum, Count
    from decimal import Decimal
    from django.db.models import Q

    uzs = Debt.objects.filter(user=user_obj, currency='UZS', status__in=['active', 'partial'])
    usd = Debt.objects.filter(user=user_obj, currency='USD', status__in=['active', 'partial'])

    def net(qs):
        a = qs.aggregate(
            gs=Sum('amount', filter=Q(debt_type='gave')),
            gp=Sum('paid_amount', filter=Q(debt_type='gave')),
            rs=Sum('amount', filter=Q(debt_type='got')),
            rp=Sum('paid_amount', filter=Q(debt_type='got')),
        )
        gave = (a['gs'] or Decimal(0)) - (a['gp'] or Decimal(0))
        got  = (a['rs'] or Decimal(0)) - (a['rp'] or Decimal(0))
        return gave, got

    gave_uzs, got_uzs = net(uzs)
    gave_usd, got_usd = net(usd)
    net_uzs = gave_uzs - got_uzs
    net_usd = gave_usd - got_usd

    total = Debt.objects.filter(user=user_obj, status__in=['active', 'partial']).count()

    lines = [f"📊 <b>Statistika</b>\n"]

    if gave_uzs or got_uzs:
        sign = '🟢' if net_uzs >= 0 else '🔴'
        lines += [
            f"<b>UZS:</b>",
            f"  ↗ Menga berishadi: <b>{fmt_amount(gave_uzs, 'UZS')}</b>",
            f"  ↙ Men beraman:     <b>{fmt_amount(got_uzs, 'UZS')}</b>",
            f"  {sign} Sof balans:  <b>{fmt_amount(abs(net_uzs), 'UZS')}</b>",
            "",
        ]

    if gave_usd or got_usd:
        sign = '🟢' if net_usd >= 0 else '🔴'
        lines += [
            f"<b>USD:</b>",
            f"  ↗ Menga berishadi: <b>{fmt_amount(gave_usd, 'USD')}</b>",
            f"  ↙ Men beraman:     <b>{fmt_amount(got_usd, 'USD')}</b>",
            f"  {sign} Sof balans:  <b>{fmt_amount(abs(net_usd), 'USD')}</b>",
            "",
        ]

    if not (gave_uzs or got_uzs or gave_usd or got_usd):
        lines.append("Hozircha faol qarzlar yo'q.")
    else:
        lines.append(f"📋 Jami faol qarzlar: <b>{total} ta</b>")

    send(chat_id, '\n'.join(lines), reply_markup=open_app_btn())


def handle_help(chat_id):
    text = (
        "🤖 <b>Qarz Daftar Bot</b>\n\n"
        "<b>Buyruqlar:</b>\n"
        "/start — Bosh sahifa va joriy balans\n"
        "/stats — Batafsil statistika\n"
        "/eslatma — Bildirishnomalarni yoqish/o'chirish\n"
        "/help — Ushbu yordam\n\n"
        "Qarz kiritish va boshqarish uchun ilovani oching 👇"
    )
    send(chat_id, text, reply_markup=open_app_btn())


def handle_eslatma(chat_id, user_obj):
    user_obj.notifications_enabled = not user_obj.notifications_enabled
    user_obj.save(update_fields=['notifications_enabled'])
    if user_obj.notifications_enabled:
        send(chat_id, "🔔 Bildirishnomalar <b>yoqildi</b>.")
    else:
        send(chat_id, "🔕 Bildirishnomalar <b>o'chirildi</b>.")


# ── Notification messages ──────────────────────────────────────────────────────

def notify_debt_created(debt):
    if not debt.user.telegram_id or not debt.user.notifications_enabled:
        return
    arrow = '↗' if debt.debt_type == 'gave' else '↙'
    label = 'Berdim' if debt.debt_type == 'gave' else 'Oldim'
    color = '🟢' if debt.debt_type == 'gave' else '🔴'

    lines = [
        f"{color} <b>Yangi qarz — {label}</b>\n",
        f"👤 <b>{debt.contact.name}</b>",
        f"{arrow} <b>{fmt_amount(debt.amount, debt.currency)}</b>",
    ]
    if debt.note:
        lines.append(f"💬 {debt.note}")
    if debt.due_date:
        lines.append(f"📅 Muddat: {fmt_date(debt.due_date)}")

    send(debt.user.telegram_id, '\n'.join(lines), reply_markup=open_app_btn('📒 Ko\'rish'))


def notify_payment_made(payment):
    debt = payment.debt
    user = debt.user
    if not user.telegram_id or not user.notifications_enabled:
        return

    pct = int((debt.paid_amount / debt.amount) * 100) if debt.amount else 0
    bar = '█' * (pct // 10) + '░' * (10 - pct // 10)

    lines = [
        f"✅ <b>To'lov qabul qilindi</b>\n",
        f"👤 <b>{debt.contact.name}</b>",
        f"💵 To'landi: <b>{fmt_amount(payment.amount, debt.currency)}</b>",
        f"📊 {bar} {pct}%",
    ]
    if debt.status == 'paid':
        lines.append("\n🎉 <b>Qarz to'liq yopildi!</b>")
    else:
        lines.append(f"⏳ Qoldi: <b>{fmt_amount(debt.remaining_amount, debt.currency)}</b>")

    if payment.note:
        lines.append(f"💬 {payment.note}")

    send(user.telegram_id, '\n'.join(lines), reply_markup=open_app_btn())


def notify_overdue(debt):
    if not debt.user.telegram_id or not debt.user.notifications_enabled:
        return
    from datetime import date
    days = (date.today() - debt.due_date).days
    label = 'Berdim (menga qaytarishi kerak)' if debt.debt_type == 'gave' else 'Oldim (men qaytaraman)'
    text = (
        f"⚠️ <b>Qarz muddati o'tdi!</b>\n\n"
        f"👤 <b>{debt.contact.name}</b>\n"
        f"💰 <b>{fmt_amount(debt.remaining_amount, debt.currency)}</b>\n"
        f"📅 Muddat: {fmt_date(debt.due_date)} (<b>{days} kun oldin</b>)\n"
        f"📌 {label}"
    )
    send(debt.user.telegram_id, text, reply_markup=open_app_btn())
