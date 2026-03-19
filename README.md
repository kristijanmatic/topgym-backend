# TopGym Backend (BFF)

Express + TypeScript backend that sits between the mobile apps / CMS and PocketBase, with JWT auth for all requests and a privileged `open door` action via Nuki.

## Requirements
- Node.js 20+
- A running PocketBase instance
- Twilio Verify service (for SMS OTP)
- Nuki Web API token + Smartlock ID

## Setup
1. Copy env

```bash
cp .env.example .env
```

2. Install

```bash
npm install
```

3. Run dev server

```bash
npm run dev
```

Health check: `GET /health`

## Environment variables
See `.env.example`. Key ones:
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`
- `PB_USERS_COLLECTION` (default `users`)
- `PB_RECEPTION_CODES_COLLECTION` (default `reception_codes`)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
- `NUKI_API_TOKEN`, `NUKI_SMARTLOCK_ID`

## Endpoints (minimal)

### Auth
- `POST /auth/login` `{ "email": "...", "password": "..." }` → `{ token, user }`
- `POST /auth/phone/request` `{ "phone": "+123..." }` → `{ ok: true }` (Twilio Verify SMS)
- `POST /auth/phone/verify` `{ "phone": "+123...", "code": "123456" }` → `{ token, user }`
- `POST /auth/reception/verify` `{ "code": "ABCD-1234" }` → `{ token, user }`

### Current user
- `GET /me` (requires `Authorization: Bearer <token>`) → `{ user }`

### Door
- `POST /door/open` (requires admin JWT) `{ "action": "unlock" | "unlatch" }`

## PocketBase assumptions
This backend assumes:
- Users live in the PocketBase collection named by `PB_USERS_COLLECTION` (default `users`)\n  - fields used: `email`, `phone`, `role` (`member` or `admin`)\n  - email/password login uses PocketBase collection auth
- Reception codes live in `PB_RECEPTION_CODES_COLLECTION` (default `reception_codes`)\n  - fields used: `codeHash` (sha256 hex), optional `phone` or optional `user/userId`, optional `expiresAt`, optional `usedAt`\n  - on successful verification, the backend sets `usedAt` to now

## Curl examples

Email/password login:

```bash
curl -sS -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"member@example.com","password":"secret"}'
```

Request SMS OTP:

```bash
curl -sS -X POST http://localhost:3000/auth/phone/request \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+15555550123"}'
```

Verify SMS OTP:

```bash
curl -sS -X POST http://localhost:3000/auth/phone/verify \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+15555550123","code":"123456"}'
```

Call `/me`:

```bash
TOKEN="...jwt..."
curl -sS http://localhost:3000/me -H "Authorization: Bearer $TOKEN"
```

Open door (admin only):

```bash
TOKEN="...admin-jwt..."
curl -sS -X POST http://localhost:3000/door/open \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"action":"unlock"}'
```

