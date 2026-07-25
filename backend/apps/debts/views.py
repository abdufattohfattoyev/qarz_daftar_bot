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


SMS_BRAND = 't.me/Qarz_Yordamchi_Bot'
SMS_MAX_LEN = 300


def _reminder_text(user, debt):
    """Qarzdorga ketadigan SMS matni. DIQQAT: tuzilishi TextUP'da tasdiqlangan
    shablonga mos bo'lishi SHART — o'zgartirsangiz, avval moderatsiyadan o'tkazing.
    Preview ham, yuborish ham shu funksiyadan foydalanadi (matn farq qilmasin)."""
    from apps.notifications import sms
    owner = sms.person_name(user.real_name or '').split()[0]   # faqat ism
    amount = f"{debt.remaining_amount:,.0f}".replace(',', ' ') + f" {debt.currency}"
    return (f"Assalomu alaykum! Eslatib o'tamiz, {owner}ga {amount} miqdoridagi "
            f"qarzingiz mavjud. Iltimos, to'lovni belgilangan muddatda amalga "
            f"oshiring. Rahmat! {SMS_BRAND}")


def _clean_custom_text(raw):
    """Foydalanuvchi tahrirlagan SMS matnini tekshiradi.
    (matn, xato) qaytaradi — xato bo'lsa matn None.

    TextUP shabloni moderatsiyadan o'tgani uchun brend qatori majburiy qoladi:
    matn oxirida bo'lmasa, o'zimiz qo'shamiz."""
    text = (raw or '').strip()
    if not text:
        return None, "Matn bo'sh bo'lishi mumkin emas"
    if len(text) < 20:
        return None, "Matn juda qisqa (kamida 20 ta belgi)"
    if SMS_BRAND not in text:
        text = f"{text} {SMS_BRAND}"
    if len(text) > SMS_MAX_LEN:
        return None, f"Matn juda uzun ({len(text)}/{SMS_MAX_LEN} belgi)"
    return text, None


