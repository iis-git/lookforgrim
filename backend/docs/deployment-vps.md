# Деплой backend на VPS (пошагово для новичка)

Этот сценарий рассчитан на пользователя без опыта. Мы запускаем проект через Docker Compose:
- API (NestJS)
- PostgreSQL + PostGIS
- сохранение загруженных файлов (`uploads`) в постоянный том

## 0) Что нужно заранее

1. Аккаунт GitHub, где лежит код.
2. VPS с Ubuntu 22.04/24.04 (например, Hetzner/Timeweb/Selectel).
3. Домен (необязательно на старте, но желательно для HTTPS).

## 1) Подключиться к серверу

На локальном компьютере:

```bash
ssh root@YOUR_SERVER_IP
```

Если у тебя не `root`, используй своего пользователя.

## 2) Установить Docker и Docker Compose

На сервере:

```bash
apt update
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git
systemctl enable docker
systemctl start docker
```

Проверка:

```bash
docker --version
docker compose version
```

## 3) Склонировать проект

```bash
mkdir -p /opt/lookforgrim
cd /opt/lookforgrim
git clone https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO>.git .
cd backend
```

## 4) Создать production env

```bash
cp .env.production.example .env.production
nano .env.production
```

Заполни обязательно:
- `CORS_ORIGIN` — URL фронтенда
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `INIT_ADMIN_SETUP_TOKEN`

Секреты удобно генерировать так:

```bash
openssl rand -hex 32
```

## 5) Запустить проект

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Проверить статус:

```bash
docker compose -f docker-compose.prod.yml ps
```

Проверить логи API:

```bash
docker compose -f docker-compose.prod.yml logs -f api
```

Важно: при старте API автоматически выполняет миграции (`start:prod:migrate`).

## 6) Проверить, что API жив

На сервере:

```bash
curl http://localhost:3000/v1/health
```

Должен прийти JSON со `status: "ok"`.

## 7) Открыть порт на сервере

Если у тебя включен firewall (`ufw`):

```bash
ufw allow 22
ufw allow 3000
ufw enable
ufw status
```

После этого API доступен по `http://SERVER_IP:3000`.

## 8) Первичная инициализация админа

Выполни endpoint `setup-admin` (из твоей документации API), передав токен `INIT_ADMIN_SETUP_TOKEN` из `.env.production`.

## 9) Как обновлять backend после изменений

```bash
cd /opt/lookforgrim/backend
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 10) Резервные копии (очень важно)

Минимум нужно бэкапить:
- базу PostgreSQL (том `pg_data`)
- папку с файлами (`uploads_data`)

Простой SQL-дамп:

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U "$DB_USER" "$DB_NAME" > /opt/lookforgrim/backup_$(date +%F).sql
```

## 11) HTTPS и домен (следующий шаг)

Рекомендуется поставить Nginx как reverse proxy + Let's Encrypt (Certbot), чтобы получить:
- `https://api.your-domain.com`
- корректный SSL
- безопасный доступ к API

Если хочешь, следующим шагом можно добавить готовый `nginx.conf` и команды Certbot под твой домен.
