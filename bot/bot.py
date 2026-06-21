import os
import time
import requests
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
log = logging.getLogger(__name__)

TOKEN = os.environ.get('BOT_TOKEN', '')
WEBAPP_URL = os.environ.get('WEBAPP_URL', 'https://nasiya-karta.uz')
BACKEND_URL = os.environ.get('BACKEND_INTERNAL_URL', 'http://nasiya_backend:8000')
ADMIN_CHAT_ID = os.environ.get('ADMIN_CHAT_ID', '')
API = f'https://api.telegram.org/bot{TOKEN}'
HDRS = {'X-Bot-Secret': TOKEN, 'Host': 'nasiya-karta.uz'}

# ── Premium (custom) emoji ──────────────────────────────────────────────────────
# custom_emoji_id ni @userinfobot yoki @stickerdownloadbot dan oling va shu yerga
# yozing. Bo'sh ('') qoldirilsa — oddiy emoji ishlatiladi (fallback). Premium emoji
# faqat bot egasi Telegram Premium bo'lsa animatsiyali ko'rinadi, aks holda oddiy.
# Eslatma: <tg-emoji> faqat XABAR MATNIDA ishlaydi, tugma yozuvida emas.
PREMIUM_EMOJI_IDS = {
    'book':  '',   # 📒
    'wave':  '',   # 👋
    'chart': '',   # 📊
    'up':    '',   # ↗
    'down':  '',   # ↙
    'money': '',   # 💰
    'bell':  '',   # 🔔
    'help':  '',   # ❓
}


def emoji(name, fallback):
    eid = PREMIUM_EMOJI_IDS.get(name, '')
    if eid:
        return f'<tg-emoji emoji-id="{eid}">{fallback}</tg-emoji>'
    return fallback


# ── Telegram API ─────────────────────────────────────────────────────────────

def tg(method, payload):
    try:
        requests.post(f'{API}/{method}', json=payload, timeout=10)
    except Exception as e:
        log.error(f'{method} xato: {e}')


def get_updates(offset=None):
    try:
        r = requests.get(f'{API}/getUpdates', params={
            'offset': offset,
            'timeout': 30,
            'allowed_updates': ['message', 'callback_query'],
        }, timeout=35)
        return r.json().get('result', [])
    except Exception as e:
        log.error(f'getUpdates xato: {e}')
        time.sleep(5)
        return []


# ── Backend ──────────────────────────────────────────────────────────────────

def get_state(telegram_id):
    try:
        r = requests.post(f'{BACKEND_URL}/api/auth/bot-state/',
                          json={'telegram_id': telegram_id}, headers=HDRS, timeout=8)
        return r.json()
    except Exception as e:
        log.error(f'get_state xato: {e}')
        return {}


def toggle_notif(telegram_id):
    try:
        r = requests.post(f'{BACKEND_URL}/api/auth/bot-toggle-notif/',
                          json={'telegram_id': telegram_id}, headers=HDRS, timeout=8)
        return r.json().get('notifications_enabled')
    except Exception as e:
        log.error(f'toggle_notif xato: {e}')
        return None


def register_user(tg_user):
    try:
        uid = tg_user.get('id')
        full_name = f"{tg_user.get('first_name', '')} {tg_user.get('last_name', '')}".strip()
        username = tg_user.get('username', '')
        r = requests.post(f'{BACKEND_URL}/api/auth/bot-register/',
                          json={'telegram_id': uid, 'full_name': full_name, 'username': username},
                          headers=HDRS, timeout=8)
        data = r.json()
        log.info(f'User saqlandi: {uid} {full_name} (yangi={data.get("created")})')
        if data.get('created'):
            uname = f'@{username}' if username else 'username yo\'q'
            notify_admin(f'🆕 <b>Yangi foydalanuvchi!</b>\n\n'
                         f'👤 {full_name or "—"}\n🔗 {uname}\n🆔 <code>{uid}</code>')
    except Exception as e:
        log.error(f'register_user xato: {e}')


def notify_admin(text):
    if not ADMIN_CHAT_ID:
        return
    tg('sendMessage', {'chat_id': ADMIN_CHAT_ID, 'text': text, 'parse_mode': 'HTML'})


# ── Keyboards & matnlar ──────────────────────────────────────────────────────

def main_menu(notif_on=True):
    notif = '🔔 Eslatma: Yoqiq' if notif_on else '🔕 Eslatma: O\'chiq'
    return {'inline_keyboard': [
        [{'text': '📒 Ilovani ochish', 'web_app': {'url': WEBAPP_URL}}],
        [{'text': '📊 Statistika', 'callback_data': 'stats'},
         {'text': notif,           'callback_data': 'toggle'}],
        [{'text': '❓ Yordam',       'callback_data': 'help'}],
    ]}


