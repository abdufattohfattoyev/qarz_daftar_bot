import json
import logging
from urllib.parse import unquote
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

    # user ma'lumotlarini olish
    user_data_str = unquote(parsed.get('user', '{}'))
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

    return Response({'ok': True, 'created': created, 'user_id': user.id})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def token_refresh_view(request):
    """Token yangilash"""
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token kerak'}, status=400)
    try:
        refresh = RefreshToken(refresh_token)
        return Response({'access': str(refresh.access_token)})
    except Exception:
        return Response({'error': 'Token yaroqsiz'}, status=401)
