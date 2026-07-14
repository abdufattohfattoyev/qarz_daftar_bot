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
        # Qarzni o'zi yaratgan foydalanuvchiga Telegram xabari YUBORILMAYDI —
        # natijani ilovada darhol ko'radi, ortiqcha xabar bo'lmasin.
        serializer.save(user=self.request.user)

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

        # To'lovni o'zi qilgan foydalanuvchiga Telegram xabari yuborilmaydi —
        # natija ilovada ko'rinadi (ortiqcha xabarlarni kamaytiramiz).
        debt.refresh_from_db()
        return Response({
            'payment': PaymentSerializer(payment).data,
            'debt': DebtSerializer(debt, context={'request': request}).data,
        })

    @action(detail=True, methods=['post'], url_path='send_sms')
    def send_sms(self, request, pk=None):
        """Qarzdorga SMS eslatma (TextUP). Spam bo'lmasin — har qarzga 5 daqiqada 1 ta.

        Faqat telefoni tasdiqlangan foydalanuvchi yuborishi mumkin
        (Sozlamalar → Telefonni tasdiqlash)."""
        from django.core.cache import cache
        from apps.notifications import sms
        from apps.notifications.models import AppConfig

        cfg = AppConfig.get()
        # Rejim: off (hech kim) / selected (faqat ruxsatlilar) / all (hamma)
        if cfg.sms_mode == 'off':
            return Response({'error': "SMS eslatma xizmati vaqtincha o'chirilgan"},
                            status=status.HTTP_403_FORBIDDEN)
        if not cfg.user_can_send(request.user):
            return Response({'error': "SMS yuborish uchun adminga murojaat qiling",
                             'contact_admin': True}, status=status.HTTP_403_FORBIDDEN)
        if not request.user.phone_verified:
            return Response({'error': "Avval telefoningizni tasdiqlang",
                             'need_verify': True}, status=status.HTTP_403_FORBIDDEN)

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

        # Kreditor ISMI (faqat birinchi so'z) — lotinchaga o'giramiz, TextUP shabloni
        # lotin matn bilan tasdiqlangan
        owner_full = sms.person_name(
            request.user.full_name or request.user.telegram_username or '',
            fallback="Do'stingiz")
        owner = owner_full.split()[0]   # faqat ism, familiya emas
        amount = f"{debt.remaining_amount:,.0f}".replace(',', ' ') + f" {debt.currency}"
        text = (f"Assalomu alaykum! Eslatib o'tamiz, {owner}ga {amount} miqdoridagi "
                f"qarzingiz mavjud. Iltimos, to'lovni belgilangan muddatda amalga "
                f"oshiring. Rahmat! t.me/Qarz_Yordamchi_Bot")

        try:
            sms_id = sms.send_sms(debt.contact.phone, text, name=f'debt-{debt.id}')
        except sms.SmsError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Statistika uchun yozib qo'yamiz (kim, kimga, qaysi qarz)
        from apps.notifications.models import SmsLog
        SmsLog.objects.create(
            sender=request.user, debt=debt,
            recipient_name=debt.contact.name, recipient_phone=debt.contact.phone,
            message=text, kind='reminder', status='sent', sms_id=sms_id or '',
        )
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