def back_menu():
    return {'inline_keyboard': [[{'text': '← Orqaga', 'callback_data': 'back'}]]}


def start_text(state):
    name = state.get('name', 'Foydalanuvchi')
    bal = state.get('balance_text', '')
    if bal:
        return (f"{emoji('wave', '👋')} Xush kelibsiz, <b>{name}</b>!\n\n"
                f"{emoji('chart', '📊')} <b>Joriy holat:</b>\n\n{bal}")
    return f"{emoji('wave', '👋')} Xush kelibsiz, <b>{name}</b>!\n\nHozircha faol qarzlar yo'q."


def stats_text(state):
    bal = state.get('balance_text', '')
    cnt = state.get('active_count', 0)
    if bal:
        return f"{emoji('chart', '📊')} <b>Statistika</b>\n\n{bal}📋 Jami faol qarzlar: <b>{cnt} ta</b>"
    return f"{emoji('chart', '📊')} <b>Statistika</b>\n\nHozircha faol qarzlar yo'q."


def help_text():
    return (
        f"{emoji('help', '❓')} <b>Yordam</b>\n\n"
        f"{emoji('book', '📒')} <b>Ilovani ochish</b> — qarz kiritish va boshqarish\n"
        f"{emoji('chart', '📊')} <b>Statistika</b> — joriy balans va qarzlar\n"
        f"{emoji('bell', '🔔')} <b>Eslatma</b> — bildirishnomalarni yoqish/o'chirish\n\n"
        "Qarz kiritish, to'lov qilish uchun ilovani oching."
    )


# ── Handlers ─────────────────────────────────────────────────────────────────

def handle_start(chat_id, from_user):
    register_user(from_user)
    state = get_state(chat_id)
    if state.get('exists'):
        tg('sendMessage', {'chat_id': chat_id, 'text': start_text(state), 'parse_mode': 'HTML',
                           'reply_markup': main_menu(state.get('notifications_enabled', True))})
    else:
        text = ("👋 <b>Qarz Daftar</b>ga xush kelibsiz!\n\n"
                "Qarzlaringizni boshqarish uchun ilovani oching.")
        tg('sendMessage', {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML',
                           'reply_markup': main_menu(True)})


def handle_callback(cb):
    cb_id      = cb['id']
    chat_id    = cb['message']['chat']['id']
    message_id = cb['message']['message_id']
    action     = cb.get('data', '')

    def edit(text, markup):
        tg('editMessageText', {'chat_id': chat_id, 'message_id': message_id,
                               'text': text, 'parse_mode': 'HTML', 'reply_markup': markup})

    if action == 'stats':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        edit(stats_text(get_state(chat_id)), back_menu())

    elif action == 'help':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        edit(help_text(), back_menu())

    elif action == 'toggle':
        enabled = toggle_notif(chat_id)
        msg = '🔔 Bildirishnomalar yoqildi' if enabled else '🔕 Bildirishnomalar o\'chirildi'
        tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': msg})
        state = get_state(chat_id)
        edit(start_text(state), main_menu(state.get('notifications_enabled', True)))

    elif action == 'back':
        tg('answerCallbackQuery', {'callback_query_id': cb_id})
        state = get_state(chat_id)
        edit(start_text(state), main_menu(state.get('notifications_enabled', True)))

    else:
        tg('answerCallbackQuery', {'callback_query_id': cb_id})


# ── Main loop ────────────────────────────────────────────────────────────────

def main():
    if not TOKEN:
        log.error('BOT_TOKEN topilmadi!')
        return

    requests.get(f'{API}/deleteWebhook', timeout=10)
    log.info(f'Bot ishga tushdi. WEBAPP_URL: {WEBAPP_URL}')

    offset = None
    while True:
        for update in get_updates(offset):
            offset = update['update_id'] + 1
            try:
                if 'callback_query' in update:
                    handle_callback(update['callback_query'])
                    continue

                msg = update.get('message', {})
                text = msg.get('text', '')
                chat_id = msg.get('chat', {}).get('id')
                if not chat_id:
                    continue

                if text.startswith('/start'):
                    log.info(f'/start → {chat_id}')
                    handle_start(chat_id, msg.get('from', {}))
                else:
                    # Boshqa har qanday matn — menyuni ko'rsatamiz
                    handle_start(chat_id, msg.get('from', {}))
            except Exception as e:
                log.error(f'update qayta ishlashda xato: {e}')


if __name__ == '__main__':
    main()
