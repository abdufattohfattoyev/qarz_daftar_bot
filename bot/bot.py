import os
import json
import time
import requests
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
log = logging.getLogger(__name__)

TOKEN = os.environ.get('BOT_TOKEN', '')
WEBAPP_URL = os.environ.get('WEBAPP_URL', 'https://nasiya-karta.uz')
BACKEND_URL = os.environ.get('BACKEND_INTERNAL_URL', 'http://nasiya_backend:8000')
ADMIN_CHAT_ID = os.environ.get('ADMIN_CHAT_ID', '')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')   # ovozni matnga (Whisper) — ixtiyoriy
WHISPER_MODEL = os.environ.get('WHISPER_MODEL', 'whisper-1')   # yoki 'gpt-4o-mini-transcribe'
# Til: bo'sh = avtomatik aniqlash. Whisper 'uz' parametrini qabul qilmaydi,
# shuning uchun standart bo'sh — model o'zbekchani o'zi tanib oladi.
WHISPER_LANG = os.environ.get('WHISPER_LANG', '')
# Whisper'ni o'zbekcha qarz so'zlariga yo'naltiruvchi prompt (aniqlikni oshiradi)
WHISPER_PROMPT = ("Qarz daftari. Misol: Diyorga 200 ming so'm berdim. "
                  "Akmaldan 50 dollar oldim. ming, million, so'm, dollar, berdim, oldim.")
API = f'https://api.telegram.org/bot{TOKEN}'
HDRS = {'X-Bot-Secret': TOKEN, 'Host': 'nasiya-karta.uz'}

# Admin uchun tasdiqlanmagan qarz draftlari (chat_id → draft). Bitta admin, bitta jarayon.
PENDING_DEBTS = {}


def is_admin(chat_id):
    return ADMIN_CHAT_ID and str(chat_id) == str(ADMIN_CHAT_ID)


def fmt_num(v):
    try:
        return f"{int(round(float(v))):,}".replace(',', ' ')
    except (ValueError, TypeError):
        return str(v)

