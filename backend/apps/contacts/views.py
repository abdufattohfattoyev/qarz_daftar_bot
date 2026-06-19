from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Contact
from .serializers import ContactSerializer, ContactCreateSerializer


class ContactViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'phone', 'telegram_username']
    ordering_fields = ['name', 'created_at', 'balance_uzs']
    ordering = ['-created_at']

    def get_queryset(self):
        return Contact.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ContactCreateSerializer
        return ContactSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'])
    def debts(self, request, pk=None):
        """Kontaktning barcha qarzlari"""
        contact = self.get_object()
        from apps.debts.models import Debt
        from apps.debts.serializers import DebtSerializer
        debts = Debt.objects.filter(
            user=request.user, contact=contact
        ).order_by('-created_at')
        serializer = DebtSerializer(debts, many=True)
        return Response(serializer.data)
