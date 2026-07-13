from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as df_filters
from .models import Debt, Payment
from .serializers import DebtSerializer, DebtCreateSerializer, PayDebtSerializer, PaymentSerializer


class DebtFilter(df_filters.FilterSet):
    status = df_filters.CharFilter(field_name='status')
    debt_type = df_filters.CharFilter(field_name='debt_type')
    currency = df_filters.CharFilter(field_name='currency')
    contact = df_filters.NumberFilter(field_name='contact__id')
    date_from = df_filters.DateFilter(field_name='created_at__date', lookup_expr='gte')
    date_to = df_filters.DateFilter(field_name='created_at__date', lookup_expr='lte')

    class Meta:
        model = Debt
        fields = ['status', 'debt_type', 'currency', 'contact', 'date_from', 'date_to']


class DebtViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DebtFilter
    search_fields = ['contact__name', 'note']
    ordering_fields = ['created_at', 'amount', 'due_date']
    ordering = ['-created_at']

    def get_queryset(self):
        return Debt.objects.filter(
            user=self.request.user
        ).select_related('contact').prefetch_related('payments')

    def get_serializer_class(self):
        if self.action == 'create':
            return DebtCreateSerializer
        if self.action == 'pay':
            return PayDebtSerializer
        return DebtSerializer

    def perform_create(self, serializer):
        debt = serializer.save(user=self.request.user)
        # Telegram bildirishnoma yuborish (async)
        try:
            from apps.notifications.tasks import notify_debt_created
            notify_debt_created(debt.id)
        except Exception:
            pass

    def create(self, request, *args, **kwargs):
        """Yaratgandan keyin TO'LIQ qarz obyektini qaytaramiz (id, created_at,
        contact_name, remaining_amount...) — frontend uni darhol ishlatadi,
        aks holda Asosiy sahifa created_at yo'qligidan qulab tushadi."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        full = DebtSerializer(serializer.instance, context={'request': request})
        return Response(full.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Qarzni to'lash yoki qisman to'lash.

        Tranzaksiya + select_for_update — bir vaqtda ikki marta bosilsa ham
        ortiqcha to'lov o'tmaydi (qator qulflanadi, qoldiq qaytadan o'qiladi)."""
        from django.db import transaction

        serializer = PayDebtSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data['amount']
        note = serializer.validated_data.get('note', '')

        try:
            with transaction.atomic():
                debt = Debt.objects.select_for_update().get(pk=pk, user=request.user)

                if debt.status == 'paid':
                    return Response({'error': 'Bu qarz allaqachon to\'liq to\'langan'},
                                    status=status.HTTP_400_BAD_REQUEST)

                if amount > debt.remaining_amount:
                    return Response(
                        {'error': f'To\'lov miqdori qoldiqdan ({debt.remaining_amount}) oshib ketdi'},
                        status=status.HTTP_400_BAD_REQUEST)

                payment = Payment.objects.create(
                    debt=debt, amount=amount, note=note, created_by=request.user)
        except Debt.DoesNotExist:
            return Response({'error': 'Qarz topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        # Telegram bildirishnoma (fonda, so'rovni bloklamaydi)
        try:
            from apps.notifications.tasks import notify_payment_made
            notify_payment_made(payment.id)
        except Exception:
            pass

        debt.refresh_from_db()
        return Response({
            'payment': PaymentSerializer(payment).data,
            'debt': DebtSerializer(debt, context={'request': request}).data,
        })

    @action(detail=True, methods=['post'], url_path='send_sms')
    def send_sms(self, request, pk=None):
        """Qarzdorga SMS eslatma (TextUP). Spam bo'lmasin — har qarzga 5 daqiqada 1 ta.

        HOZIRCHA TEST REJIMI: faqat admin (ADMIN_CHAT_ID) ishlatadi — hammaga
        ochish uchun quyidagi admin tekshiruvini olib tashlash kifoya."""
        from django.conf import settings as dj_settings
        from django.core.cache import cache
        from apps.notifications import sms

        admin = str(getattr(dj_settings, 'ADMIN_CHAT_ID', '') or '').strip()
        if not admin or str(request.user.telegram_id) != admin:
            return Response({'error': 'SMS eslatma hozircha test rejimida — faqat admin uchun'},
                            status=status.HTTP_403_FORBIDDEN)

        debt = self.get_object()

        if debt.debt_type != 'gave':
            return Response({'error': "SMS eslatma faqat siz bergan qarzlar uchun"},
                            status=status.HTTP_400_BAD_REQUEST)
        if debt.status == 'paid':
            return Response({'error': "Bu qarz allaqachon to'langan"},
                            status=status.HTTP_400_BAD_REQUEST)
        if not debt.contact.phone:
            return Response({'error': "Kontaktda telefon raqami yo'q — avval kontaktga raqam qo'shing"},
                            status=status.HTTP_400_BAD_REQUEST)

        rl_key = f'sms_rl:{debt.id}'
        if cache.get(rl_key):
            return Response({'error': "SMS yaqinda yuborilgan — 5 daqiqadan keyin qayta urinib ko'ring"},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Ismlarni lotinchaga o'giramiz — TextUP shabloni lotin matn bilan tasdiqlangan
        owner = sms.person_name(request.user.full_name or request.user.telegram_username or '')
        contact_name = sms.person_name(debt.contact.name)
        amount = f"{debt.remaining_amount:,.0f}".replace(',', ' ') + f" {debt.currency}"
        base = f"Assalomu alaykum, {contact_name}! Eslatma: sizda"
        base += f" {owner} oldida" if owner else ''
        base += f" {amount} qarz bor."

        # Avval muddatli variant, shablon validatsiyadan o'tmasa muddatsiz retry
        # (TextUP'da "muddat bilan" shablon maskasi hozircha nosoz)
        variants = [base + " (Qarz Yordamchi)"]
        if debt.due_date:
            variants.insert(0, base + f" Muddat: {debt.due_date.strftime('%d.%m.%Y')}. (Qarz Yordamchi)")

        sms_id, text, last_err = None, None, None
        for candidate in variants:
            try:
                sms_id = sms.send_sms(debt.contact.phone, candidate, name=f'debt-{debt.id}')
                text = candidate
                break
            except sms.SmsError as e:
                last_err = e
                if not getattr(e, 'template_error', False):
                    break   # shablon xatosi emas — boshqa variant ham o'tmaydi
        if sms_id is None:
            return Response({'error': str(last_err)}, status=status.HTTP_400_BAD_REQUEST)

        cache.set(rl_key, 1, 300)
        return Response({'ok': True, 'sms_id': sms_id, 'text': text})

    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """Qarz to'lov tarixi"""
        debt = self.get_object()
        payments = debt.payments.all()
        return Response(PaymentSerializer(payments, many=True).data)

    @action(detail=False, methods=['delete'], url_path='delete_all')
    def delete_all(self, request):
        """Foydalanuvchining barcha qarz va kontaktlarini o'chirish"""
        from apps.contacts.models import Contact
        deleted_debts, _ = Debt.objects.filter(user=request.user).delete()
        deleted_contacts, _ = Contact.objects.filter(owner=request.user).delete()
        return Response({
            'deleted_debts': deleted_debts,
            'deleted_contacts': deleted_contacts,
        }, status=status.HTTP_200_OK)
