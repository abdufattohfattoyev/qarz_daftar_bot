from django.urls import path
from .stats_views import stats, export_excel

urlpatterns = [
    path('', stats, name='stats'),
    path('export/', export_excel, name='export-excel'),
]
