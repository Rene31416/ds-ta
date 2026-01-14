# Reservations API (NestJS + Prisma + SQLite)

Backend for creating and managing time slot reservations with conflict checks.

## Requirements

- Node.js + pnpm
- SQLite (via better-sqlite3)

## Environment

Set `DATABASE_URL` to your SQLite path, for example:

```
DATABASE_URL="file:./dev.db"
```

## Install

```
pnpm install
```

## Prisma (migrations)

This project uses Prisma with SQLite. Use the commands below to update the DB
after schema changes:

```
pnpm prisma migrate dev --name init-reservations
pnpm prisma generate
```

If you need a clean DB:

```
rm -f dev.db
```

## Run

```
pnpm run start:dev
```

## API

### Create reservation

```
POST /reservations
Content-Type: application/json

{
  "name": "John Doe",
  "startAt": "2026-01-15T10:00:00.000Z",
  "endAt": "2026-01-15T11:00:00.000Z"
}
```

### List reservations

```
GET /reservations
```

### Get reservation

```
GET /reservations/:id
```

### Update reservation

```
PATCH /reservations/:id
Content-Type: application/json

{
  "name": "Jane Doe"
}
```

### Delete reservation

```
DELETE /reservations/:id
```

## Conflict rule

A reservation conflicts when:

```
existing.startAt < newEndAt AND existing.endAt > newStartAt
```
