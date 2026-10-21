# Status Monitor Backend

Backend для системы мониторинга состояний.

Стек:

- Node.js
- Express
- SQLite (`better-sqlite3`)
- WebSocket (`ws`)

## Docker Compose — сайт без Nginx (ветка `docker`)

Репозитории должны лежать рядом:

```text
status-monitor/
├── status-monitor-backend/
│   ├── Dockerfile
│   └── docker-compose.yml
└── status-monitor-frontend/
    └── src/
```

Dockerfile backend имеет два этапа: сначала собирает React из соседнего репозитория,
затем устанавливает backend и копирует собранный frontend в итоговый образ Node.js.
Express сам раздаёт React, обрабатывает API и WebSocket на **одном порту 5000**.
Nginx и отдельный frontend-контейнер не используются.

### Первый запуск с Docker Compose

Обе папки должны лежать рядом. Перейдите из общей папки `status-monitor`:

```bash
cd status-monitor-backend
cp .env.example .env
# Замените WEBHOOK_TOKEN в .env на свой секретный токен.
docker compose build
docker compose up -d
docker compose ps
```

`docker compose build` собирает образ, а `docker compose up -d` создаёт
и запускает контейнер в фоне. Можно заменить две команды одной:

```bash
docker compose up -d --build
```

### Сборка через Dockerfile без Compose

Находясь в **общей папке** `status-monitor`, в которой лежат оба репозитория:

```bash
docker build -f status-monitor-backend/Dockerfile -t status-monitor:latest .
```

`-f` задаёт путь к Dockerfile, `-t` — имя и тег образа,
а последняя точка — **контекст сборки**. Он должен включать обе папки,
поскольку Dockerfile собирает React из `status-monitor-frontend`.
Эта команда только собирает образ и не запускает контейнер.
Для обычного запуска рекомендуется Compose.

### Обновление проекта из GitHub

Обновите ветку `docker` в **обоих** репозиториях, а затем пересоберите образ:

```bash
cd status-monitor-frontend
git fetch origin
git switch docker
git pull
cd ../status-monitor-backend
git fetch origin
git switch docker
git pull
docker compose up -d --build
```

Первые строки предполагают, что вы находитесь в общей папке
`status-monitor`, а локальные ветки `docker` уже созданы.
Если локальной ветки ещё нет, вместо `git switch docker`
выполните `git switch --track origin/docker`.

Открывайте сайт по адресу `http://localhost` (или `http://IP-сервера`).
На хосте опубликован порт 80, который направляется на порт 5000 контейнера.
Для проверки API: `http://localhost/api/health`.

База SQLite хранится на хосте в `server/data` через bind mount.
Для публичной эксплуатации дополнительно настройте HTTPS, защищённый SSH,
брандмауэр и резервное копирование SQLite.

Запуск без Docker по-прежнему возможен: backend запускается отдельно,
а frontend — через `npm start` в соседнем репозитории.

## Запуск backend без Docker

```bash
git clone https://github.com/FoKuStNiK/status-monitor-backend.git
cd status-monitor-backend
npm install
cp .env.example .env
npm start
```

Backend: `http://localhost:5000`; WebSocket: `ws://localhost:5000/ws`.

## Переменные окружения

Пример `.env`:

```env
PORT=5000
DB_PATH=./server/data/statuses.db
FRONTEND_ORIGIN=http://localhost:3000
WEBHOOK_TOKEN=your-secret-token
```

`WEBHOOK_TOKEN` используется для авторизации webhook-запросов.
Webhook должен передавать токен в заголовке:

```text
Authorization: Bearer your-secret-token
```

## Формат webhook

```json
{
  "id": 15,
  "status": "worked",
  "timestamp": "2026-10-14T06:30:00.000Z",
  "details": "Number of containers: 3 Container 0: 001122334455 Container 1: AABBCCDDEEFF Container 2: 1234567890AB Response body (containers 3): A1B2C3D4E5F6 Response CRC: 0xD6A4"
}
```

Допустимые статусы: `started`, `not connected`, `connected`,
`worked`, `finished`, `error`.

Если `details` отсутствует или приходит пустой строкой, ранее сохранённое значение сохраняется.

## Тестовые webhook-запросы

После запуска backend:

```bash
npm run test:webhook
```

Скрипт отправляет 50 тестовых webhook-запросов со случайными статусами и тестовыми данными `details`.
