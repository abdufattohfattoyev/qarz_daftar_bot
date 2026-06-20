import json
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse


@csrf_exempt
def telegram_webhook(request):
    if request.method != 'POST':
        return JsonResponse({'ok': False})

    try:
        data    = json.loads(request.body)
        message = data.get('message', {})
        text    = message.get('text', '').strip()
        chat_id = message.get('chat', {}).get('id')

        if not chat_id or not text:
            return JsonResponse({'ok': True})

        from apps.users.models import User
        from apps.notifications import bot

        try:
            user = User.objects.get(telegram_id=chat_id)
        except User.DoesNotExist:
            user = None

        cmd = text.split()[0].lower()

        if cmd == '/start':
            bot.handle_start(chat_id, user)

        elif cmd == '/stats':
            if user:
                bot.handle_stats(chat_id, user)
            else:
                bot.send(chat_id, "Avval ilovani ochib ro'yxatdan o'ting.", reply_markup=bot.open_app_btn())

        elif cmd == '/eslatma':
            if user:
                bot.handle_eslatma(chat_id, user)
            else:
                bot.send(chat_id, "Avval ilovani ochib ro'yxatdan o'ting.", reply_markup=bot.open_app_btn())

        elif cmd == '/help':
            bot.handle_help(chat_id)

        else:
            bot.send(
                chat_id,
                "Buyruqni bilmadim. /help — yordam.",
                reply_markup=bot.open_app_btn(),
            )

    except Exception:
        pass

    return JsonResponse({'ok': True})
