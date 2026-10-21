# Status Monitor — Backend

Это **серверная часть** сайта мониторинга состояний. Она получает сообщения (Webhook), сохраняет последние статусы в SQLite и сообщает об изменениях браузеру через WebSocket.

Проект состоит из **двух отдельных репозиториев**:
- [Backend](https://github.com/FoKuStNiK/status-monitor-backend) — этот репозиторий: Node.js, Express, SQLite, WebSocket.
- [Frontend](https://github.com/FoKuStNiK/status-monitor-frontend) — React, таблица статусов, фильтры.

## Быстрый запуск всего сайта с Docker (рекомендуемый)

Здесь используется **два контейнера, без Nginx**:
1. `backend` — сервер API и WebSocket на внутреннем порту 5000.
2. `web` — отдельный Node.js-сервер: отдаёт собранный React и передаёт запросы `/api` и `/ws` на backend.

**Dockerfile каждого приложения находится в собственном репозитории.** `docker-compose.yml` хранится в backend и запускает их вместе.

### Шаг 1. Установить Docker

Установите Docker Engine с плагином Docker Compose (Linux) или Docker Desktop (Windows/macOS).
Проверка в терминале:

```bash
docker --version
docker compose version
```

Если команды не найдены, Docker ещё не установлен или не запущен.

### Шаг 2. Скачать оба проекта в соседние папки

```bash
mkdir status-monitor
cd status-monitor
git clone https://github.com/FoKuStNiK/status-monitor-backend.git
git clone https://github.com/FoKuStNiK/status-monitor-frontend.git
```

Должна получиться структура:

```text
status-monitor/
├── status-monitor-backend/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   └── server/
└── status-monitor-frontend/
    ├── Dockerfile
    ├── docker/
    │   ├── server.js
    │   └── package.json
    └── src/
```

Если репозитории уже скачаны, повторно выполнять `git clone` не надо — обновите их через `git pull origin main` в каждой папке.

### Шаг 3. Создать настройки backend

```bash
cd status-monitor-backend
```

В **Git Bash / Linux / macOS**:

```bash
cp .env.example .env
```

В **PowerShell** вместо этого:

```powershell
Copy-Item .env.example .env
```

Откройте созданный `.env` в текстовом редакторе. Образец:

```dotenv
PORT=5000
DB_PATH=./server/data/statuses.db
FRONTEND_ORIGIN=http://localhost:3000
WEBHOOK_TOKEN=your-secret-token
```

**Замените `your-secret-token` длинным случайным секретом.** Это пароль для программ, присылающих события. Не публикуйте файл `.env` в GitHub.

Для Docker оставьте `DB_PATH=./server/data/statuses.db`: в Compose настроено сохранение именно этой папки на компьютере. Порт backend внутри Docker фиксирован на 5000 независимо от настройки `PORT` в `.env`.

### Шаг 4. Собрать и запустить

Находясь в папке `status-monitor-backend`:

```bash
docker compose up -d --build
```

Что означают части команды:
- `docker compose` — работает с несколькими контейнерами по `docker-compose.yml`.
- `up` — создаёт и запускает сервисы.
- `-d` — оставляет их работающими в фоне.
- `--build` — пересобирает образы из Dockerfile.

Проверка:

```bash
docker compose ps
```

Откройте:
- **http://localhost** — сайт, если Docker запущен на вашем компьютере.
- **http://localhost/api/health** — проверка backend, ожидаемый ответ: `{"ok":true}`.
- На удалённом сервере вместо `localhost` используется IP или домен этого сервера, если доступ разрешён.

Браузер обращается только к порту **80**. Отдельно открывать порт 5000 не нужно: Node.js-сервер frontend сам перенаправляет `/api` и `/ws` на внутренний сервис `backend:5000`.

### Шаг 5. Отправить тестовые события

В папке backend, не останавливая контейнеры:

```bash
docker compose exec backend npm run test:webhook
```

Эта команда выполняет тестовый скрипт **внутри backend-контейнера**, где `localhost:5000` доступен. Он отправит 50 тестовых сообщений для ID 1–10. В браузере появятся строки со статусами.

Если просто выполнить `npm run test:webhook` на компьютере при Docker-запуске, скрипт может не работать: он обращается к `localhost:5000`, а внешний порт 5000 в Compose намеренно не публикуется.

### Управление и обновление

```bash
docker compose logs -f
docker compose ps
docker compose down
```

- `logs -f` — смотреть сообщения контейнеров (выход из просмотра: Ctrl+C; контейнеры продолжат работать).
- `ps` — список и состояние сервисов.
- `down` — остановить и удалить контейнеры и сеть, **не удаляя папку `server/data`**.

Для обновления кода получите изменения **в обоих репозиториях**:

```bash
# Из папки status-monitor-backend
git pull origin main
cd ../status-monitor-frontend
git pull origin main
cd ../status-monitor-backend
docker compose up -d --build
```

Изменения в React требуют пересборки образа web; изменения backend — пересборки образа backend.

## Запуск без Docker — для разработки

Нужен [Node.js](https://nodejs.org/) версии **20+** и npm.

**Терминал 1 — backend:**

```bash
cd status-monitor-backend
npm install
# Создайте .env из .env.example по инструкции выше, если ещё не сделали.
npm start
```

Проверка: http://localhost:5000/api/health.

**Терминал 2 — frontend:**

```bash
cd status-monitor-frontend
npm install
# Создайте frontend/.env из .env.example, если его нет.
npm start
```

Откройте http://localhost:3000. Для локальной разработки frontend должен использовать настройки `REACT_APP_API_URL=http://localhost:5000` и `REACT_APP_WS_URL=ws://localhost:5000/ws`.

Остановить любой процесс `npm start` можно нажатием **Ctrl+C** в соответствующем терминале.

## Как устроен обмен событиями

Внешняя программа отправляет HTTP POST на `/api/webhook` с заголовком:

```text
Authorization: Bearer ВАШ_СЕКРЕТНЫЙ_ТОКЕН
Content-Type: application/json
```

Пример тела запроса:

```json
{
  "id": 15,
  "status": "worked",
  "timestamp": "2026-10-21T09:30:00.000Z",
  "details": "Тестовое событие"
}
```

Разрешённые статусы: `started`, `not connected`, `connected`, `worked`, `finished`, `error`.

- `id` — положительное целое число.
- `status` — строго одно из перечисленных значений.
- `timestamp` — строка даты (лучше ISO 8601 с часовым поясом).
- `details` — необязательный текст; пустое значение не стирает прежние подробности.

Для каждого ID хранится **только последнее состояние**. Более старое по времени сообщение не перезапишет более новое.

| Адрес | Назначение |
| --- | --- |
| `GET /api/health` | Проверить, что сервер отвечает |
| `GET /api/statuses` | Список текущих состояний |
| `GET /api/statuses?id=15` | Фильтр по ID |
| `GET /api/statuses?status=worked` | Фильтр по статусу |
| `POST /api/webhook` | Запись события с секретным токеном |
| `/ws` | WebSocket-подключение для новых состояний |

## Файлы backend и хранение SQLite

- `Dockerfile` — собирает **только backend** (Node.js).
- `docker-compose.yml` — объединяет frontend и backend в одну Docker-сеть.
- `.dockerignore` — исключает из образа `.env`, локальные зависимости и файлы SQLite.
- `server/src/server.js` — маршруты API и запуск WebSocket.
- `server/src/db.js` — подключение базы и SQL-миграции.
- `server/src/services/statusService.js` — чтение и сохранение статусов.
- `scripts/sendTestWebhooks.js` — генератор тестовых событий.

База по умолчанию хранится в `server/data/statuses.db`. Compose подключает папку `./server/data` с компьютера в `/app/server/data` внутри backend-контейнера. Поэтому пересоздание контейнера не удаляет базу. **Это не резервная копия**: папку данных нужно регулярно копировать безопасным способом.

## Частые проблемы

| Симптом | Что делать |
| --- | --- |
| `docker compose` не найден | Установите Compose или Docker Desktop |
| Ошибка про отсутствующий `../status-monitor-frontend` | Проверьте, что обе папки лежат рядом |
| Ошибка при чтении `.env` | Создайте файл в корне backend |
| Порт 80 занят | Остановите программу, которая его использует, или поменяйте левую часть `"80:3000"` в Compose |
| Сайт даёт 502 для API | Backend не готов или остановился: `docker compose logs backend` |
| Таблица пустая | Отправьте тестовые события |
| Webhook отвечает 401 | Проверьте Bearer-токен в `.env` |
| База стала пустой | Проверьте `DB_PATH` и путь подключённого тома; смена пути не переносит старую базу |

**Для сервера, доступного через интернет:** приведённый Compose публикует HTTP без шифрования. Перед эксплуатацией нужно настроить HTTPS, firewall и резервное копирование SQLite. Токен Webhook не следует передавать через открытый интернет по HTTP.
