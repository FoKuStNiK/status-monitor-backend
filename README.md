# Status Monitor Backend

Node.js + Express + SQLite (`better-sqlite3`) + WebSocket (`ws`).

## Запуск

```bash
npm install
cp .env.example .env
npm start
```

Backend: `http://localhost:5000`  
WebSocket: `ws://localhost:5000/ws`

## API

- `GET /api/statuses`
- `GET /api/statuses?id=15`
- `GET /api/statuses?status=worked`
- `GET /api/statuses?id=15&status=worked`
- `POST /api/webhook`

Webhook JSON:

```json
{
  "id": 15,
  "status": "worked",
  "timestamp": "2026-09-11T10:35:00Z"
}
```

## Тестовые данные

После запуска backend:

```bash
npm run test:webhook
```

Скрипт отправит 12 тестовых webhook-запросов.
