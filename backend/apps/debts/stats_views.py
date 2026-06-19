from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import openpyxl
from django.http import HttpResponse
from .models import Debt


def get_period_filter(period):
    now = timezone.now()
    if period == 'today':
        return now.date()
    elif period == '7days':
        return now.date() - timedelta(days=7)
    elif period == 'month':
        return now.replace(day=1).date()
    elif period == 'last_month':
        first_this = now.replace(day=1).date()
        return (first_this - timedelta(days=1)).replace(day=1)
    return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats(request):
    """Asosiy statistika"""
    user = request.user
    period = request.query_params.get('period', 'all')
    currency = request.query_params.get('currency', 'UZS')

    qs = Debt.objects.filter(user=user, currency=currency)

    if period != 'all':
        date_from = get_period_filter(period)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)

    # Menga berishadi (men berdim, faol)
    gave_active = qs.filter(debt_type='gave', status__in=['active', 'partial'])
    gave_total = gave_active.aggregate(
        total=Sum('amount'), paid=Sum('paid_amount')
    )
    gave_remaining = (gave_total['total'] or Decimal(0)) - (gave_total['paid'] or Decimal(0))

    # Men beraman (mendan oldi, faol)
    got_active = qs.filter(debt_type='got', status__in=['active', 'partial'])
    got_total = got_active.aggregate(
        total=Sum('amount'), paid=Sum('paid_amount')
    )
    got_remaining = (got_total['total'] or Decimal(0)) - (got_total['paid'] or Decimal(0))

    # Umumiy berilgan / qabul qilingan
    all_gave = qs.filter(debt_type='gave').aggregate(total=Sum('amount'))
    all_got = qs.filter(debt_type='got').aggregate(total=Sum('amount'))

    # Top qarzdorlar (menga beradigan)
    from apps.contacts.models import Contact
    top_contacts = []
    contacts_with_debt = Contact.objects.filter(
        owner=user,
        debts__status__in=['active', 'partial'],
        debts__debt_type='gave',
        debts__currency=currency
    ).distinct()

    for contact in contacts_with_debt[:10]:
        debts = contact.debts.filter(
            user=user, debt_type='gave',
            status__in=['active', 'partial'], currency=currency
        )
        remaining = sum(d.remaining_amount for d in debts)
        if remaining > 0:
            top_contacts.append({
                'id': contact.id,
                'name': contact.name,
                'initials': contact.initials,
                'phone': contact.phone,
                'remaining': remaining,
            })

    top_contacts.sort(key=lambda x: x['remaining'], reverse=True)

    # Qarzdorlar soni
    debtors_count = gave_active.values('contact').distinct().count()

    return Response({
        'currency': currency,
        'period': period,
        'summary': {
            'i_lent': str(gave_remaining),        # Menga berishadi
            'i_borrowed': str(got_remaining),      # Men beraman
            'net_balance': str(gave_remaining - got_remaining),
            'debtors_count': debtors_count,
        },
        'totals': {
            'total_gave': str(all_gave['total'] or 0),
            'total_got': str(all_got['total'] or 0),
        },
        'top_debtors': top_contacts[:5],
        'active_debts': qs.filter(status__in=['active', 'partial']).count(),
        'paid_debts': qs.filter(status='paid').count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_excel(request):
    """Excel faylga export qilish"""
    user = request.user
    debts = Debt.objects.filter(user=user).select_related('contact').order_by('-created_at')

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Qarz daftar'

    # Sarlavha
    headers = [
        'Sana', 'Kontakt', 'Telefon', 'Tur', 'Miqdor',
        'To\'langan', 'Qoldi', 'Valyuta', 'Holat', 'Izoh', 'Muddat'
    ]
    ws.append(headers)

    # Ma'lumotlar
    for debt in debts:
        type_display = 'Men berdim' if debt.debt_type == 'gave' else 'Mendan oldi'
        status_display = {'active': 'Faol', 'partial': 'Qisman', 'paid': 'To\'langan'}.get(debt.status, '')
        ws.append([
            debt.created_at.strftime('%d.%m.%Y %H:%M'),
            debt.contact.name,
            debt.contact.phone,
            type_display,
            float(debt.amount),
            float(debt.paid_amount),
            float(debt.remaining_amount),
            debt.currency,
            status_display,
            debt.note,
            debt.due_date.strftime('%d.%m.%Y') if debt.due_date else '',
        ])

    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="qarz_daftar.xlsx"'
    wb.save(response)
    return response
