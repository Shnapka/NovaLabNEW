# Выкладка NovaLab на Railway

Сайт: **https://web-production-4125d.up.railway.app**
Проект Railway: `novalab` (сервисы `web` — сайт, `Postgres` — база).

## Как устроено

- `npm run build` → `prisma generate && next build`
- `npm run start` → `prisma migrate deploy && prisma db seed && next start`
  — при каждом запуске применяются новые миграции и обновляется библиотека уроков (сид безопасно запускать повторно,
  уроки учителей и результаты учеников он не трогает).
- Unity WebGL-билды лежат в `public/modules/<id модуля>/` и загружаются вместе с сайтом.
- Настройки сборки и запуска — `railway.json` (Railway поддерживает этот формат до 01.12.2026, потом —
  `railway config migrate`).

Переменные сервиса `web`:

| Переменная | Значение |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` — ссылка на базу Railway |
| `AUTH_SECRET` | случайная строка (сгенерирована при настройке, хранится только в Railway) |
| `AUTH_TRUST_HOST` | `true` |

## Обновить сайт

Из папки `physlab` (Railway CLI уже привязан к проекту):

```bash
npx @railway/cli up --service web --ci
```

Новый Unity-билд: `npm run unity:import -- "<папка билда>" <id модуля>`, затем команда выше.

## Полезное

```bash
npx @railway/cli logs --service web
```
```bash
npx @railway/cli open
```
