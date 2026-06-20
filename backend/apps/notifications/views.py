import json
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse


@csrf_exempt
def telegram_webhook(request):
    if request.method != 'POST':
        return JsonResponse({'ok': False})

    try:
        data = json.loads(request.body)
        from apps.users.models import User
        from apps.notifications import bot

        # ── Inline tugma bosildi ──────────────────────────────────────────────
        cb = data.get('callback_query')
        if cb:
            callback_id = cb['id']
            chat_id     = cb['message']['chat']['id']
            message_id  = cb['message']['message_id']
            action      = cb.get('data', '')

            try:
                user = User.objects.get(telegram_id=chat_id)
            except User.DoesNotExist:
                user = None

            if action == 'stats':
                bot.answer_callback(callback_id)
                if user:
                    bot.handle_stats(chat_id, message_id, user)
                else:
                    bot.edit(chat_id, message_id, "Avval ilovani oching.", reply_markup=bot.back_btn())

            elif action == 'help':
                bot.answer_callback(callback_id)
                bot.handle_help(chat_id, message_id)

            elif action == 'toggle_notif':
                if user:
                    bot.handle_toggle_notif(chat_id, message_id, callback_id, user)
                else:
                    bot.answer_callback(callback_id, 'Avval ro\'yxatdan o\'ting')

            elif action == 'back':
                bot.answer_callback(callback_id)
                # /start ni qayta ko'rsatamiz
                name    = (user.full_name or user.telegram_username or 'Foydalanuvchi') if user else 'Mehmon'
                balance = bot._balance_text(user) if user else None
                if balance:
                    text = f"👋 Xush kelibsiz, <b>{name}</b>!\n\n📊 <b>Joriy holat:</b>\n\n{balance}"
                else:
                    text = f"👋 Xush kelibsiz, <b>{name}</b>!\n\nHozircha faol qarzlar yo'q."
                bot.edit(chat_id, message_id, text,
                         reply_markup=bot.main_menu(user.notifications_enabled if user else True))

            else:
                bot.answer_callback(callback_id)

            return JsonResponse({'ok': True})

        # ── Oddiy xabar ──────────────────────────────────────────────────────
        message = data.get('message', {})
        text    = message.get('text', '').strip()
        chat_id = message.get('chat', {}).get('id')

        if not chat_id or not text:
            return JsonResponse({'ok': True})

        try:
            user = User.objects.get(telegram_id=chat_id)
        except User.DoesNotExist:
            user = None

        cmd = text.split()[0].lower()

        if cmd == '/start':
            bot.handle_start(chat_id, user)
        else:
            # Noma'lum matn — asosiy menyuni ko'rsat
            bot.handle_start(chat_id, user)

    except Exception:
        pass

    return JsonResponse({'ok': True})
