"""
TextUP SMS shlyuz klienti (https://textup.uz).

Login email/parol bilan bo'ladi, olingan JWT token + userId Redis keshda
saqlanadi — har SMS'da qayta login qilinmaydi. Token eskirsa (401) bir marta
qayta login qilib retry qilamiz.
"""
import logging
import re

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

AUTH_URL = 'https://api-auth.textup.uz/v1/login'
SEND_URL = 'https://sms-api.textup.uz/v1/send'

CACHE_KEY = 'textup:auth'
TOKEN_TTL = 60 * 50  # JWT muddati hujjatda yo'q — 50 daqiqa kesh, keyin qayta login


class SmsError(Exception):
    """Foydalanuvchiga ko'rsatiladigan xato matni."""


def is_configured():
    return bool(settings.TEXTUP_EMAIL and settings.TEXTUP_PASSWORD)


# Kirill → lotin (o'zbekcha): TextUP shablon maskasi lotin matn bilan tasdiqlangan,
# kirillcha ism/matn validatsiyadan o'tmaydi
_CYR = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh',
    'ъ': "'", 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'ў': "o'", 'қ': 'q', 'ғ': "g'", 'ҳ': 'h',
}
_VOWELS = "аеёиоуэюяў"


def to_latin(text):
    """Kirillcha matnni lotinchaga o'giradi; lotin qismlar o'zgarmaydi."""
    chars = list(text or '')
    out, prev = [], ' '
    for i, ch in enumerate(chars):
        lo = ch.lower()
        if lo in _CYR:
            rep = _CYR[lo]
            # 'е' so'z boshida yoki unlidan keyin 'ye' bo'ladi (Фаттоев → Fattoyev)
            if lo == 'е' and (not prev.isalpha() or prev in _VOWELS):
                rep = 'ye'
            if ch.isupper():
                # Ko'p harfli almashinuvda (ye, sh, ch...) qo'shni harf ham katta
                # bo'lsa hammasini katta yozamiz (ФАТТОЕВ → FATTOYEV, Ёқуб → Yoqub)
                nxt = next((c for c in chars[i + 1:] if c.isalpha()), None)
                prv = next((c for c in chars[i - 1::-1] if c.isalpha()), None) if i else None
                neighbor = nxt if nxt is not None else prv
                rep = rep.upper() if (neighbor and neighbor.isupper()) else rep.capitalize()
            out.append(rep)
        else:
            out.append(ch)
        prev = lo
    return ''.join(out)


def person_name(raw, fallback=''):
    """Ismni SMS uchun tayyorlaydi: lotinchaga o'giradi, shablon maskasini
    buzadigan belgilarni (emoji, raqam, simvol) olib tashlaydi, KATTA HARFLARDA
    yozilgan bo'lsa chiroyli Bosh Harfga keltiradi. Bo'sh qolsa fallback."""
    name = to_latin((raw or '').strip())
    name = re.sub(r"[^A-Za-z'’`ʻ.\- ]", '', name)   # faqat lotin harf va ism belgilari
    name = re.sub(r'\s+', ' ', name).strip(" .-'’`ʻ")
    if not name:
        return fallback
    if name.isupper():
        name = ' '.join(w.capitalize() for w in name.split())
    return name


def normalize_phone(raw):
    """Raqamni +998XXXXXXXXX ko'rinishiga keltiradi, bo'lmasa None."""
    digits = re.sub(r'\D', '', raw or '')
    if len(digits) == 9:  # 901234567 — kod yozilmagan
        digits = '998' + digits
    if len(digits) == 12 and digits.startswith('998'):
        return '+' + digits
    return None


