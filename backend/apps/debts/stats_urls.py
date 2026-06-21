from django.urls import path
from .stats_views import stats, export_excel, send_report

urlpatterns = [
    path('', stats, name='stats'),
    path('export/', export_excel, name='export-excel'),
    path('send/', send_report, name='send-report'),
]