# ── Premium (custom) emoji ──────────────────────────────────────────────────────
# custom_emoji_id ni @userinfobot yoki @stickerdownloadbot dan oling va shu yerga
# yozing. Bo'sh ('') qoldirilsa — oddiy emoji ishlatiladi (fallback). Premium emoji
# faqat bot egasi Telegram Premium bo'lsa animatsiyali ko'rinadi, aks holda oddiy.
# Eslatma: <tg-emoji> faqat XABAR MATNIDA ishlaydi, tugma yozuvida emas.
PREMIUM_EMOJI_IDS = {
    'book':  '5226512880362332956',   # 📖
    'wave':  '5472055112702629499',   # 👋
    'chart': '',                      # 📊
    'up':    '',                      # ↗
    'down':  '',                      # ↙
    'money': '',                      # 💰
    'bell':  '5458603043203327669',   # 🔔
    'help':  '',                      # ❓
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


INTRO_GIF = os.path.join(os.path.dirname(__file__), 'assets', 'intro.mp4')
_intro_file_id = None


def send_intro(chat_id, caption, reply_markup):
    """Brendli VIDEO + caption + tugmalar (sendVideo — "GIF" yorlig'isiz, to'liq
    sifatli). Birinchi yuborishda fayl yuklanadi, keyin file_id qayta ishlatiladi."""
    global _intro_file_id
    base = {'chat_id': chat_id, 'caption': caption, 'parse_mode': 'HTML',
            'reply_markup': json.dumps(reply_markup), 'supports_streaming': True}
    try:
        if _intro_file_id:
            r = requests.post(f'{API}/sendVideo', data={**base, 'video': _intro_file_id}, timeout=20)
            if r.json().get('ok'):
                return
        if os.path.exists(INTRO_GIF):
            with open(INTRO_GIF, 'rb') as f:
                r = requests.post(f'{API}/sendVideo', data=base, files={'video': f}, timeout=60)
            j = r.json()
            if j.get('ok'):
                vid = j['result'].get('video') or j['result'].get('document')
                if vid:
                    _intro_file_id = vid.get('file_id')
                return
        # Video yo'q yoki yuborilmadi — oddiy matnga qaytamiz
        tg('sendMessage', base)
    except Exception as e:
        log.error('send_intro: %s', e)
        tg('sendMessage', {'chat_id': chat_id, 'text': caption, 'parse_mode': 'HTML',
                           'reply_markup': reply_markup})


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
            total = data.get('total')
            tail = f'\n\n👥 Jami: <b>{total}-foydalanuvchi</b>' if total else ''
            notify_admin(f'🆕 <b>Yangi foydalanuvchi!</b>\n\n'
                         f'👤 {full_name or "—"}\n🔗 {uname}\n🆔 <code>{uid}</code>{tail}')
    except Exception as e:
        log.error(f'register_user xato: {e}')


def notify_admin(text):
    if not ADMIN_CHAT_ID:
        return
    tg('sendMessage', {'chat_id': ADMIN_CHAT_ID, 'text': text, 'parse_mode': 'HTML'})


# ── AI qarz kiritish (faqat admin) ────────────────────────────────────────────

def parse_debt(telegram_id, text):
    """Backendga matn yuborib qarz draftini oladi. {ok, draft} yoki {ok:False, error}."""
    try:
        r = requests.post(f'{BACKEND_URL}/api/auth/bot-parse-debt/',
                          json={'telegram_id': telegram_id, 'text': text}, headers=HDRS, timeout=30)
        return r.json()
    except Exception as e:
        log.error(f'parse_debt xato: {e}')
        return {'ok': False, 'error': 'network'}


def create_debt(telegram_id, draft):
    """Tasdiqlangan draftni backendga yuborib qarz yaratadi."""
    try:
        r = requests.post(f'{BACKEND_URL}/api/auth/bot-create-debt/',
                          json={'telegram_id': telegram_id, **draft}, headers=HDRS, timeout=15)
        return r.json()
    except Exception as e:
        log.error(f'create_debt xato: {e}')
        return {'ok': False, 'error': 'network'}


def pay_debt(telegram_id, draft):
    """Avvalgi qarzni to'lash (yangi qarz emas)."""
    try:
        r = requests.post(f'{BACKEND_URL}/api/auth/bot-pay-debt/',
                          json={'telegram_id': telegram_id, **draft}, headers=HDRS, timeout=15)
        return r.json()
    except Exception as e:
        log.error(f'pay_debt xato: {e}')
        return {'ok': False, 'error': 'network'}


def transcribe_voice(file_id):
    """Telegram ovozli xabarni Whisper (OpenAI) orqali matnga aylantiradi.
    OPENAI_API_KEY bo'lmasa None qaytaradi."""
    if not OPENAI_API_KEY:
        return None
    try:
        # 1. Telegram'dan fayl yo'lini olamiz
        r = requests.get(f'{API}/getFile', params={'file_id': file_id}, timeout=10)
        path = r.json().get('result', {}).get('file_path')
        if not path:
            return None
        # 2. Audio baytlarni yuklab olamiz
        audio = requests.get(f'https://api.telegram.org/file/bot{TOKEN}/{path}', timeout=30).content
        # 3. Whisper'ga yuboramiz (til avtomatik aniqlanadi + qarz so'zlari prompti)
        data = {'model': WHISPER_MODEL, 'prompt': WHISPER_PROMPT}
        if WHISPER_LANG:          # faqat ko'rsatilgan bo'lsa yuboramiz (uz qabul qilinmaydi)
            data['language'] = WHISPER_LANG
        wr = requests.post(
            'https://api.openai.com/v1/audio/transcriptions',
            headers={'Authorization': f'Bearer {OPENAI_API_KEY}'},
            data=data,
            files={'file': ('voice.ogg', audio, 'audio/ogg')},
            timeout=60,
        )
        if wr.status_code != 200:
            log.error(f'Whisper [{wr.status_code}]: {wr.text[:200]}')
            return None
        return (wr.json().get('text') or '').strip()
    except Exception as e:
        log.error(f'transcribe_voice xato: {e}')
        return None


def _net_phrase(name, net, cur):
    """Balansni odam tilida: kim kimga qarzdor."""
    a = fmt_num(abs(net))
    if net > 0:
        return f"{name} sizga <b>{a} {cur}</b> qarzdor"
    if net < 0:
        return f"Siz {name}ga <b>{a} {cur}</b> qarzdorsiz"
    return "hisob teng"


def debt_confirm_card(draft, existing=None):
    """Tasdiqlash kartochkasi matni + tugmalari (avvalgi qarz tarixi bilan)."""
    is_gave = draft.get('type') == 'gave'
    arrow = '↗️' if is_gave else '↙️'
    label = 'Men berdim (menga qarzdor)' if is_gave else 'Men oldim (men qarzdor)'
    amount = float(draft.get('amount') or 0)
    is_usd = draft.get('currency') == 'USD'
    cur = '$' if is_usd else 'so\'m'

    lines = [
        "🎤 <b>Tushundim:</b>\n",
        f"👤 <b>{draft.get('contact', '—')}</b>",
        f"{arrow} {label}",
        f"💰 <b>{fmt_num(amount)} {cur}</b>",
    ]

    # Avvalgi holat va chalkashlikni aniqlash
    old_net = 0.0
    ambiguous = False
    if existing:
        old_net = existing['balance_usd'] if is_usd else existing['balance_uzs']
        nm = existing['name']
        last = existing.get('last_date')
        lines.append("\n📊 <b>Avvalgi holat:</b>")
        lines.append(f"   {_net_phrase(nm, old_net, cur)}")
        if last:
            lines.append(f"   🕐 oxirgi: {last}")
        # Teskari balans bo'lsa — bu to'lov bo'lishi mumkin
        # gave + men qarzdor (net<0)  yoki  got + menga qarzdor (net>0)
        ambiguous = (is_gave and old_net < 0) or (not is_gave and old_net > 0)
    else:
        lines.append("\n🆕 <b>Yangi kontakt</b> — birinchi qarz")

    if ambiguous:
        # Aqlli savol: yangi qarzmi yoki avvalgi qarzni to'lashmi?
        lines.append(f"\n💡 <b>Diqqat:</b> bu <b>{fmt_num(amount)} {cur}</b> —")
        lines.append("avvalgi qarzni to'lashmi yoki yangi qarzmi?")
        markup = {'inline_keyboard': [
            [{'text': '💸 Qarzni to\'ladim', 'callback_data': 'debt_pay'}],
            [{'text': '➕ Yangi qarz',       'callback_data': 'debt_yes'}],
            [{'text': '❌ Bekor',            'callback_data': 'debt_no'}],
        ]}
    else:
        delta = amount if is_gave else -amount
        if existing:
            lines.append(f"➡️ <b>Keyin:</b> {_net_phrase(existing['name'], old_net + delta, cur)}")
        lines.append("\n❓ Shu qarz to'g'rimi?")
        markup = {'inline_keyboard': [[
            {'text': '✅ Ha, saqlash', 'callback_data': 'debt_yes'},
            {'text': '❌ Yo\'q',        'callback_data': 'debt_no'},
        ]]}
    return '\n'.join(lines), markup


def handle_ai_debt(chat_id, text):
    """Admin matn/ovoz yubordi — parse qilib tasdiqlash kartochkasini ko'rsatadi."""
    res = parse_debt(chat_id, text)
    if res.get('ok'):
        PENDING_DEBTS[chat_id] = res['draft']
        card, markup = debt_confirm_card(res['draft'], res.get('existing'))
        tg('sendMessage', {'chat_id': chat_id, 'text': card,
                           'parse_mode': 'HTML', 'reply_markup': json.dumps(markup)})
    else:
        err = res.get('error')
        if err == 'parse_failed':
            msg = ("🤔 Tushunolmadim. Masalan, shunday yozing yoki ayting:\n\n"
                   "<i>«Diyorga 200 ming berdim»</i>\n"
                   "<i>«Akmaldan 50 dollar oldim»</i>")
        elif err == 'not_admin':
            return False   # admin emas — pastda menyu ko'rsatiladi
        else:
            msg = "⚠️ Xatolik yuz berdi, qaytadan urinib ko'ring."
        tg('sendMessage', {'chat_id': chat_id, 'text': msg, 'parse_mode': 'HTML'})
    return True


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
        caption = start_text(state)
        markup = main_menu(state.get('notifications_enabled', True))
    else:
        caption = (f"{emoji('wave', '👋')} <b>Qarz Yordamchi</b>ga xush kelibsiz!\n\n"
                   "Qarzlaringizni boshqarish uchun ilovani oching.")
        markup = main_menu(True)
    send_intro(chat_id, caption, markup)


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

    elif action == 'debt_yes':
        draft = PENDING_DEBTS.pop(chat_id, None)
        if not draft:
            tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': 'Muddati o\'tdi'})
            edit('⌛️ Bu so\'rov eskirgan. Qaytadan yuboring.', None)
            return
        res = create_debt(chat_id, draft)
        if res.get('ok'):
            tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '✅ Saqlandi'})
            is_gave = res.get('type') == 'gave'
            cur = '$' if res.get('currency') == 'USD' else 'so\'m'
            edit(f"✅ <b>Qarz saqlandi!</b>\n\n"
                 f"👤 <b>{res.get('contact')}</b>\n"
                 f"{'↗️ Men berdim' if is_gave else '↙️ Men oldim'}: "
                 f"<b>{fmt_num(res.get('amount'))} {cur}</b>", None)
        else:
            tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': 'Xatolik'})
            edit('⚠️ Saqlashda xatolik. Qaytadan urinib ko\'ring.', None)

    elif action == 'debt_pay':
        draft = PENDING_DEBTS.pop(chat_id, None)
        if not draft:
            tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': 'Muddati o\'tdi'})
            edit('⌛️ Bu so\'rov eskirgan. Qaytadan yuboring.', None)
            return
        res = pay_debt(chat_id, draft)
        if res.get('ok'):
            tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': '✅ To\'lov qabul qilindi'})
            cur = '$' if res.get('currency') == 'USD' else 'so\'m'
            net = res.get('net', 0)
            lines = ["💸 <b>To'lov qabul qilindi!</b>\n",
                     f"👤 <b>{res.get('contact')}</b>",
                     f"✅ To'landi: <b>{fmt_num(res.get('paid'))} {cur}</b>",
                     f"📊 Qoldiq: {_net_phrase(res.get('contact'), net, cur)}"]
            if res.get('leftover', 0) > 0:
                lines.append(f"\n⚠️ {fmt_num(res['leftover'])} {cur} ortiqcha — bu qarzga o'tmadi.")
            edit('\n'.join(lines), None)
        elif res.get('error') == 'no_debt':
            tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': 'Qarz topilmadi'})
            edit("🤔 To'lanadigan avvalgi qarz topilmadi. «Yangi qarz» bo'lishi mumkin.", None)
        else:
            tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': 'Xatolik'})
            edit("⚠️ To'lovda xatolik. Qaytadan urinib ko'ring.", None)

    elif action == 'debt_no':
        PENDING_DEBTS.pop(chat_id, None)
        tg('answerCallbackQuery', {'callback_query_id': cb_id, 'text': 'Bekor qilindi'})
        edit('❌ Bekor qilindi. Qaytadan yuborishingiz mumkin.', None)

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
                voice = msg.get('voice')
                chat_id = msg.get('chat', {}).get('id')
                if not chat_id:
                    continue

                # Diagnostika — ovoz kelganda nima holatda ekanini logga yozamiz
                if voice:
                    log.info(
                        f"🎤 VOICE chat={chat_id} | ADMIN_CHAT_ID={ADMIN_CHAT_ID or '(BOSH!)'} "
                        f"| is_admin={is_admin(chat_id)} | OPENAI={'bor' if OPENAI_API_KEY else 'YO‘Q!'}")

                if text.startswith('/start'):
                    log.info(f'/start → {chat_id}')
                    handle_start(chat_id, msg.get('from', {}))

                elif is_admin(chat_id) and voice:
                    # 🎤 Admin ovozli xabar yubordi — Whisper → parse → tasdiqlash
                    register_user(msg.get('from', {}))
                    tg('sendChatAction', {'chat_id': chat_id, 'action': 'typing'})
                    if not OPENAI_API_KEY:
                        tg('sendMessage', {'chat_id': chat_id, 'parse_mode': 'HTML',
                                           'text': "🎙 Ovozni matnga aylantirish hozircha o'chiq.\n\n"
                                                   "Iltimos, qarzni <b>matn bilan yozing</b>:\n"
                                                   "<i>«Diyorga 200 ming berdim»</i>"})
                    else:
                        transcript = transcribe_voice(voice['file_id'])
                        if transcript:
                            log.info(f'🎤 admin ovoz: "{transcript}"')
                            handle_ai_debt(chat_id, transcript)
                        else:
                            tg('sendMessage', {'chat_id': chat_id,
                                               'text': "🤔 Ovozni tushunolmadim. Qaytadan ayting yoki matn bilan yozing."})

                elif is_admin(chat_id) and text:
                    # ✍️ Admin matn yubordi — AI qarz sifatida sinaymiz
                    register_user(msg.get('from', {}))
                    tg('sendChatAction', {'chat_id': chat_id, 'action': 'typing'})
                    handle_ai_debt(chat_id, text)

                else:
                    # Oddiy foydalanuvchi — menyuni ko'rsatamiz
                    handle_start(chat_id, msg.get('from', {}))
            except Exception as e:
                log.error(f'update qayta ishlashda xato: {e}')


if __name__ == '__main__':
    main()
