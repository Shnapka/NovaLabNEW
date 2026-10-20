# NovaLab на VPS (PS Cloud, Basic-3: 4 vCPU · 4 ГБ · 80 ГБ)

## Как устроено

```
Интернет ─► Caddy :443 (HTTPS, сжатие) ─┬─► /modules/*          Unity-билды сайта — с диска, готовые .br
                                         ├─► /content/modules/*  билды из пакетов тем — с тома data, .br
                                         └─► всё остальное ──► web :3000 (Next.js standalone) ─► db (PostgreSQL)
                                                                   └─► SMTP почтового сервиса (коды восстановления пароля)
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
- **почта** — соединение с SMTP открывается только на время отправки письма, постоянного пула нет;
- **запросы**: журнал класса берёт только нужные поля модулей, обзор админки — счётчики оценок вместо всех отзывов.

## Первый запуск

### 1. Сервер

Ubuntu 22.04/24.04, вход по SSH-ключу.

```bash
apt update && apt install -y unattended-upgrades ufw git
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw enable
curl -fsSL https://get.docker.com | sh
```

### 2. Домен

В DNS домена — A-запись на IP сервера (например, `novalab.kz → 1.2.3.4`). Caddy сам получит HTTPS-сертификат,
когда запись заработает.

### 3. Почта для восстановления пароля

Нужен почтовый ящик-отправитель, например `no-reply@novalab.kz`, у любого почтового сервиса с SMTP:
- почта для домена (Mail.ru для бизнеса, Яндекс 360, почта хостинга PS) — письма реже попадают в спам;
- для начала подойдёт и обычный ящик Gmail/Mail.ru с «паролем приложения».

У почтового сервиса узнайте SMTP-сервер, порт (465 или 587), логин и пароль (пароль приложения, если включена
двухэтапная проверка). Для почты на своём домене добавьте в DNS записи, которые даст сервис: **SPF**, **DKIM**
и, желательно, **DMARC** — без них письма с кодом часто уходят в спам.

Проверьте, что хостинг выпускает исходящий SMTP (некоторые VPS закрывают его по умолчанию):

```bash
timeout 5 bash -c '</dev/tcp/smtp.mail.ru/465' && echo "порт 465 открыт"
```

Если порт закрыт — попросите поддержку PS открыть исходящие 465/587 или используйте порт 587.

### 4. Код и настройки

```bash
git clone https://github.com/Shnapka/NovaLabNEW.git /root/novalab && cd /root/novalab
cp .env.production.example .env.production
nano .env.production
```

Заполнить:

| Переменная | Что указать |
|---|---|
| `DOMAIN` | домен сайта |
| `POSTGRES_PASSWORD` | длинный случайный пароль базы: `openssl rand -base64 24` |
| `AUTH_SECRET` | секрет сессий: `openssl rand -base64 32` (им же подписываются коды из писем) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | данные почтового ящика из шага 3 |
| `MAIL_FROM` | отправитель, например `NovaLab <no-reply@novalab.kz>` (адрес — тот же ящик) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | вход в панель `/admin` (пароль от 10 символов) |
| `SEED` | `1` — при каждом запуске обновлять программу учебника |

```bash
chmod 600 .env.production
```

### 5. Запуск

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml ps        # db, web, caddy — running; migrate — exited (0)
```

### 6. Проверка

- `https://<домен>` открывается, замок HTTPS на месте;
- вход в `/admin/login` — данные из `ADMIN_EMAIL` / `ADMIN_PASSWORD`;
- `/forgot` → своя почта учителя → письмо с кодом приходит за минуту (проверьте «Спам»).
  Если нет — `docker compose -f docker-compose.prod.yml logs web | grep -i "код восстановления"` покажет ошибку SMTP.

## Обновление сайта

```bash
cd /root/novalab
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Миграции базы применяются автоматически (контейнер `migrate`) до старта сайта.

Если сервер был запущен до появления восстановления пароля: допишите в `.env.production` переменные `SMTP_*`
и `MAIL_FROM` (образец — `.env.production.example`) и выполните команду выше.

Новые **темы** обновления не требуют — их загружают и удаляют пакетами в `/admin/packages`
(см. docs/TOPIC-PACKAGES.md).

## Резервные копии (каждую ночь)

```bash
mkdir -p /root/backup
cat > /etc/cron.d/novalab-backup <<'EOF'
0 3 * * * root cd /root/novalab && docker compose -f docker-compose.prod.yml exec -T db pg_dump -U novalab novalab | gzip > /root/backup/db-$(date +\%F).sql.gz && find /root/backup -name 'db-*' -mtime +14 -delete
EOF
```

Том `data` (пакеты тем) копируйте после загрузки новых пакетов:
`docker run --rm -v novalab_data:/d -v /root/backup:/b alpine tar czf /b/data-$(date +%F).tgz -C /d .`

Копии лучше раз в неделю забирать с сервера к себе (`scp root@<сервер>:/root/backup/* .`).

## Полезное

```bash
docker compose -f docker-compose.prod.yml logs -f web     # логи сайта
docker stats                                              # память контейнеров
```
