# NovaLab на VPS (PS Cloud, Basic-3: 4 vCPU · 4 ГБ · 80 ГБ)

## Как устроено

```
Интернет ─► Caddy :443 (HTTPS, сжатие) ─┬─► /modules/*          Unity-билды сайта — с диска, готовые .br
                                         ├─► /content/modules/*  билды из пакетов тем — с тома data, .br
                                         └─► всё остальное ──► web :3000 (Next.js standalone) ─► db (PostgreSQL)
```

| Контейнер | Память (лимит) | Что делает |
|---|---|---|
| `db` | 768 МБ | PostgreSQL 16, настроен под малую машину (30 соединений, shared_buffers 192 МБ) |
| `web` | 640 МБ | сайт; Node ограничен `--max-old-space-size=384`, пул Prisma — 5 соединений |
| `caddy` | 128 МБ | HTTPS (Let's Encrypt), отдача тяжёлых файлов без участия Node |
| `migrate` | — | разовый: миграции + обновление программы, затем завершается |

Вместе ~1,5 ГБ в пике — на 4 ГБ остаётся запас на кэш диска и обновления.

Что сделано для экономии памяти и трафика:
- **сборка standalone** — в образе только `server.js` и нужные зависимости, без dev-пакетов;
- **Unity-билды отдаёт Caddy** с диска и в предсжатом Brotli (30 МБ → ~8 МБ на симуляцию), Node их не читает;
- **сжатие страниц** делает Caddy (`NEXT_COMPRESS=0`), сайт не тратит на это процессор;
- **миграции и сид** — отдельный разовый контейнер, сайт стартует сразу и не держит в памяти tsx и Prisma CLI;
- **загрузка пакетов** идёт потоком на диск, архив распаковывается по одному файлу — память не растёт от размера пакета;
- **запросы**: журнал класса берёт только нужные поля модулей, обзор админки — счётчики оценок вместо всех отзывов.

## Первый запуск

На сервере (Ubuntu 22.04/24.04):

```bash
curl -fsSL https://get.docker.com | sh
git clone https://github.com/Shnapka/NovaLabNEW.git novalab && cd novalab
cp .env.production.example .env.production   # заполнить: DOMAIN, POSTGRES_PASSWORD, AUTH_SECRET, ADMIN_*
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

DNS домена (A-запись) должен указывать на IP сервера — Caddy сам получит сертификат.

Безопасность сервера: вход по SSH-ключу, `ufw allow 22,80,443/tcp && ufw enable`, автообновления
(`apt install unattended-upgrades`). Порт базы наружу не открыт.

## Обновление сайта

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Новые **темы** обновления не требуют — их загружают пакетами в `/admin/packages` (см. docs/TOPIC-PACKAGES.md).

## Резервные копии (каждую ночь)

```bash
# /etc/cron.d/novalab-backup
0 3 * * * root cd /root/novalab && docker compose -f docker-compose.prod.yml exec -T db pg_dump -U novalab novalab | gzip > /root/backup/db-$(date +\%F).sql.gz && find /root/backup -name 'db-*' -mtime +14 -delete
```

Том `data` (пакеты тем) копируйте после загрузки новых пакетов:
`docker run --rm -v novalab_data:/d -v /root/backup:/b alpine tar czf /b/data-$(date +%F).tgz -C /d .`

## Полезное

```bash
docker compose -f docker-compose.prod.yml logs -f web     # логи сайта
docker stats                                              # память контейнеров
```
