"""
Bildirishnoma dispatcher — barcha Telegram xabarlari fonda (thread) yuboriladi,
shu sababli HTTP so'rovni hech qachon bloklamaydi va xato bo'lsa ham qulatmaydi.
"""
import logging
import threading

logger = logging.getLogger(__name__)


def _run_bg(fn, *args):
    """Funksiyani daemon thread'da ishga tushirish (fire-and-forget).
    Thread Django ORM ishlatadi — tugagach DB ulanishini yopamiz, aks holda
    ulanishlar to'planib backend vaqti-vaqti bilan ishlamay qoladi."""
    def runner():
        from django.db import close_old_connections
        close_old_connections()
        try:
            fn(*args)
        finally:
            close_old_connections()
    threading.Thread(target=runner, daemon=True).start()


# ── Public API (views shulardan chaqiradi) ──────────────────────────────────────

def notify_debt_created(debt_id: int):
    _run_bg(_notify_debt_created, debt_id)


def notify_payment_made(payment_id: int):
    _run_bg(_notify_payment_made, payment_id)


def send_overdue_reminders():
    # Bu cron/management command'dan chaqiriladi — sinxron bo'lgani ma'qul
    _send_overdue_reminders()


# ── Inner workers (thread ichida ishlaydi) ──────────────────────────────────────

def _notify_debt_created(debt_id: int):
    try:
        from apps.debts.models import Debt
        from apps.notifications import bot
        debt = Debt.objects.select_related('user', 'contact').get(id=debt_id)
        bot.notify_debt_created(debt)
    except Exception as e:
        logger.error('notify_debt_created: %s', e)


def _notify_payment_made(payment_id: int):
    try:
        from apps.debts.models import Payment
        from apps.notifications import bot
        payment = Payment.objects.select_related('debt__user', 'debt__contact').get(id=payment_id)
        bot.notify_payment_made(payment)
    except Exception as e:
        logger.error('notify_payment_made: %s', e)


def _send_overdue_reminders():
    try:
        from datetime import timedelta
        from django.utils import timezone
        from apps.debts.models import Debt
        from apps.notifications import bot

        today = timezone.now().date()
        tomorrow = today + timedelta(days=1)

        base = Debt.objects.filter(
            status__in=['active', 'partial'],
            user__notifications_enabled=True,
            user__telegram_id__isnull=False,
        ).select_related('user', 'contact')

        jobs = [
            (base.filter(due_date__lt=today),    'overdue',   lambda d: bot.notify_overdue(d)),
            (base.filter(due_date=today),         'due_today', lambda d: bot.notify_due_soon(d, 0)),
            (base.filter(due_date=tomorrow),      'due_tmrw',  lambda d: bot.notify_due_soon(d, 1)),
        ]

        sent = 0
        for qs, tag, fn in jobs:
            for debt in qs:
                try:
                    fn(debt)
                    sent += 1
                except Exception as e:
                    logger.error('%s (debt=%s): %s', tag, debt.id, e)

        logger.info('Due reminders sent: %s', sent)
    except Exception as e:
        logger.error('send_overdue_reminders: %s', e)


# Legacy helper — boshqa joylardan chaqirilsa ham ishlaydi
def _send_telegram_message(chat_id: int, text: str):
    from apps.notifications.bot import send
    send(chat_id, text)
