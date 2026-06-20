import os
import time
import requests
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
log = logging.getLogger(__name__)

TOKEN = os.environ.get('BOT_TOKEN', '')
WEBAPP_URL = os.environ.get('WEBAPP_URL', 'https://nasiya-karta.uz')
BACKEND_URL = os.environ.get('BACKEND_INTERNAL_URL', 'http://nasiya_backend:8000')
API = f'https://api.telegram.org/bot{TOKEN}'


def get_updates(offset=None):
    try:
        r = requests.get(f'{API}/getUpdates', params={
            'offset': offset,
            'timeout': 30,
            'allowed_updates': ['message']
        }, timeout=35)
        return r.json().get('result', [])
    except Exception as e:
        log.error(f'getUpdates xato: {e}')
        time.sleep(5)
        return []


def register_user(tg_user):
    try:
        uid = tg_user.get('id')
        full_name = f"{tg_user.get('first_name', '')} {tg_user.get('last_name', '')}".strip()
        username = tg_user.get('username', '')
        requests.post(
            f'{BACKEND_URL}/api/auth/bot-register/',
            json={'telegram_id': uid, 'full_name': full_name, 'username': username},
            headers={'X-Bot-Secret': TOKEN},
            timeout=5
        )
        log.info(f'User saqlandi: {uid} {full_name}')
    except Exception as e:
        log.error(f'register_user xato: {e}')


def send_start(chat_id):
    requests.post(f'{API}/sendMessage', json={
        'chat_id': chat_id,
        'text': (
            '👋 Qarz daftar botiga xush kelibsiz!\n\n'
            'Qarzlaringizni osongina boshqaring.\n\n'
            '📱 Ilovani ochish uchun quyidagi tugmani bosing:'
        ),
        'reply_markup': {
            'inline_keyboard': [[{
                'text': '📒 Qarz daftarni ochish',
                'web_app': {'url': WEBAPP_URL}
            }]]
        }
    }, timeout=10)


def main():
    if not TOKEN:
        log.error('BOT_TOKEN topilmadi!')
        return

    # Webhookni o'chirish (polling uchun)
    requests.get(f'{API}/deleteWebhook', timeout=10)
    log.info(f'Bot ishga tushdi. WEBAPP_URL: {WEBAPP_URL}')

    offset = None
    while True:
        updates = get_updates(offset)
        for update in updates:
            offset = update['update_id'] + 1
            msg = update.get('message', {})
            text = msg.get('text', '')
            chat_id = msg.get('chat', {}).get('id')

            if not chat_id:
                continue

            if text.startswith('/start'):
                log.info(f'/start → chat_id={chat_id}')
                register_user(msg.get('from', {}))
                send_start(chat_id)


if __name__ == '__main__':
    main()
