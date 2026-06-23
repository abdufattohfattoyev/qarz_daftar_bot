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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_broadcast(request):
    """Barcha foydalanuvchilarga Telegram orqali xabar yuboradi (fonda)."""
    deny = _admin_or_403(request)
    if deny:
        return deny
    text = (request.data.get('text') or '').strip()
    if not text:
        return Response({'error': 'Matn bo\'sh'}, status=400)

    targets = list(User.objects.filter(telegram_id__isnull=False)
                   .values_list('telegram_id', flat=True))

    def _send_all():
        from apps.notifications.bot import send
        import time
        for tid in targets:
            try:
                send(tid, f'📢 <b>E\'lon</b>\n\n{text}')
                time.sleep(0.05)   # Telegram rate-limit (~20/s)
            except Exception:
                pass

    import threading
    threading.Thread(target=_send_all, daemon=True).start()
    return Response({'ok': True, 'sent_to': len(targets)})
