import os
import time
import requests
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
log = logging.getLogger(__name__)

TOKEN = os.environ.get('BOT_TOKEN', '')
WEBAPP_URL = os.environ.get('WEBAPP_URL', 'https://nasiya-karta.uz')
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
                send_start(chat_id)


if __name__ == '__main__':
    main()
