# Status Monitor Backend

Backend для системы мониторинга состояний.

Стек:

- Node.js
- Express
- SQLite (`better-sqlite3`)
- WebSocket (`ws`)

## Установка и запуск

```bash
git clone https://github.com/FoKuStNiK/status-monitor-backend.git
cd status-monitor-backend

npm install
cp .env.example .env
npm start
```

Backend:

```text
http://localhost:5000
```

WebSocket:

```text
ws://localhost:5000/ws
```

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

Допустимые статусы:

```text
started
not connected
connected
worked
finished
error
```

`details` является необязательным полем. Если оно отсутствует или приходит пустой строкой, ранее сохранённое значение сохраняется.

## Тестовые webhook-запросы

После запуска backend:

```bash
npm run test:webhook
```

Скрипт отправляет 50 тестовых webhook-запросов со случайными статусами и тестовыми данными `details`.