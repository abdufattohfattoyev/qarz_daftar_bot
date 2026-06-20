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
        """Qarzni to'lash yoki qisman to'lash"""
        debt = self.get_object()

        if debt.status == 'paid':
            return Response(
                {'error': 'Bu qarz allaqachon to\'liq to\'langan'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = PayDebtSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data['amount']
        note = serializer.validated_data.get('note', '')

        # To'lov miqdori qoldiqdan oshmasligi kerak
        if amount > debt.remaining_amount:
            return Response(
                {'error': f'To\'lov miqdori qoldiqdan ({debt.remaining_amount}) oshib ketdi'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment = Payment.objects.create(
            debt=debt,
            amount=amount,
            note=note,
            created_by=request.user
        )

        debt.refresh_from_db()
        return Response({
            'payment': PaymentSerializer(payment).data,
            'debt': DebtSerializer(debt, context={'request': request}).data,
        })

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
        deleted_contacts, _ = Contact.objects.filter(user=request.user).delete()
        return Response({
            'deleted_debts': deleted_debts,
            'deleted_contacts': deleted_contacts,
        }, status=status.HTTP_200_OK)
