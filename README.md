# Status Monitor Backend

Node.js + Express + SQLite (`better-sqlite3`) + WebSocket (`ws`).

## Запуск

```bash
npm install
npm start
```

Backend: `http://localhost:5000`  
WebSocket: `ws://localhost:5000/ws`

Локальный `.env` для обычного запуска не обязателен. Значения по умолчанию уже заданы в коде. Если потребуется изменить порт, путь к БД или разрешённый адрес frontend, можно создать `.env` по шаблону `.env.example`.

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