def _sms_check(user, debt):
    """SMS yuborish shartlari. To'silsa Response, ruxsat bo'lsa None qaytadi.
    Frontend javobdagi flag bo'yicha kerakli oynani ochadi."""
    from apps.notifications import sms
    from apps.notifications.models import AppConfig

    cfg = AppConfig.get()
    # Rejim: off (hech kim) / selected (faqat ruxsatlilar) / all (hamma)
    if cfg.sms_mode == 'off':
        return Response({'error': "SMS eslatma xizmati vaqtincha o'chirilgan"},
                        status=status.HTTP_403_FORBIDDEN)
    if not cfg.user_can_send(user):
        return Response({'error': "SMS yuborish uchun adminga murojaat qiling",
                         'contact_admin': True}, status=status.HTTP_403_FORBIDDEN)
    if not user.phone_verified:
        return Response({'error': "Avval telefoningizni tasdiqlang",
                         'need_verify': True}, status=status.HTTP_403_FORBIDDEN)
    # Telegram profil nomi taxallus bo'lishi mumkin — SMS uchun haqiqiy ism shart
    if len(sms.person_name(user.real_name or '').replace(' ', '')) < 2:
        return Response({'error': "SMS yuborish uchun ismingizni kiriting",
                         'need_name': True}, status=status.HTTP_400_BAD_REQUEST)
    if debt.debt_type != 'gave':
        return Response({'error': "SMS eslatma faqat siz bergan qarzlar uchun"},
                        status=status.HTTP_400_BAD_REQUEST)
    if debt.status == 'paid':
        return Response({'error': "Bu qarz allaqachon to'langan"},
                        status=status.HTTP_400_BAD_REQUEST)
    if not debt.contact.phone:
        return Response({'error': "Kontaktda telefon raqami yo'q", 'need_phone': True},
                        status=status.HTTP_400_BAD_REQUEST)
    return None


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

    def perform_destroy(self, instance):
        """Qarz o'chirilganda, kontaktda boshqa qarz qolmasa — kontaktni ham
        o'chiramiz. Aks holda qarzdorlar ro'yxatida faqat ismi qolib ketardi
        va u yerdan o'chirishning iloji yo'q edi."""
        from apps.contacts.models import Contact
        contact_id = instance.contact_id
        instance.delete()
        if contact_id and not Debt.objects.filter(contact_id=contact_id).exists():
            Contact.objects.filter(id=contact_id, owner=self.request.user).delete()

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

    @action(detail=True, methods=['get'], url_path='sms_preview')
    def sms_preview(self, request, pk=None):
        """Yuborishdan oldingi ko'rinish: kimga va aynan qanday matn ketadi.
        send_sms bilan bir xil tekshiruv va bir xil matn (bitta manba)."""
        debt = self.get_object()
        blocked = _sms_check(request.user, debt)
        if blocked:
            return blocked
        return Response({
            'text': _reminder_text(request.user, debt),
            'contact_name': debt.contact.name,
            'phone': debt.contact.phone,
            # Matnni tahrirlash mumkin — chegaralar frontendga
            'editable': True,
            'max_len': SMS_MAX_LEN,
            'brand': SMS_BRAND,
        })

    @action(detail=True, methods=['post'], url_path='send_sms')
    def send_sms(self, request, pk=None):
        """Qarzdorga SMS eslatma (TextUP). Spam bo'lmasin — har qarzga 5 daqiqada 1 ta."""
        from django.core.cache import cache
        from apps.notifications import sms

        debt = self.get_object()
        blocked = _sms_check(request.user, debt)
        if blocked:
            return blocked

        rl_key = f'sms_rl:{debt.id}'
        if cache.get(rl_key):
            return Response({'error': "SMS yaqinda yuborilgan — 5 daqiqadan keyin qayta urinib ko'ring"},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Foydalanuvchi tasdiqlash oynasida matnni tahrirlagan bo'lishi mumkin
        if request.data.get('text'):
            text, err = _clean_custom_text(request.data.get('text'))
            if err:
                return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)
        else:
            text = _reminder_text(request.user, debt)

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

    @action(detail=True, methods=['delete'], url_path='payments/(?P<payment_id>[^/.]+)')
    def delete_payment(self, request, pk=None, payment_id=None):
        """Xato kiritilgan to'lovni (tarix yozuvini) o'chirish.
        Payment.save qarz paid_amount va holatini qayta hisoblaydi, shuning uchun
        o'chirgach qarz avtomatik 'active'/'partial' ga qaytadi."""
        from django.db import transaction
        debt = self.get_object()
        try:
            with transaction.atomic():
                payment = debt.payments.select_for_update().get(pk=payment_id)
                payment.delete()
                # paid_amount ni qolgan to'lovlardan qayta hisoblaymiz
                debt.refresh_from_db()
                total = sum(p.amount for p in debt.payments.all())
                debt.paid_amount = total
                debt.save(update_fields=['paid_amount', 'status'])
        except Payment.DoesNotExist:
            return Response({'error': "To'lov topilmadi"}, status=status.HTTP_404_NOT_FOUND)
        debt.refresh_from_db()
        return Response(DebtSerializer(debt, context={'request': request}).data)

    @action(detail=False, methods=['get'], url_path='delete_preview')
    def delete_preview(self, request):
        """O'chirish oynasi uchun: har kategoriyada nechta yozuv borligi.
        Foydalanuvchi nima yo'qolishini bilib turib bosadi."""
        from apps.contacts.models import Contact
        from apps.notifications.models import SmsLog

        debts = Debt.objects.filter(user=request.user)
        return Response({
            'paid_debts': debts.filter(status='paid').count(),
            'active_debts': debts.filter(status__in=['active', 'partial']).count(),
            'all_debts': debts.count(),
            'contacts': Contact.objects.filter(owner=request.user).count(),
            'empty_contacts': Contact.objects.filter(owner=request.user)
                                             .exclude(debts__isnull=False).count(),
            'sms_logs': SmsLog.objects.filter(sender=request.user).count(),
        })

    @action(detail=False, methods=['delete', 'post'], url_path='delete_all')
    def delete_all(self, request):
        """Tanlangan kategoriyalarni o'chirish.

        scopes: ['paid_debts', 'active_debts', 'all_debts',
                 'empty_contacts', 'contacts', 'sms_logs']
        Bo'sh kelsa — hech narsa o'chirilmaydi (bilmasdan bosishdan himoya).
        Eski mijozlar uchun scopes=['everything'] — avvalgi xatti-harakat."""
        from apps.contacts.models import Contact
        from apps.notifications.models import SmsLog

        scopes = request.data.get('scopes') or []
        if isinstance(scopes, str):
            scopes = [scopes]
        scopes = set(scopes)
        if not scopes:
            return Response({'error': "O'chiriladigan bo'limni tanlang"},
                            status=status.HTTP_400_BAD_REQUEST)

        if 'everything' in scopes:
            scopes |= {'all_debts', 'contacts'}

        result = {}
        debts = Debt.objects.filter(user=request.user)

        if 'all_debts' in scopes:
            result['debts'] = debts.delete()[0]
        else:
            if 'paid_debts' in scopes:
                result['paid_debts'] = debts.filter(status='paid').delete()[0]
            if 'active_debts' in scopes:
                result['active_debts'] = debts.filter(
                    status__in=['active', 'partial']).delete()[0]

        if 'contacts' in scopes:
            result['contacts'] = Contact.objects.filter(owner=request.user).delete()[0]
        elif 'empty_contacts' in scopes or 'all_debts' in scopes or 'paid_debts' in scopes \
                or 'active_debts' in scopes:
            # Qarzi qolmagan kontaktlar osilib qolmasin
            result['empty_contacts'] = Contact.objects.filter(
                owner=request.user).exclude(debts__isnull=False).delete()[0]

        if 'sms_logs' in scopes:
            result['sms_logs'] = SmsLog.objects.filter(sender=request.user).delete()[0]

        return Response(result, status=status.HTTP_200_OK)
