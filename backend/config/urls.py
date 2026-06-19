from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/debts/', include('apps.debts.urls')),
    path('api/contacts/', include('apps.contacts.urls')),
    path('api/stats/', include('apps.debts.stats_urls')),
    path('webhook/', include('apps.notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
