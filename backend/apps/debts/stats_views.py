from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from .models import Debt, Payment


def get_period_range(period):
    """Davr uchun (boshlanish, tugash) sanalarini qaytaradi. None — barchasi."""
    today = timezone.now().date()
    if period == 'today':
        return today, today
    if period == '7days':
        return today - timedelta(days=6), today      # bugun bilan birga 7 kun
    if period == 'month':
        return today.replace(day=1), today
    if period == 'last_month':
        first_this = today.replace(day=1)
        last_prev = first_this - timedelta(days=1)    # o'tgan oyning oxirgi kuni
        return last_prev.replace(day=1), last_prev    # faqat o'tgan oy oralig'i
    return None, today


def _f(v):
    return float(v or 0)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats(request):
    """Asosiy statistika — davr filtri, to'lovlar va kunlik diagramma bilan."""
    user = request.user
    period = request.query_params.get('period', 'all')
    currency = request.query_params.get('currency', 'UZS')

    qs = Debt.objects.filter(user=user, currency=currency)
    date_from, date_to = get_period_range(period)
    if period != 'all' and date_from:
        qs = qs.filter(created_at__date__gte=date_from, created_at__date__lte=date_to)

    # Faol qoldiqlar (butun balans — davrdan qat'i nazar emas, joriy qarzlar bo'yicha)
    gave_active = qs.filter(debt_type='gave', status__in=['active', 'partial'])
    gt = gave_active.aggregate(total=Sum('amount'), paid=Sum('paid_amount'))
    gave_remaining = (gt['total'] or Decimal(0)) - (gt['paid'] or Decimal(0))

    got_active = qs.filter(debt_type='got', status__in=['active', 'partial'])
    gott = got_active.aggregate(total=Sum('amount'), paid=Sum('paid_amount'))
    got_remaining = (gott['total'] or Decimal(0)) - (gott['paid'] or Decimal(0))

    # Davr ichida yaratilgan qarzlar (berdim / oldim)
    all_gave = qs.filter(debt_type='gave').aggregate(total=Sum('amount'))
    all_got = qs.filter(debt_type='got').aggregate(total=Sum('amount'))

    # To'lovlar (davr ichida, paid_at bo'yicha)
    pay_qs = Payment.objects.filter(debt__user=user, debt__currency=currency)
    if period != 'all' and date_from:
        pay_qs = pay_qs.filter(paid_at__date__gte=date_from, paid_at__date__lte=date_to)
    received = pay_qs.filter(debt__debt_type='gave').aggregate(s=Sum('amount'))['s']  # menga qaytarishdi
    paid_out = pay_qs.filter(debt__debt_type='got').aggregate(s=Sum('amount'))['s']    # men to'ladim
    payments_count = pay_qs.count()

    # Kunlik diagramma (berdim vs oldim, sana bo'yicha)
    by_day = {}
    for row in qs.annotate(d=TruncDate('created_at')).values('d', 'debt_type').annotate(s=Sum('amount')):
        slot = by_day.setdefault(row['d'], {'gave': 0, 'got': 0})
        slot[row['debt_type']] = _f(row['s'])

    chart = []
    if period != 'all' and date_from:
        # Davrning har bir kunini to'ldiramiz (bo'sh kunlar 0)
        start = date_from
        if (date_to - start).days > 31:
            start = date_to - timedelta(days=31)
        d = start
        while d <= date_to:
            v = by_day.get(d, {})
            chart.append({'date': d.isoformat(), 'gave': v.get('gave', 0), 'got': v.get('got', 0)})
            d += timedelta(days=1)
    else:
        # Barchasi — mavjud kunlardan oxirgi 31 tasi
        for d in sorted(by_day)[-31:]:
            v = by_day[d]
            chart.append({'date': d.isoformat(), 'gave': v.get('gave', 0), 'got': v.get('got', 0)})

    # Top qarzdorlar (menga beradigan)
    from apps.contacts.models import Contact
    top_contacts = []
    contacts_with_debt = Contact.objects.filter(
        owner=user,
        debts__status__in=['active', 'partial'],
        debts__debt_type='gave',
        debts__currency=currency
    ).distinct()
    for contact in contacts_with_debt[:20]:
        debts = contact.debts.filter(
            user=user, debt_type='gave',
            status__in=['active', 'partial'], currency=currency
        )
        remaining = sum(d.remaining_amount for d in debts)
        if remaining > 0:
            top_contacts.append({
                'id': contact.id, 'name': contact.name,
                'initials': contact.initials, 'phone': contact.phone,
                'remaining': float(remaining),
            })
    top_contacts.sort(key=lambda x: x['remaining'], reverse=True)

    debtors_count = gave_active.values('contact').distinct().count()

    return Response({
        'currency': currency,
        'period': period,
        'summary': {
            'i_lent': str(gave_remaining),
            'i_borrowed': str(got_remaining),
            'net_balance': str(gave_remaining - got_remaining),
            'debtors_count': debtors_count,
            'total_count': qs.count(),               # davr ichidagi qarzlar soni
        },
        'totals': {
            'total_gave': str(all_gave['total'] or 0),
            'total_got': str(all_got['total'] or 0),
        },
        'payments': {
            'received': str(received or 0),           # qabul qildim
            'paid': str(paid_out or 0),               # to'ladim
            'count': payments_count,
        },
        'chart': chart,
        'top_debtors': top_contacts[:5],
        'active_debts': qs.filter(status__in=['active', 'partial']).count(),
        'paid_debts': qs.filter(status='paid').count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_excel(request):
    """Chiroyli Excel faylga export (to'g'ridan-to'g'ri yuklab olish)."""
    from .reports import build_excel
    data = build_excel(request.user)
    response = HttpResponse(
        data,
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="qarz_daftar.xlsx"'
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_report(request):
    """Hisobotni Telegram bot orqali yuborish. format: 'excel' | 'image'."""
    user = request.user
    if not user.telegram_id:
        return Response({'error': 'Telegram ulanmagan'}, status=400)

    fmt = request.data.get('format', 'excel')
    from apps.notifications import bot
    from .reports import build_excel, build_image

    try:
        if fmt == 'image':
            img = build_image(user)
            ok = bot.send_photo(user.telegram_id, img, 'qarz_hisobot.png',
                                caption='📊 <b>Qarz daftar hisoboti</b>')
        else:
            xlsx = build_excel(user)
            ok = bot.send_document(user.telegram_id, xlsx, 'qarz_daftar.xlsx',
                                   caption='📒 <b>Qarz daftar hisoboti</b>')
    except Exception as e:
        return Response({'error': str(e)}, status=500)

    if not ok:
        return Response({'error': 'Yuborishda xato'}, status=500)
    return Response({'ok': True})
