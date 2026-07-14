"""
Admin panel API — faqat ADMIN_CHAT_ID egasi uchun.
Web (JWT) orqali kiriladi; har bir endpoint admin ekanligini tekshiradi.
"""
from django.conf import settings
from django.db.models import Sum, Q, Count
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import User


def _admin_or_403(request):
    admin = str(getattr(settings, 'ADMIN_CHAT_ID', '') or '').strip()
    if not admin or str(request.user.telegram_id) != admin:
        return Response({'error': 'Faqat admin uchun'}, status=403)
    return None


def _net(qs):
    """(gave_remaining, got_remaining) — valyuta bo'yicha filtrlangan qs uchun."""
    a = qs.aggregate(
        gs=Sum('amount', filter=Q(debt_type='gave')),
        gp=Sum('paid_amount', filter=Q(debt_type='gave')),
        rs=Sum('amount', filter=Q(debt_type='got')),
        rp=Sum('paid_amount', filter=Q(debt_type='got')),
    )
    gave = (a['gs'] or Decimal(0)) - (a['gp'] or Decimal(0))
    got = (a['rs'] or Decimal(0)) - (a['rp'] or Decimal(0))
    return float(gave), float(got)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_overview(request):
    """Umumiy statistika: foydalanuvchilar, qarzlar, summalar, faollik."""
    deny = _admin_or_403(request)
    if deny:
        return deny

    from apps.debts.models import Debt
    week_ago = timezone.now() - timedelta(days=7)

    active = Debt.objects.filter(status__in=['active', 'partial'])
    g_uzs, r_uzs = _net(active.filter(currency='UZS'))
    g_usd, r_usd = _net(active.filter(currency='USD'))

    # So'nggi 7 kunlik faollik (kunlik yangi qarzlar)
    from django.db.models.functions import TruncDate
    daily = (Debt.objects.filter(created_at__gte=week_ago)
             .annotate(d=TruncDate('created_at')).values('d')
             .annotate(c=Count('id')).order_by('d'))

    return Response({
        'users': {
            'total': User.objects.count(),
            'new_week': User.objects.filter(created_at__gte=week_ago).count(),
            'with_debts': Debt.objects.values('user').distinct().count(),
        },
        'debts': {
            'total': Debt.objects.count(),
            'active': active.count(),
            'paid': Debt.objects.filter(status='paid').count(),
            'new_week': Debt.objects.filter(created_at__gte=week_ago).count(),
        },
        'balances': {
            'gave_uzs': g_uzs, 'got_uzs': r_uzs,
            'gave_usd': g_usd, 'got_usd': r_usd,
        },
        'daily': [{'date': x['d'].isoformat(), 'count': x['c']} for x in daily],
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users(request):
    """Barcha foydalanuvchilar + balansi + qarzlar soni. Qidiruv: ?q="""
    deny = _admin_or_403(request)
    if deny:
        return deny

    from apps.debts.models import Debt
    q = (request.query_params.get('q') or '').strip()
    users = User.objects.all().order_by('-created_at')
    if q:
        users = users.filter(Q(full_name__icontains=q) |
                             Q(telegram_username__icontains=q) |
                             Q(phone__icontains=q))

    out = []
    for u in users[:200]:
        active = Debt.objects.filter(user=u, status__in=['active', 'partial'])
        g_uzs, r_uzs = _net(active.filter(currency='UZS'))
        g_usd, r_usd = _net(active.filter(currency='USD'))
        out.append({
            'id': u.id,
            'telegram_id': u.telegram_id,
            'name': u.full_name or u.telegram_username or f'User {u.telegram_id}',
            'username': u.telegram_username,
            'phone': u.phone,
            'debts': Debt.objects.filter(user=u).count(),
            'net_uzs': g_uzs - r_uzs,
            'net_usd': g_usd - r_usd,
            'joined': u.created_at.strftime('%d.%m.%Y'),
            'notifications': u.notifications_enabled,
            'sms_allowed': u.sms_allowed,
            'phone_verified': u.phone_verified,
        })
    return Response({'count': users.count(), 'users': out})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_debts(request, user_id):
    """Bitta foydalanuvchining qarzlari (faqat ko'rish)."""
    deny = _admin_or_403(request)
    if deny:
        return deny
    from apps.debts.models import Debt
    try:
        u = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Topilmadi'}, status=404)
    debts = Debt.objects.filter(user=u).select_related('contact').order_by('-created_at')[:200]
    return Response({
        'user': u.full_name or u.telegram_username or f'User {u.telegram_id}',
        'debts': [{
            'id': d.id,
            'contact': d.contact.name,
            'type': d.debt_type,
            'amount': float(d.amount),
            'remaining': float(d.remaining_amount),
            'currency': d.currency,
            'status': d.status,
            'note': d.note,
            'created': d.created_at.strftime('%d.%m.%Y %H:%M'),
        } for d in debts],
    })


# Broadcast progresslari (xotirada; restart bo'lsa tarix yo'qoladi — muammo emas)
_BROADCASTS = {}


def _broadcast_markup(button):
    """button: None | {'text','url'} | 'app' — inline tugma yasaydi."""
    if not button:
        return None
    if button == 'app' or (isinstance(button, dict) and button.get('app')):
        url = getattr(settings, 'WEBAPP_URL', '') or ''
        if not url:
            return None
        return {'inline_keyboard': [[{'text': '📒 Ilovani ochish', 'web_app': {'url': url}}]]}
    text = (button.get('text') or '').strip()
    url = (button.get('url') or '').strip()
    if not text or not url.startswith('http'):
        return None
    return {'inline_keyboard': [[{'text': text, 'url': url}]]}


def _send_broadcast_msg(chat_id, text, markup):
    """Bitta foydalanuvchiga yuboradi; ok bool qaytaradi (bloklaganlar hisobi uchun)."""
    import requests, json
    token = settings.BOT_TOKEN
    if not token:
        return False
    payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}
    if markup:
        payload['reply_markup'] = json.dumps(markup)
    try:
        r = requests.post(f'https://api.telegram.org/bot{token}/sendMessage',
                          data=payload, timeout=10)
        return r.json().get('ok', False)
    except Exception:
        return False


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_broadcast(request):
    """Barcha foydalanuvchilarga Telegram orqali xabar yuboradi (fonda).

    Body: {text, button: null|'app'|{text,url}, test: bool}
    test=true — faqat adminning o'ziga yuboriladi (ko'rib olish uchun).
    Javob: {ok, broadcast_id, total} — progress /broadcast-status/ dan olinadi.
    """
    deny = _admin_or_403(request)
    if deny:
        return deny
    text = (request.data.get('text') or '').strip()
    if not text:
        return Response({'error': 'Matn bo\'sh'}, status=400)
    if len(text) > 4000:
        return Response({'error': 'Matn juda uzun (maks. 4000 belgi)'}, status=400)

    markup = _broadcast_markup(request.data.get('button'))
    full_text = f'📢 <b>E\'lon</b>\n\n{text}'

    # Test rejimi — faqat adminga
    if request.data.get('test'):
        ok = _send_broadcast_msg(request.user.telegram_id, full_text, markup)
        return Response({'ok': ok, 'test': True})

    targets = list(User.objects.filter(telegram_id__isnull=False)
                   .values_list('telegram_id', flat=True))

    import uuid, threading, time
    bc_id = uuid.uuid4().hex[:12]
    _BROADCASTS[bc_id] = {'total': len(targets), 'sent': 0, 'failed': 0,
                          'done': False, 'started': timezone.now().isoformat()}

    def _send_all():
        st = _BROADCASTS[bc_id]
        for tid in targets:
            if _send_broadcast_msg(tid, full_text, markup):
                st['sent'] += 1
            else:
                st['failed'] += 1   # bloklagan yoki o'chirgan foydalanuvchilar
            time.sleep(0.05)   # Telegram rate-limit (~20/s)
        st['done'] = True

    threading.Thread(target=_send_all, daemon=True).start()
    return Response({'ok': True, 'broadcast_id': bc_id, 'total': len(targets)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_broadcast_status(request, bc_id):
    """Broadcast progressi — frontend poll qiladi."""
    deny = _admin_or_403(request)
    if deny:
        return deny
    st = _BROADCASTS.get(bc_id)
    if not st:
        return Response({'error': 'Topilmadi'}, status=404)
    return Response(st)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_sms_logs(request):
    """SMS statistika: jami, turlar bo'yicha, kim nechta yuborgan + so'nggi yozuvlar."""
    deny = _admin_or_403(request)
    if deny:
        return deny

    from apps.notifications.models import SmsLog

    qs = SmsLog.objects.select_related('sender').all()
    week_ago = timezone.now() - timedelta(days=7)

    summary = {
        'total': qs.count(),
        'reminders': qs.filter(kind='reminder').count(),
        'otp': qs.filter(kind='otp').count(),
        'week': qs.filter(created_at__gte=week_ago).count(),
    }

    # Kim nechta yuborgan (eng faol yuboruvchilar)
    per_user = (qs.values('sender', 'sender__full_name', 'sender__telegram_username')
                .annotate(c=Count('id')).order_by('-c')[:50])
    senders = [{
        'user_id': r['sender'],
        'name': r['sender__full_name'] or r['sender__telegram_username'] or "Noma'lum",
        'count': r['c'],
    } for r in per_user]

    # So'nggi 100 ta yozuv (batafsil)
    logs = [{
        'id': l.id,
        'sender': l.sender.display_name if l.sender else "Noma'lum",
        'recipient': l.recipient_name,
        'phone': l.recipient_phone,
        'kind': l.kind,
        'status': l.status,
        'message': l.message,
        'created': timezone.localtime(l.created_at).strftime('%d.%m.%Y %H:%M'),
    } for l in qs[:100]]

    return Response({'summary': summary, 'senders': senders, 'logs': logs})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_user_sms_allow(request, user_id):
    """Bitta foydalanuvchiga SMS ruxsatini yoqish/o'chirish ('selected' rejim uchun)."""
    deny = _admin_or_403(request)
    if deny:
        return deny
    try:
        u = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Topilmadi'}, status=404)
    u.sms_allowed = bool(request.data.get('allowed'))
    u.save(update_fields=['sms_allowed'])
    return Response({'id': u.id, 'sms_allowed': u.sms_allowed})
