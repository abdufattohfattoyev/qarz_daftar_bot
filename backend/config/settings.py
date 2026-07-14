import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# .env faylni yuklaymiz (lokal dev uchun; Docker'da env'lar compose'dan keladi).
# load_dotenv mavjud env'larni ustiga yozmaydi — shuning uchun ikkalasi ham ishlaydi.
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / '.env')
except ImportError:
    pass

SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.environ.get('DEBUG', '0') == '1'   # standart — XAVFSIZ (o'chiq); dev'da .env da DEBUG=1

# Production'da dev kalitlari bilan ishga tushishni taqiqlaymiz
if not DEBUG and SECRET_KEY == 'dev-secret-key-change-in-production':
    raise RuntimeError(
        "Production uchun SECRET_KEY .env faylda o'rnatilishi SHART "
        "(DEBUG=0 da dev kalit ishlatib bo'lmaydi)."
    )

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    # Local
    'apps.users',
    'apps.debts',
    'apps.contacts',
    'apps.notifications',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'qarz_daftar'),
        'USER': os.environ.get('DB_USER', 'qarz_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'qarz_pass'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
        'rest_framework.filters.SearchFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

from datetime import timedelta
SIMPLE_JWT = {
    # Access qisqa umrli — o'g'irlansa zarari kam; refresh (30 kun) + Telegram
    # re-auth orqali interceptor jim yangilab turadi.
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
}

# Production xavfsizlik sozlamalari (DEBUG=0 da yoqiladi)
if not DEBUG:
    SECURE_SSL_REDIRECT = False  # nginx HTTPS'ni o'zi hal qiladi
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173'
).split(',')
CORS_ALLOW_CREDENTIALS = True

# HTTPS proxy ortida — nginx X-Forwarded-Proto yuboradi
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Admin login uchun CSRF ishonchli manbalar (HTTPS domenlar)
CSRF_TRUSTED_ORIGINS = os.environ.get(
    'CSRF_TRUSTED_ORIGINS',
    'https://nasiya-karta.uz,https://www.nasiya-karta.uz'
).split(',')

LANGUAGE_CODE = 'uz'
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

BOT_TOKEN = os.environ.get('BOT_TOKEN', '')
WEBAPP_URL = os.environ.get('WEBAPP_URL', 'https://nasiya-karta.uz')

# Claude API — ovozli/matnli qarz parsing uchun (Haiku 4.5)
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
# AI qarz kiritish faqat shu Telegram ID uchun ishlaydi (admin)
ADMIN_CHAT_ID = os.environ.get('ADMIN_CHAT_ID', '')

# TextUP SMS shlyuz (https://textup.uz) — qarzdorga SMS eslatma yuborish
TEXTUP_EMAIL = os.environ.get('TEXTUP_EMAIL', '')
TEXTUP_PASSWORD = os.environ.get('TEXTUP_PASSWORD', '')      # saytdagi "Yashirin kalit"
TEXTUP_NICKNAME_ID = os.environ.get('TEXTUP_NICKNAME_ID', '')  # ixtiyoriy — alpha name (nik)
TEXTUP_TEMPLATE_ID = os.environ.get('TEXTUP_TEMPLATE_ID', '')  # qarz eslatma shabloni ID (moderatsiya shart)
TEXTUP_OTP_TEMPLATE_ID = os.environ.get('TEXTUP_OTP_TEMPLATE_ID', '')  # tasdiqlash kodi shabloni ID

# Ilovaga kirish uchun telefon tasdiqlash MAJBURIYmi? Standart — O'CHIQ.
# DIQQAT: faqat OTP shabloni TextUP'da TASDIQLANGANDAN keyin yoqing, aks holda
# hech kim (siz ham) ilovaga kira olmaydi (kod SMS'i kelmaydi).
REQUIRE_PHONE_VERIFICATION = os.environ.get('REQUIRE_PHONE_VERIFICATION', '0') == '1'
