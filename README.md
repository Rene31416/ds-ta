# Reservations API (NestJS + Prisma + Postgres)

Backend for creating and managing time slot reservations with conflict checks
against existing reservations and Google Calendar events. Auth is handled by
Auth0 JWTs, and Google Calendar is connected per user via OAuth.

## Requirements

- Node.js + pnpm
- Postgres
- Auth0 tenant (API + application)
- Google OAuth client (for Calendar access)

## Environment

Create a `.env` file with the following variables:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ds_ta?schema=public"
AUTH0_DOMAIN="dev-xxxx.us.auth0.com"
AUTH0_AUDIENCE="https://ds-ta-api"
AUTH0_ISSUER_URL="https://dev-xxxx.us.auth0.com/"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3010/auth/google/callback"
ENCRYPTION_KEY="base64-32-bytes"
```

Notes:
- `AUTH0_AUDIENCE` is the Identifier of your Auth0 API.
- `AUTH0_ISSUER_URL` should include a trailing slash.
- `ENCRYPTION_KEY` must be 32 bytes (base64 or hex). Generate with
  `openssl rand -base64 32`.

## Install

```
pnpm install
```

## Prisma (migrations)

This project uses Prisma with Postgres. Apply migrations with:

```
pnpm prisma migrate dev --name init
pnpm prisma generate
```

If you need a clean DB, drop and recreate it before running migrations.

## Run

```
pnpm run start:dev
```

## Docker

### Clone repos (required for Docker compose)

Docker expects the backend and frontend repos to be siblings:

```
git clone https://github.com/Rene31416/ds-ta.git
git clone https://github.com/Rene31416/ds-ta-web-app.git

ls
ds-ta
ds-ta-web-app
```

### Run with Docker compose

From inside `ds-ta`:

```
docker compose up --build
```

Notes:
- Set the required environment variables before running Docker (see below).
- Database data is stored in the `db_data` volume.

### Docker env vars

Export these before `docker compose up --build`:

```
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:3001/auth/google/callback"
ENCRYPTION_KEY="base64-32-bytes"
AUTH0_CLIENT_SECRET="..."
AUTH0_SECRET="hex-64-or-32-bytes"
```

Defaults already wired in `docker-compose.yml`:

```
AUTH0_DOMAIN="dev-7c2ks2xbskvgaaok.us.auth0.com"
AUTH0_AUDIENCE="https://ds-ta-api"
AUTH0_ISSUER_URL="https://dev-7c2ks2xbskvgaaok.us.auth0.com/"
DATABASE_URL="postgresql://postgres:postgres@db:5432/ds_ta?schema=public"
```

Generate secrets:

```
openssl rand -base64 32   # ENCRYPTION_KEY
openssl rand -hex 32      # AUTH0_SECRET
```

### Auth0 configuration

Application (Regular Web App):
- Allowed Callback URLs: `http://localhost:3001/api/auth/callback`
- Allowed Logout URLs: `http://localhost:3001`
- Allowed Web Origins: `http://localhost:3001`

API:
- Identifier (Audience): `https://ds-ta-api`
- Signing Algorithm: `RS256`

### Google OAuth configuration

In Google Cloud Console → OAuth Client:
- Authorized redirect URIs:
  - `http://localhost:3001/auth/google/callback`

## Auth flow

1) Get an Auth0 access token (audience must be `AUTH0_AUDIENCE`).
2) Call `GET /auth/me` with `Authorization: Bearer <token>`.
3) Connect Google Calendar:
   - `GET /auth/google/url`
   - Finish Google OAuth and send `{ code }` to `POST /auth/google` with the
     Auth0 token.
4) Create reservations; Google Calendar conflicts are checked on create/update.

## API

All endpoints below require:

```
Authorization: Bearer <AUTH0_ACCESS_TOKEN>
```

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

Google Calendar conflicts are detected by listing events in the same
time window on the user's primary calendar.
