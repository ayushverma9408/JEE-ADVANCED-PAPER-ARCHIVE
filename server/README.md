# JEE Archive API

The backend workspace for the JEE Advanced Paper Archive. It provides the Express server, validated environment configuration, health endpoints, cookie-based authentication, and the PostgreSQL/Prisma data model.

## Requirements

- Node.js 22+
- PostgreSQL 14+

## Setup

From the repository root:

```bash
npm install
cp server/.env.example server/.env
```

Set `DATABASE_URL` in `server/.env` to your PostgreSQL connection string. Generate Prisma Client and create the tables:

```bash
npm run db:generate
npm run db:migrate
```

Start the API:

```bash
npm run dev:server
```

The API runs at `http://localhost:4000` by default.

## API endpoints

### Health

- `GET /api/health` — confirms that the API process is running.
- `GET /api/health/database` — checks the PostgreSQL connection.

### Authentication

- `POST /api/auth/register` — create an account using `{ "name", "email", "password" }`.
- `POST /api/auth/login` — sign in using `{ "email", "password" }`.
- `POST /api/auth/logout` — revoke the current session.
- `GET /api/auth/me` — return the current signed-in user.

Authentication uses bcrypt password hashes and opaque random session tokens. Only a SHA-256 hash of each session token is stored in PostgreSQL. The raw token is sent in an HttpOnly, SameSite=Lax cookie with a seven-day expiry; production cookies are Secure. Authentication endpoints are rate-limited.

## Frontend integration

The React app calls the API through the Vite `/api` development proxy. The account button in the header opens the sign-in/register modal, restores an existing session on page load, and signs out the active session.

## Current scope

Authentication is implemented, but the frontend still needs a running PostgreSQL database and applied Prisma migration before registration/login can succeed. Exam management, answer autosave, scoring, and analytics routes are future milestones.
