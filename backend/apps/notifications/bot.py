"""
Telegram bot helper — barcha xabar yuborish va keyboard logikasi shu yerda.
"""
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def _api(method, payload):
    token = settings.BOT_TOKEN
    if not token:
        return
    try:
        requests.post(
            f'https://api.telegram.org/bot{token}/{method}',
            json=payload, timeout=6,
        )
    except Exception as e:
        logger.error('Telegram API error [%s]: %s', method, e)


def send(chat_id, text, reply_markup=None):
    payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}
    if reply_markup:
        payload['reply_markup'] = reply_markup
    _api('sendMessage', payload)


def edit(chat_id, message_id, text, reply_markup=None):
    payload = {'chat_id': chat_id, 'message_id': message_id, 'text': text, 'parse_mode': 'HTML'}
    if reply_markup:
        payload['reply_markup'] = reply_markup
    _api('editMessageText', payload)


def answer_callback(callback_id, text=None):
    payload = {'callback_query_id': callback_id}
    if text:
        payload['text'] = text
    _api('answerCallbackQuery', payload)


def send_document(chat_id, file_bytes, filename, caption=None):
    """Fayl (Excel/PDF) yuborish."""
    token = settings.BOT_TOKEN
    if not token:
        return False
    data = {'chat_id': chat_id}
    if caption:
        data['caption'] = caption
        data['parse_mode'] = 'HTML'
    try:
        requests.post(
            f'https://api.telegram.org/bot{token}/sendDocument',
            data=data, files={'document': (filename, file_bytes)}, timeout=30,
        )
        return True
    except Exception as e:
        logger.error('sendDocument error: %s', e)
        return False


def send_photo(chat_id, image_bytes, filename='hisobot.png', caption=None):
    """Rasm yuborish."""
    token = settings.BOT_TOKEN
    if not token:
        return False
    data = {'chat_id': chat_id}
    if caption:
        data['caption'] = caption
        data['parse_mode'] = 'HTML'
    try:
        requests.post(
            f'https://api.telegram.org/bot{token}/sendPhoto',
            data=data, files={'photo': (filename, image_bytes)}, timeout=30,
        )
        return True
    except Exception as e:
        logger.error('sendPhoto error: %s', e)
        return False


# ── Keyboards ──────────────────────────────────────────────────────────────────

def main_menu(notifications_on=True):
    notif_label = '🔔 Eslatma: Yoqiq' if notifications_on else '🔕 Eslatma: O\'chiq'
    return {
        'inline_keyboard': [
            [{'text': '📒 Ilovani ochish', 'web_app': {'url': settings.WEBAPP_URL}}],
            [
                {'text': '📊 Statistika',  'callback_data': 'stats'},
                {'text': notif_label,       'callback_data': 'toggle_notif'},
            ],
            [{'text': '❓ Yordam',          'callback_data': 'help'}],
        ]
    }


def open_app_btn(label='📒 Ilovani ochish'):
    return {'inline_keyboard': [[{'text': label, 'web_app': {'url': settings.WEBAPP_URL}}]]}


# ── Helpers ────────────────────────────────────────────────────────────────────

def fmt_amount(amount, currency):
    return f"{amount:,.0f} {currency}"


def fmt_date(d):
    return d.strftime('%d.%m.%Y') if d else None


def _balance_text(user_obj):
    from apps.debts.models import Debt
    from django.db.models import Sum, Q
    from decimal import Decimal

    def net(currency):
        a = Debt.objects.filter(
            user=user_obj, currency=currency, status__in=['active', 'partial']
        ).aggregate(
            gs=Sum('amount',      filter=Q(debt_type='gave')),
            gp=Sum('paid_amount', filter=Q(debt_type='gave')),
            rs=Sum('amount',      filter=Q(debt_type='got')),
            rp=Sum('paid_amount', filter=Q(debt_type='got')),
        )
        gave = (a['gs'] or Decimal(0)) - (a['gp'] or Decimal(0))
        got  = (a['rs'] or Decimal(0)) - (a['rp'] or Decimal(0))
        return gave, got

    lines = []
    for cur in ('UZS', 'USD'):
        gave, got = net(cur)
        if not gave and not got:
            continue
        n = gave - got
        sign = '🟢' if n >= 0 else '🔴'
        lines += [
            f"<b>{cur}:</b>",
            f"  ↗ Menga berishadi: <b>{fmt_amount(gave, cur)}</b>",
            f"  ↙ Men beraman:     <b>{fmt_amount(got,  cur)}</b>",
            f"  {sign} Sof balans:  <b>{fmt_amount(abs(n), cur)}</b>",
            "",
        ]
    return '\n'.join(lines) if lines else None


