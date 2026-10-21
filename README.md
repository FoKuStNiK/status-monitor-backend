# Status Monitor Backend

Серверная часть сайта мониторинга: Node.js, Express, SQLite, Webhook и WebSocket.

**Backend и frontend — два самостоятельных репозитория.** У каждого собственный `Dockerfile` и `docker-compose.yml`. Сборка backend **не читает файлы frontend**, а сборка frontend не читает файлы backend.

[Отдельный репозиторий frontend](https://github.com/FoKuStNiK/status-monitor-frontend).

## Как устроен проект

- `backend` принимает Webhook, сохраняет состояние каждого ID в SQLite и отправляет изменения через WebSocket.
- `web` — отдельный контейнер с React, который обращается к API backend.
- Nginx **не используется**.
- На одном Docker-хосте оба контейнера подключаются к общей сети `status-monitor-net`. Это не требует хранить репозитории рядом.
- Каждый контейнер можно собирать, запускать и останавливать **отдельно**.

## Шаг 1. Установка Docker

Нужен Docker Desktop на Windows/macOS или Docker Engine + Compose на Linux. Проверка:

```bash
docker --version
docker compose version
```

## Шаг 2. Скачивание только backend

```bash
git clone https://github.com/FoKuStNiK/status-monitor-backend.git
cd status-monitor-backend
```

Скачивать frontend для запуска backend **не обязательно**.

## Шаг 3. Создание настроек

Создайте `.env` из `.env.example`.

Git Bash и Linux:

```bash
cp .env.example .env
```

PowerShell — вместо команды выше:

```powershell
Copy-Item .env.example .env
```

Откройте `.env`:

```dotenv
PORT=5000
DB_PATH=./server/data/statuses.db
FRONTEND_ORIGIN=http://localhost:3000
WEBHOOK_TOKEN=your-secret-token
```

**Замените `your-secret-token` на свой длинный случайный секрет.** Не загружайте файл `.env` на GitHub.

- `PORT` — порт Node.js. Для Docker оставьте `5000` в `.env`.
- `DB_PATH` — путь к файлу базы. Для Docker оставьте значение по умолчанию, если не настраивали новый том.
- `FRONTEND_ORIGIN` — допустимые адреса для прямых запросов браузера к backend.
- `WEBHOOK_TOKEN` — токен, проверяемый для входящих Webhook.

## Шаг 4. Создание общей Docker-сети (один раз)

```bash
docker network create status-monitor-net
```

Если сеть уже существует, **повторно создавать её не нужно**. Она нужна для связи контейнеров из двух независимых Compose-проектов **на одном Docker-хосте**.

## Шаг 5. Запуск только backend

Из папки `status-monitor-backend`:

```bash
docker compose up -d --build
docker compose ps
```

Команда запустит **только backend**. Она не запустит и не соберёт frontend.

Проверьте на компьютере, где запущен Docker:

Порт 5000 **не публикуется на хосте**. Проверьте API внутри контейнера:

~~~bash
docker compose exec backend node -e "require('http').get('http://localhost:5000/api/health', r => r.pipe(process.stdout))"
~~~

Ожидаемый ответ: `{"ok":true}`. После запуска frontend API также будет доступно по адресу `http://localhost/api/health` через frontend-прокси. Контейнер frontend в сети `status-monitor-net` обращается к backend по адресу `http://backend:5000`.

## Шаг 6. Отправка тестовых событий

```bash
docker compose exec backend npm run test:webhook
```

Скрипт отправляет 50 событий с ID от 1 до 10, случайными статусами и подробностями.

Чтобы запустить сайт с интерфейсом, перейдите в [README frontend](https://github.com/FoKuStNiK/status-monitor-frontend/blob/main/README.md): там есть отдельная команда `docker compose up -d --build` **в папке frontend**. У backend нет ссылки на папку frontend.

## Управление контейнером

В папке backend:

| Команда | Назначение |
| --- | --- |
| `docker compose ps` | Состояние backend |
| `docker compose logs -f` | Просмотр логов; выйти — Ctrl+C |
| `docker compose down` | Остановить и удалить контейнер backend |
| `docker compose up -d --build` | Собрать и запустить backend |

Чтобы обновить код, выполните `git pull origin main` и `docker compose up -d --build`. Frontend при этом не пересобирается.

## База SQLite и сохранность данных

По умолчанию база находится в `server/data/statuses.db`. Compose подключает `./server/data` с хоста к `/app/server/data` контейнера. При пересоздании контейнера база остаётся на хосте.

Изменение `DB_PATH` **не переносит** существующую базу автоматически. Сделайте резервную копию до любых изменений путей и томов.

## Webhook и API

| Адрес | Для чего |
| --- | --- |
| `GET /api/health` | Проверка работы |
| `GET /api/statuses` | Текущие состояния |
| `GET /api/statuses?id=15` | Фильтр по ID |
| `GET /api/statuses?status=worked` | Фильтр по статусу |
| `POST /api/webhook` | Принять событие |
| `/ws` | WebSocket для мгновенных обновлений |

Входящий Webhook передаёт заголовки:

```text
Authorization: Bearer ВАШ_СЕКРЕТНЫЙ_ТОКЕН
Content-Type: application/json
```

Тело запроса (пример):

```json
{
  "id": 15,
  "status": "worked",
  "timestamp": "2026-10-21T09:30:00.000Z",
  "details": "Тестовое событие"
}
```

Статусы: `started`, `not connected`, `connected`, `worked`, `finished`, `error`.

Для каждого ID хранится только последнее состояние. Событие с более старым временем не перезапишет новое; пустое `details` не стирает ранее сохранённые подробности.

## Запуск без Docker

Нужен Node.js 20+:

```bash
npm install
npm start
```

Выполняйте в папке backend после настройки `.env`. Backend работает на http://localhost:5000. Для frontend без Docker используйте `npm start` в его собственной папке.

## Если что-то не работает

| Симптом | Что проверить |
| --- | --- |
| Ошибка `network status-monitor-net not found` | Один раз выполните `docker network create status-monitor-net` |
| Ошибка про `.env` | Создан ли файл из `.env.example`? |
| `localhost:5000` не отвечает на VPS | Это ожидаемо: порт не опубликован на хосте. Используйте проверку через `docker compose exec` или frontend-прокси. |
| HTTP 401 при Webhook | Совпадает ли Bearer-токен с `WEBHOOK_TOKEN`? |
| Frontend не получает статусы | Запущен ли backend, оба ли контейнера подключены к общей сети? |
| База пустая после смены `DB_PATH` | Старые данные автоматически не переносятся |

Для публикации через интернет необходимы HTTPS, безопасный доступ к Webhook и резервные копии. Общая Docker-сеть существует только на одном хосте; для разных серверов понадобится отдельная сетевая настройка.
