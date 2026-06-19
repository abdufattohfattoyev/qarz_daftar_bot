import json
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.conf import settings


@csrf_exempt
def telegram_webhook(request):
    """Telegram Bot webhook"""
    if request.method != 'POST':
        return JsonResponse({'ok': False})

    try:
        data = json.loads(request.body)
        message = data.get('message', {})
        text = message.get('text', '')
        chat_id = message.get('chat', {}).get('id')

        if not chat_id:
            return JsonResponse({'ok': True})

        # /start komandasi
        if text.startswith('/start'):
            _send_start_message(chat_id)

        # /stats komandasi
        elif text == '/stats':
            _send_stats_message(chat_id)

    except Exception:
        pass

    return JsonResponse({'ok': True})


def _send_start_message(chat_id):
    from apps.notifications.tasks import _send_telegram_message
    webapp_url = settings.WEBAPP_URL
    text = (
        "👋 Qarz daftar botiga xush kelibsiz!\n\n"
        "Bu bot orqali qarzlaringizni osongina boshqarishingiz mumkin.\n\n"
        f"📱 Ilovani ochish uchun quyidagi tugmani bosing:"
    )
    import requests
    token = settings.BOT_TOKEN
    if not token:
        return
    requests.post(
        f'https://api.telegram.org/bot{token}/sendMessage',
        json={
            'chat_id': chat_id,
            'text': text,
            'reply_markup': {
                'inline_keyboard': [[{
                    'text': '📒 Qarz daftarni ochish',
                    'web_app': {'url': webapp_url}
                }]]
            }
        },
        timeout=5
    )


def _send_stats_message(chat_id):
    from apps.users.models import User
    from apps.notifications.tasks import _send_telegram_message
    try:
        user = User.objects.get(telegram_id=chat_id)
        from apps.debts.models import Debt
        from django.db.models import Sum
        from decimal import Decimal

        gave = Debt.objects.filter(
            user=user, debt_type='gave',
            status__in=['active', 'partial'], currency='UZS'
        ).aggregate(s=Sum('amount'), p=Sum('paid_amount'))

        got = Debt.objects.filter(
            user=user, debt_type='got',
            status__in=['active', 'partial'], currency='UZS'
        ).aggregate(s=Sum('amount'), p=Sum('paid_amount'))

        gave_rem = (gave['s'] or Decimal(0)) - (gave['p'] or Decimal(0))
        got_rem = (got['s'] or Decimal(0)) - (got['p'] or Decimal(0))

        text = (
            f"📊 Sizning statistikangiz:\n\n"
            f"📤 Menga berishadi: {gave_rem:,.0f} UZS\n"
            f"📥 Men beraman: {got_rem:,.0f} UZS\n"
            f"💰 Sof balans: {gave_rem - got_rem:,.0f} UZS"
        )
        _send_telegram_message(chat_id, text)
    except User.DoesNotExist:
        _send_telegram_message(chat_id, "Avval ilovani oching va ro'yxatdan o'ting.")