# ── Command handlers ───────────────────────────────────────────────────────────

def handle_start(chat_id, user_obj=None):
    if user_obj:
        name    = user_obj.full_name or user_obj.telegram_username or 'Foydalanuvchi'
        balance = _balance_text(user_obj)
        if balance:
            text = f"👋 Xush kelibsiz, <b>{name}</b>!\n\n📊 <b>Joriy holat:</b>\n\n{balance}"
        else:
            text = f"👋 Xush kelibsiz, <b>{name}</b>!\n\nHozircha faol qarzlar yo'q."
        send(chat_id, text, reply_markup=main_menu(user_obj.notifications_enabled))
    else:
        text = (
            "👋 <b>Qarz Yordamchi</b>ga xush kelibsiz!\n\n"
            "Qarzlaringizni kuzatib borish uchun ilovani oching."
        )
        send(chat_id, text, reply_markup=main_menu())


def handle_stats(chat_id, message_id, user_obj):
    from apps.debts.models import Debt
    balance = _balance_text(user_obj)
    total   = Debt.objects.filter(user=user_obj, status__in=['active', 'partial']).count()

    if balance:
        text = f"📊 <b>Statistika</b>\n\n{balance}📋 Jami faol qarzlar: <b>{total} ta</b>"
    else:
        text = "📊 <b>Statistika</b>\n\nHozircha faol qarzlar yo'q."

    edit(chat_id, message_id, text, reply_markup=back_btn())


def handle_help(chat_id, message_id):
    text = (
        "❓ <b>Yordam</b>\n\n"
        "📒 <b>Ilovani ochish</b> — qarz kiritish va boshqarish\n"
        "📊 <b>Statistika</b> — joriy balans va qarzlar\n"
        "🔔 <b>Eslatma</b> — bildirishnomalarni yoqish/o'chirish\n\n"
        "Qarz kiritish, to'lov qilish va batafsil ma'lumot uchun ilovani oching."
    )
    edit(chat_id, message_id, text, reply_markup=back_btn())


def handle_toggle_notif(chat_id, message_id, callback_id, user_obj):
    user_obj.notifications_enabled = not user_obj.notifications_enabled
    user_obj.save(update_fields=['notifications_enabled'])

    if user_obj.notifications_enabled:
        answer_callback(callback_id, '🔔 Bildirishnomalar yoqildi')
    else:
        answer_callback(callback_id, '🔕 Bildirishnomalar o\'chirildi')

    # Tugma labelini yangilaymiz
    name    = user_obj.full_name or user_obj.telegram_username or 'Foydalanuvchi'
    balance = _balance_text(user_obj)
    if balance:
        text = f"👋 Xush kelibsiz, <b>{name}</b>!\n\n📊 <b>Joriy holat:</b>\n\n{balance}"
    else:
        text = f"👋 Xush kelibsiz, <b>{name}</b>!\n\nHozircha faol qarzlar yo'q."
    edit(chat_id, message_id, text, reply_markup=main_menu(user_obj.notifications_enabled))


def back_btn():
    return {'inline_keyboard': [[{'text': '← Orqaga', 'callback_data': 'back'}]]}


# ── Notifications ──────────────────────────────────────────────────────────────

def notify_debt_created(debt):
    if not debt.user.telegram_id or not debt.user.notifications_enabled:
        return
    arrow = '↗' if debt.debt_type == 'gave' else '↙'
    color = '🟢' if debt.debt_type == 'gave' else '🔴'
    label = 'Berdim' if debt.debt_type == 'gave' else 'Oldim'

    lines = [f"{color} <b>Yangi qarz — {label}</b>\n",
             f"👤 <b>{debt.contact.name}</b>",
             f"{arrow} <b>{fmt_amount(debt.amount, debt.currency)}</b>"]
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
    pct = max(0, min(100, pct))
    filled = pct // 10
    bar = '█' * filled + '░' * (10 - filled)

    lines = [f"✅ <b>To'lov qabul qilindi</b>\n",
             f"👤 <b>{debt.contact.name}</b>",
             f"💵 To'landi: <b>{fmt_amount(payment.amount, debt.currency)}</b>",
             f"📊 {bar} {pct}%"]
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
    label = 'Menga qaytarishi kerak' if debt.debt_type == 'gave' else 'Men qaytaraman'
    text = (
        f"⚠️ <b>Qarz muddati o'tdi!</b>\n\n"
        f"👤 <b>{debt.contact.name}</b>\n"
        f"💰 <b>{fmt_amount(debt.remaining_amount, debt.currency)}</b>\n"
        f"📅 Muddat: {fmt_date(debt.due_date)} (<b>{days} kun oldin</b>)\n"
        f"📌 {label}"
    )
    send(debt.user.telegram_id, text, reply_markup=open_app_btn())


