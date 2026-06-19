# 📒 Qarz Daftar — Telegram Mini App

Django + React + PostgreSQL + Docker

---

## 📁 Loyiha tuzilmasi

```
qarz_daftar/
├── backend/              # Django REST API
│   ├── apps/
│   │   ├── users/        # Telegram auth, User model
│   │   ├── debts/        # Qarz, To'lov modellari
│   │   ├── contacts/     # Kontaktlar
│   │   └── notifications/# Telegram bot webhook
│   ├── config/           # Django settings, urls
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/             # React + Vite
│   ├── src/
│   │   ├── api/          # Axios client
│   │   ├── pages/        # Barcha sahifalar
│   │   ├── store/        # Zustand state
│   │   └── utils/        # Yordamchi funksiyalar
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf        # Reverse proxy
├── docker-compose.yml
├── deploy.sh             # Bir buyruq bilan deploy
└── README.md
```

---

## 🚀 Ishga tushirish (5 qadam)

### 1. Telegram Bot yaratish
1. [@BotFather](https://t.me/BotFather) ga yozing
2. `/newbot` buyrug'ini yuboring
3. Bot token ni olib qo'ying

### 2. Serverni tayyorlash
```bash
# Ubuntu 22.04 ga Docker o'rnatish
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Loyihani serverga yuklash
```bash
git clone https://github.com/yourusername/qarz-daftar.git
cd qarz-daftar
```

### 4. .env faylni sozlash
```bash
cp .env.example .env
nano .env
```

```env
SECRET_KEY=your-very-secret-key-here-change-it
DEBUG=0
BOT_TOKEN=123456789:ABCdef...    # BotFather dan olgan token
WEBAPP_URL=https://yourdomain.com
ALLOWED_HOSTS=yourdomain.com
DB_PASSWORD=strong_password_here
```

### 5. Deploy!
```bash
bash deploy.sh
```

**Hammasi shu!** 🎉

---

## 🔌 API Endpointlar

| Method | URL | Tavsif |
|--------|-----|--------|
| POST | `/api/auth/telegram/` | Telegram auth |
| GET/PATCH | `/api/auth/me/` | Profil |
| GET/POST | `/api/debts/` | Qarzlar ro'yxati / yaratish |
| GET/PATCH/DELETE | `/api/debts/{id}/` | Qarz detail |
| POST | `/api/debts/{id}/pay/` | To'lov qilish |
| GET | `/api/debts/{id}/payments/` | To'lov tarixi |
| GET/POST | `/api/contacts/` | Kontaktlar |
| GET | `/api/stats/` | Statistika |
| GET | `/api/stats/export/` | Excel eksport |
| POST | `/webhook/` | Telegram webhook |

---

## 🤖 Telegram WebApp ulash

BotFather da:
```
/setmenubutton
→ Bot tanlang
→ URL: https://yourdomain.com
→ Text: 📒 Qarz daftar
```

Webhook o'rnatish:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://yourdomain.com/webhook/"}'
```

---

## 🛠 Foydali buyruqlar

```bash
# Loglar ko'rish
docker compose logs -f backend
docker compose logs -f frontend

# Django shell
docker compose exec backend python manage.py shell

# Database backup
docker compose exec db pg_dump -U qarz_user qarz_daftar > backup.sql

# Qayta deploy (yangi kod)
git pull
docker compose build backend frontend
docker compose up -d
docker compose exec backend python manage.py migrate
```

---

## 🏗 Arxitektura

```
Internet
    │
    ▼
[Nginx :80]
    ├── /api/* ──────────► [Django :8000]
    ├── /admin/* ────────► [Django :8000]
    ├── /webhook/ ───────► [Django :8000]
    ├── /static/ ────────► [Static files]
    └── /* ──────────────► [React :3000]

[Django] ──► [PostgreSQL]
[Django] ──► [Redis]
```

---

## 📝 Litsenziya
MIT
