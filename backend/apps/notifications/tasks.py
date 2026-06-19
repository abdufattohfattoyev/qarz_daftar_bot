import asyncio
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def notify_debt_created(debt_id: int):
    """Yangi qarz yaratilganda Telegram xabar yuborish"""
    try:
        from apps.debts.models import Debt
        debt = Debt.objects.select_related('user', 'contact').get(id=debt_id)

        if not debt.user.telegram_id or not debt.user.notifications_enabled:
            return

        type_emoji = '📤' if debt.debt_type == 'gave' else '📥'
        type_text = 'berdingiz' if debt.debt_type == 'gave' else 'oldingiz'

        text = (
            f"{type_emoji} Yangi qarz\n\n"
            f"👤 Kim bilan: {debt.contact.name}\n"
            f"💰 Miqdor: {debt.amount:,.0f} {debt.currency}\n"
            f"📝 Tur: {debt.get_debt_type_display()}\n"
        )
        if debt.note:
            text += f"💬 Izoh: {debt.note}\n"
        if debt.due_date:
            text += f"📅 Muddat: {debt.due_date.strftime('%d.%m.%Y')}\n"

        _send_telegram_message(debt.user.telegram_id, text)

    except Exception as e:
        logger.error(f"notify_debt_created xatosi: {e}")


def notify_payment_made(payment_id: int):
    """To'lov amalga oshirilganda Telegram xabar"""
    try:
        from apps.debts.models import Payment
        payment = Payment.objects.select_related('debt__user', 'debt__contact').get(id=payment_id)
        debt = payment.debt
        user = debt.user

        if not user.telegram_id or not user.notifications_enabled:
            return

        text = (
            f"✅ To'lov amalga oshirildi\n\n"
            f"👤 Kim: {debt.contact.name}\n"
            f"💰 To'landi: {payment.amount:,.0f} {debt.currency}\n"
            f"📊 Qoldi: {debt.remaining_amount:,.0f} {debt.currency}\n"
        )
        if debt.status == 'paid':
            text += "🎉 Qarz to'liq yopildi!"

        _send_telegram_message(user.telegram_id, text)

    except Exception as e:
        logger.error(f"notify_payment_made xatosi: {e}")


def send_overdue_reminders():
    """Muddati o'tgan qarzlar uchun eslatma"""
    from django.utils import timezone
    from apps.debts.models import Debt

    overdue = Debt.objects.filter(
        status__in=['active', 'partial'],
        due_date__lt=timezone.now().date(),
        user__notifications_enabled=True,
    ).select_related('user', 'contact')

    for debt in overdue:
        if not debt.user.telegram_id:
            continue
        text = (
            f"⚠️ Qarz muddati o'tdi!\n\n"
            f"👤 {debt.contact.name}\n"
            f"💰 {debt.remaining_amount:,.0f} {debt.currency}\n"
            f"📅 Muddat: {debt.due_date.strftime('%d.%m.%Y')}\n"
        )
        _send_telegram_message(debt.user.telegram_id, text)


def _send_telegram_message(chat_id: int, text: str):
    """Telegram API orqali xabar yuborish"""
    import requests
    token = settings.BOT_TOKEN
    if not token:
        return
    try:
        url = f'https://api.telegram.org/bot{token}/sendMessage'
        requests.post(url, json={
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML',
        }, timeout=5)
    except Exception as e:
        logger.error(f"Telegram xabar yuborishda xato: {e}")
