import logging
logger = logging.getLogger(__name__)


def notify_debt_created(debt_id: int):
    try:
        from apps.debts.models import Debt
        from apps.notifications import bot
        debt = Debt.objects.select_related('user', 'contact').get(id=debt_id)
        bot.notify_debt_created(debt)
    except Exception as e:
        logger.error('notify_debt_created: %s', e)


def notify_payment_made(payment_id: int):
    try:
        from apps.debts.models import Payment
        from apps.notifications import bot
        payment = Payment.objects.select_related('debt__user', 'debt__contact').get(id=payment_id)
        bot.notify_payment_made(payment)
    except Exception as e:
        logger.error('notify_payment_made: %s', e)


def send_overdue_reminders():
    try:
        from django.utils import timezone
        from apps.debts.models import Debt
        from apps.notifications import bot

        overdue = Debt.objects.filter(
            status__in=['active', 'partial'],
            due_date__lt=timezone.now().date(),
            user__notifications_enabled=True,
        ).select_related('user', 'contact')

        for debt in overdue:
            bot.notify_overdue(debt)
    except Exception as e:
        logger.error('send_overdue_reminders: %s', e)


# Legacy helper — boshqa joylardan chaqirilsa ham ishlaydi
def _send_telegram_message(chat_id: int, text: str):
    from apps.notifications.bot import send
    send(chat_id, text)