def _login():
    try:
        resp = requests.post(
            AUTH_URL,
            json={'email': settings.TEXTUP_EMAIL, 'password': settings.TEXTUP_PASSWORD},
            timeout=10,
        )
    except requests.RequestException as e:
        logger.error('TextUP login network error: %s', e)
        raise SmsError("SMS xizmatiga ulanib bo'lmadi — keyinroq urinib ko'ring")

    if resp.status_code != 200:
        logger.error('TextUP login failed [%s]: %s', resp.status_code, resp.text[:300])
        raise SmsError("SMS xizmatiga login xato — sozlamalarni tekshiring")

    data = resp.json()
    auth = {
        'token': data.get('accessToken'),
        'user_id': (data.get('user') or {}).get('id'),
    }
    if not auth['token'] or not auth['user_id']:
        logger.error('TextUP login: kutilmagan javob: %s', str(data)[:300])
        raise SmsError('SMS xizmati kutilmagan javob qaytardi')

    cache.set(CACHE_KEY, auth, TOKEN_TTL)
    return auth


def _get_auth():
    return cache.get(CACHE_KEY) or _login()


def send_sms(phone, message, name=None, template_id=None):
    """Bitta raqamga SMS yuboradi. Muvaffaqiyatda smsId, xatoda SmsError.
    template_id berilsa settings.TEXTUP_TEMPLATE_ID o'rniga ishlatiladi."""
    if not is_configured():
        raise SmsError("SMS xizmati sozlanmagan (TEXTUP_EMAIL / TEXTUP_PASSWORD)")

    to = normalize_phone(phone)
    if not to:
        raise SmsError("Telefon raqami noto'g'ri formatda (masalan: +998901234567)")

    auth = _get_auth()
    payload = {'message': message, 'userId': auth['user_id'], 'recipients': [to]}
    if name:
        payload['name'] = name
    if settings.TEXTUP_NICKNAME_ID:
        payload['nicknameId'] = settings.TEXTUP_NICKNAME_ID
    # templateId ixtiyoriy — TextUP matnni baribir tasdiqlangan shablonlar bilan
    # solishtiradi. Har chaqiruvchi o'z shablon ID'sini beradi (fallback yo'q —
    # aks holda OTP matni qarz shabloniga tushib qolardi).
    if template_id:
        payload['templateId'] = template_id

    def _post():
        return requests.post(
            SEND_URL, json=payload,
            headers={'Authorization': f'Bearer {auth["token"]}'},
            timeout=15,
        )

    try:
        resp = _post()
        if resp.status_code == 401:
            # Token eskirgan — qayta login, bir marta retry
            cache.delete(CACHE_KEY)
            auth = _login()
            payload['userId'] = auth['user_id']
            resp = _post()
    except requests.RequestException as e:
        logger.error('TextUP send network error: %s', e)
        raise SmsError("SMS yuborilmadi — internet/xizmat bilan muammo")

    if resp.status_code not in (200, 201):
        logger.error('TextUP send failed [%s]: %s', resp.status_code, resp.text[:300])
        if 'template' in resp.text.lower():
            err = SmsError("SMS yuborilmadi — matn TextUP'da tasdiqlangan shablonga mos emas "
                           "(kabinetda shablon yarating va moderatsiyadan o'tkazing)")
            err.template_error = True   # chaqiruvchi boshqa matn bilan retry qilishi mumkin
            raise err
        raise SmsError("SMS yuborilmadi — balans yoki sozlamalarni tekshiring")

    sms_id = (resp.json() or {}).get('smsId')
    logger.info('SMS sent to %s (smsId=%s)', to, sms_id)
    return sms_id


def send_otp(phone, code):
    """Telefonni tasdiqlash uchun 4 xonali kod yuboradi.
    Matn TextUP'da "Tasdiqlash kodi" shabloni sifatida tasdiqlangan bo'lishi shart
    (Punkt 2: resurs nomi + maqsad ko'rsatilishi majburiy)."""
    text = (f"Qarz Yordamchi ilovasi uchun tasdiqlash kodingiz: {code}. "
            f"Kod 1 daqiqa amal qiladi. t.me/Qarz_Yordamchi_Bot")
    return send_sms(phone, text, name='otp',
                    template_id=settings.TEXTUP_OTP_TEMPLATE_ID or None)