def send_weekly_report(user_obj):
    """Haftalik hisobot — dushanba kunlari cron orqali yuboriladi.
    Faollik yoki faol qarz bo'lmasa yubormaydi (spam bo'lmasin).
    Yuborilgan bo'lsa True qaytaradi."""
    if not user_obj.telegram_id or not user_obj.notifications_enabled:
        return False

    from datetime import timedelta
    from django.utils import timezone
    from django.db.models import Sum, Q
    from apps.debts.models import Debt, Payment

    week_ago = timezone.now() - timedelta(days=7)
    debts = Debt.objects.filter(user=user_obj)
    new_debts = debts.filter(created_at__gte=week_ago)
    payments = Payment.objects.filter(debt__user=user_obj, paid_at__gte=week_ago)
    active = debts.filter(status__in=['active', 'partial'])
    overdue = active.filter(due_date__lt=timezone.now().date()).count()

    balance = _balance_text(user_obj)
    if not new_debts.exists() and not payments.exists() and not balance:
        return False   # hafta bo'sh va faol qarz yo'q — jim turamiz

    lines = ["📅 <b>Haftalik hisobot</b>",
             f"<i>{week_ago.strftime('%d.%m')} — {timezone.now().strftime('%d.%m.%Y')}</i>\n"]

    # Bu haftadagi harakat
    if new_debts.exists() or payments.exists():
        lines.append("📌 <b>Bu hafta:</b>")
        for cur in ('UZS', 'USD'):
            nd = new_debts.filter(currency=cur)
            gave = nd.filter(debt_type='gave').aggregate(s=Sum('amount'))['s']
            got = nd.filter(debt_type='got').aggregate(s=Sum('amount'))['s']
            recv = payments.filter(debt__currency=cur, debt__debt_type='gave').aggregate(s=Sum('amount'))['s']
            paid = payments.filter(debt__currency=cur, debt__debt_type='got').aggregate(s=Sum('amount'))['s']
            if gave:
                lines.append(f"  ↗ Berdim: <b>{fmt_amount(gave, cur)}</b>")
            if got:
                lines.append(f"  ↙ Oldim: <b>{fmt_amount(got, cur)}</b>")
            if recv:
                lines.append(f"  💵 Undirildi: <b>{fmt_amount(recv, cur)}</b>")
            if paid:
                lines.append(f"  ✅ To'ladim: <b>{fmt_amount(paid, cur)}</b>")
        if new_debts.exists():
            lines.append(f"  📋 Yangi qarzlar: <b>{new_debts.count()} ta</b>")
        lines.append("")
    else:
        lines.append("📌 Bu hafta yangi harakat bo'lmadi.\n")

    if balance:
        lines.append("📊 <b>Joriy holat:</b>")
        lines.append(balance.rstrip())
        lines.append("")

    if overdue:
        lines.append(f"⚠️ Muddati o'tgan qarzlar: <b>{overdue} ta</b> — tekshirib chiqing!")
    else:
        lines.append("Yaxshi hafta o'tkazing! 🍀")

    send(user_obj.telegram_id, '\n'.join(lines), reply_markup=open_app_btn('📒 Batafsil ko\'rish'))
    return True


def notify_due_soon(debt, days_left: int):
    """Bugun (0) yoki ertaga (1) muddati tugaydigan qarzlar uchun eslatma."""
    if not debt.user.telegram_id or not debt.user.notifications_enabled:
        return
    label = 'Menga qaytarishi kerak' if debt.debt_type == 'gave' else 'Men qaytaraman'
    if days_left == 0:
        title = "⏰ <b>Bugun muddat!</b>"
        when = "Bugun so'nggi kun"
    else:
        title = "📅 <b>Ertaga muddat!</b>"
        when = "Ertaga so'nggi kun"
    text = (
        f"{title}\n\n"
        f"👤 <b>{debt.contact.name}</b>\n"
        f"💰 <b>{fmt_amount(debt.remaining_amount, debt.currency)}</b>\n"
        f"📅 {when}: {fmt_date(debt.due_date)}\n"
        f"📌 {label}"
    )
    send(debt.user.telegram_id, text, reply_markup=open_app_btn('📒 Ko\'rish'))
