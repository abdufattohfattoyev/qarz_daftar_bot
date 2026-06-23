import json
import logging
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import TelegramAuthSerializer, UserSerializer, UserUpdateSerializer

logger = logging.getLogger(__name__)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def telegram_auth(request):
    """
    Telegram WebApp initData orqali autentifikatsiya.
    Frontend Telegram.WebApp.initData ni yuboradi.
    """
    serializer = TelegramAuthSerializer(data=request.data)
    if not serializer.is_valid():
        logger.error(f'TelegramAuth validation error: {serializer.errors}')
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    parsed = serializer.validated_data['init_data']

    # user ma'lumotlarini olish (parse_qsl allaqachon URL-decode qilgan)
    user_data_str = parsed.get('user', '{}')
    try:
        tg_user = json.loads(user_data_str)
    except Exception:
        return Response({'error': 'User ma\'lumoti xato'}, status=400)

    telegram_id = tg_user.get('id')
    if not telegram_id:
        return Response({'error': 'Telegram ID topilmadi'}, status=400)

    # Foydalanuvchini topish yoki yaratish
    user, created = User.objects.get_or_create(
        telegram_id=telegram_id,
        defaults={
            'username': f'tg_{telegram_id}',
            'telegram_username': tg_user.get('username', ''),
            'full_name': f"{tg_user.get('first_name', '')} {tg_user.get('last_name', '')}".strip(),
            'photo_url': tg_user.get('photo_url', ''),
        }
    )

    if not created:
        # Ma'lumotlarni yangilash
        user.telegram_username = tg_user.get('username', user.telegram_username)
        user.full_name = f"{tg_user.get('first_name', '')} {tg_user.get('last_name', '')}".strip() or user.full_name
        user.save(update_fields=['telegram_username', 'full_name'])

    tokens = get_tokens_for_user(user)
    return Response({
        'tokens': tokens,
        'user': UserSerializer(user).data,
        'created': created,
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    """Joriy foydalanuvchi ma'lumotlari"""
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)

    serializer = UserUpdateSerializer(
        request.user, data=request.data, partial=True
    )
    if serializer.is_valid():
        serializer.save()
        return Response(UserSerializer(request.user).data)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def dev_login(request):
    """Faqat DEBUG=True da ishlaydi — local test uchun"""
    from django.conf import settings
    if not settings.DEBUG:
        return Response({'error': 'Faqat dev rejimda ishlaydi'}, status=403)

    telegram_id = request.data.get('telegram_id', 999999999)
    user, _ = User.objects.get_or_create(
        telegram_id=telegram_id,
        defaults={
            'username': f'dev_{telegram_id}',
            'full_name': 'Dev Foydalanuvchi',
            'telegram_username': 'dev_user',
        }
    )
    tokens = get_tokens_for_user(user)
    return Response({'tokens': tokens, 'user': UserSerializer(user).data})


@api_view(['POST'])
@permission_classes([AllowAny])
def bot_register(request):
    """Bot /start bosganida userni bazaga saqlash (ichki ishlatish uchun)"""
    secret = request.headers.get('X-Bot-Secret', '')
    if secret != settings.BOT_TOKEN:
        return Response({'error': 'Ruxsat yo\'q'}, status=403)

    telegram_id = request.data.get('telegram_id')
    if not telegram_id:
        return Response({'error': 'telegram_id kerak'}, status=400)

    user, created = User.objects.get_or_create(
        telegram_id=telegram_id,
        defaults={
            'username': f'tg_{telegram_id}',
            'full_name': request.data.get('full_name', ''),
            'telegram_username': request.data.get('username', ''),
        }
    )
    if not created:
        changed = False
        if request.data.get('full_name') and not user.full_name:
            user.full_name = request.data.get('full_name')
            changed = True
        if request.data.get('username'):
            user.telegram_username = request.data.get('username')
            changed = True
        if changed:
            user.save()

    return Response({
        'ok': True, 'created': created, 'user_id': user.id,
        'total': User.objects.count(),               # jami foydalanuvchilar soni
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def bot_state(request):
    """Bot menyusi uchun foydalanuvchi holati (balans + eslatma)."""
    if request.headers.get('X-Bot-Secret', '') != settings.BOT_TOKEN:
        return Response({'error': 'Ruxsat yo\'q'}, status=403)

    telegram_id = request.data.get('telegram_id')
    try:
        user = User.objects.get(telegram_id=telegram_id)
    except User.DoesNotExist:
        return Response({'exists': False})

    from apps.notifications.bot import _balance_text
    from apps.debts.models import Debt
    active = Debt.objects.filter(user=user, status__in=['active', 'partial']).count()

    return Response({
        'exists': True,
        'name': user.full_name or user.telegram_username or 'Foydalanuvchi',
        'notifications_enabled': user.notifications_enabled,
        'balance_text': _balance_text(user) or '',
        'active_count': active,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def bot_toggle_notif(request):
    """Bot 'Eslatma' tugmasi — bildirishnomalarni yoqish/o'chirish."""
    if request.headers.get('X-Bot-Secret', '') != settings.BOT_TOKEN:
        return Response({'error': 'Ruxsat yo\'q'}, status=403)

    telegram_id = request.data.get('telegram_id')
    try:
        user = User.objects.get(telegram_id=telegram_id)
    except User.DoesNotExist:
        return Response({'exists': False}, status=404)

    user.notifications_enabled = not user.notifications_enabled
    user.save(update_fields=['notifications_enabled'])
    return Response({'notifications_enabled': user.notifications_enabled})


def _is_admin(telegram_id):
    """ADMIN_CHAT_ID bilan solishtiradi (faqat admin AI funksiyasidan foydalanadi)."""
    admin = str(getattr(settings, 'ADMIN_CHAT_ID', '') or '').strip()
    return admin and str(telegram_id).strip() == admin


@api_view(['POST'])
@permission_classes([AllowAny])
def bot_parse_debt(request):
    """Matndan qarz ajratadi (Claude). Faqat admin uchun. Draft qaytaradi — yaratmaydi."""
    if request.headers.get('X-Bot-Secret', '') != settings.BOT_TOKEN:
        return Response({'error': 'Ruxsat yo\'q'}, status=403)

    telegram_id = request.data.get('telegram_id')
    if not _is_admin(telegram_id):
        return Response({'ok': False, 'error': 'not_admin'}, status=403)

    text = (request.data.get('text') or '').strip()
    if not text:
        return Response({'ok': False, 'error': 'empty'})

    from apps.notifications.ai_parser import parse_debt_text
    draft = parse_debt_text(text)
    if not draft:
        return Response({'ok': False, 'error': 'parse_failed'})

    # Mavjud kontaktning joriy holatini qaytaramiz (tasdiqlashda ko'rsatish uchun)
    from apps.contacts.models import Contact
    from apps.debts.models import Debt
    existing = None
    user = User.objects.filter(telegram_id=telegram_id).first()
    if user:
        contact = Contact.objects.filter(owner=user, name__iexact=draft['contact']).first()
        if contact:
            last = Debt.objects.filter(user=user, contact=contact).order_by('-created_at').first()
            existing = {
                'name': contact.name,
                'balance_uzs': float(contact.balance_uzs),
                'balance_usd': float(contact.balance_usd),
                'last_date': last.created_at.strftime('%d.%m.%Y') if last else None,
            }
    return Response({'ok': True, 'draft': draft, 'existing': existing})


@api_view(['POST'])
@permission_classes([AllowAny])
def bot_create_debt(request):
    """Tasdiqlangan draftdan kontakt + qarz yaratadi. Faqat admin uchun."""
    if request.headers.get('X-Bot-Secret', '') != settings.BOT_TOKEN:
        return Response({'error': 'Ruxsat yo\'q'}, status=403)

    telegram_id = request.data.get('telegram_id')
    if not _is_admin(telegram_id):
        return Response({'ok': False, 'error': 'not_admin'}, status=403)

    try:
        user = User.objects.get(telegram_id=telegram_id)
    except User.DoesNotExist:
        return Response({'ok': False, 'error': 'no_user'}, status=404)

    from decimal import Decimal, InvalidOperation
    from apps.contacts.models import Contact
    from apps.debts.models import Debt

    name = (request.data.get('contact') or '').strip()
    try:
        amount = Decimal(str(request.data.get('amount', 0)))
    except (InvalidOperation, TypeError):
        amount = Decimal('0')
    currency = request.data.get('currency', 'UZS')
    debt_type = request.data.get('type', 'gave')

    if not name or amount <= 0 or currency not in ('UZS', 'USD') or debt_type not in ('gave', 'got'):
        return Response({'ok': False, 'error': 'invalid'}, status=400)

    # Mavjud kontaktni ism bo'yicha topamiz (case-insensitive), bo'lmasa yangi
    contact = Contact.objects.filter(owner=user, name__iexact=name).first()
    if not contact:
        contact = Contact.objects.create(owner=user, name=name)

    debt = Debt.objects.create(
        user=user, contact=contact, debt_type=debt_type,
        amount=amount, currency=currency,
        note=request.data.get('note', '') or '',
    )

    return Response({
        'ok': True,
        'debt_id': debt.id,
        'contact': contact.name,
        'amount': float(amount),
        'currency': currency,
        'type': debt_type,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def bot_pay_debt(request):
    """Avvalgi qarzni to'lash (qarz emas). Faqat admin.
    type='gave' kelsa → men qarzdor (got) qarzlarini to'laydi;
    type='got' kelsa  → menga qarzdor (gave) qarzlarini to'laydi."""
    if request.headers.get('X-Bot-Secret', '') != settings.BOT_TOKEN:
        return Response({'error': 'Ruxsat yo\'q'}, status=403)

    telegram_id = request.data.get('telegram_id')
    if not _is_admin(telegram_id):
        return Response({'ok': False, 'error': 'not_admin'}, status=403)

    try:
        user = User.objects.get(telegram_id=telegram_id)
    except User.DoesNotExist:
        return Response({'ok': False, 'error': 'no_user'}, status=404)

    from decimal import Decimal, InvalidOperation
    from apps.contacts.models import Contact
    from apps.debts.models import Debt, Payment

    name = (request.data.get('contact') or '').strip()
    currency = request.data.get('currency', 'UZS')
    # "berdim"(gave) → o'z qarzimni to'layapman → got qarzlar; aksincha gave
    target_type = 'got' if request.data.get('type') == 'gave' else 'gave'
    try:
        amount = Decimal(str(request.data.get('amount', 0)))
    except (InvalidOperation, TypeError):
        amount = Decimal('0')

    contact = Contact.objects.filter(owner=user, name__iexact=name).first()
    if not contact or amount <= 0:
        return Response({'ok': False, 'error': 'invalid'}, status=400)

    debts = Debt.objects.filter(
        user=user, contact=contact, debt_type=target_type,
        currency=currency, status__in=['active', 'partial'],
    ).order_by('created_at')

    left = amount
    paid_total = Decimal('0')
    for d in debts:
        if left <= 0:
            break
        portion = min(left, d.remaining_amount)
        if portion > 0:
            Payment.objects.create(debt=d, amount=portion, created_by=user)
            left -= portion
            paid_total += portion

    if paid_total <= 0:
        return Response({'ok': False, 'error': 'no_debt'})  # to'lanadigan qarz yo'q

    contact.refresh_from_db()
    net = float(contact.balance_usd if currency == 'USD' else contact.balance_uzs)
    return Response({
        'ok': True,
        'contact': contact.name,
        'paid': float(paid_total),
        'leftover': float(left),      # qarzdan oshib ketgan qism (bo'lsa)
        'currency': currency,
        'net': net,                   # to'lovdan keyingi balans
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_pin(request):
    """PIN o'rnatish/o'zgartirish (4-6 raqam)."""
    from django.contrib.auth.hashers import make_password
    pin = str(request.data.get('pin', '')).strip()
    if not (pin.isdigit() and 4 <= len(pin) <= 6):
        return Response({'error': "PIN 4-6 ta raqamdan iborat bo'lishi kerak"}, status=400)
    request.user.pin_code = make_password(pin)
    request.user.save(update_fields=['pin_code'])
    return Response({'ok': True, 'has_pin': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_pin(request):
    """Kiritilgan PIN to'g'riligini tekshirish."""
    from django.contrib.auth.hashers import check_password
    pin = str(request.data.get('pin', '')).strip()
    ok = bool(request.user.pin_code) and check_password(pin, request.user.pin_code)
    return Response({'ok': ok})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_pin(request):
    """PIN o'chirish — joriy PINni tasdiqlab."""
    from django.contrib.auth.hashers import check_password
    pin = str(request.data.get('pin', '')).strip()
    if request.user.pin_code and not check_password(pin, request.user.pin_code):
        return Response({'error': "PIN noto'g'ri"}, status=400)
    request.user.pin_code = ''
    request.user.save(update_fields=['pin_code'])
    return Response({'ok': True, 'has_pin': False})


@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh_view(request):
    """Token yangilash — refresh token o'zi yetarli, access token shart emas"""
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token kerak'}, status=400)
    try:
        refresh = RefreshToken(refresh_token)
        return Response({'access': str(refresh.access_token)})
    except Exception:
        return Response({'error': 'Token yaroqsiz'}, status=401)
