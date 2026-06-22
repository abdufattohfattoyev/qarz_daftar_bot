#!/bin/bash
# =============================================
# QARZ YORDAMCHI - Deploy script
# Ishlatish: bash deploy.sh
# =============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "🚀 QARZ YORDAMCHI — Deploy boshlandi"
echo "=================================="

# Docker tekshirish
command -v docker >/dev/null 2>&1 || err "Docker o'rnatilmagan!"
command -v docker compose >/dev/null 2>&1 || err "Docker Compose o'rnatilmagan!"

log "Docker topildi"

# .env fayl tekshirish
if [ ! -f ".env" ]; then
  warn ".env fayl topilmadi, namuna yaratilmoqda..."
  cat > .env << 'ENVEOF'
SECRET_KEY=change-this-super-secret-key-in-production-!!!
DEBUG=0
BOT_TOKEN=your_telegram_bot_token_here
WEBAPP_URL=https://yourdomain.com
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com
CORS_ORIGINS=https://yourdomain.com
DB_NAME=qarz_daftar
DB_USER=qarz_user
DB_PASSWORD=qarz_pass_2025
ENVEOF
  warn ".env faylini tahrirlang: nano .env"
  warn "Keyin qayta ishga tushiring: bash deploy.sh"
  exit 0
fi

log ".env fayl topildi"

# Eski containerlarni to'xtatish
log "Eski containerlar to'xtatilmoqda..."
docker compose down --remove-orphans 2>/dev/null || true

# Build
log "Docker image lar build qilinmoqda (bu biroz vaqt oladi)..."
docker compose build --no-cache

# Ishga tushirish
log "Containerlar ishga tushirilmoqda..."
docker compose up -d

# DB tayyor bo'lishini kutish
log "Ma'lumotlar bazasi kutilmoqda..."
sleep 8

# Migratsiya
log "Migratsiyalar bajarilmoqda..."
docker compose exec backend python manage.py migrate --noinput

# Superuser yaratish (ixtiyoriy)
log "Admin user yaratishni xohlaysizmi? (y/N)"
read -r CREATE_ADMIN
if [ "$CREATE_ADMIN" = "y" ] || [ "$CREATE_ADMIN" = "Y" ]; then
  docker compose exec -it backend python manage.py createsuperuser
fi

# Holat tekshirish
log "Containerlar holati:"
docker compose ps

echo ""
echo "=============================="
echo "✅ MUVAFFAQIYATLI DEPLOY!"
echo "=============================="
echo "🌐 Ilova:  http://localhost"
echo "⚙️  Admin:  http://localhost/admin"
echo "📊 API:    http://localhost/api"
echo ""
echo "📋 Foydali buyruqlar:"
echo "  Loglar:      docker compose logs -f"
echo "  To'xtatish:  docker compose down"
echo "  Qayta start: docker compose restart"
echo ""
