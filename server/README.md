# JEE Archive API

The backend workspace for the JEE Advanced Paper Archive. It provides the Express API, cookie-based authentication, publisher tools, student exam attempts, scoring, and private performance analytics.

## Requirements

- Node.js 22.x
- PostgreSQL 14+

## Local setup

From the repository root:

```bash
npm install
```

Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` to a PostgreSQL connection string. Keep credentials private.

```bash
npm run db:generate
npm run db:migrate
```

Start the frontend and API in separate terminals:

```bash
npm run dev
npm run dev:server
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:4000`.

## API routes

### Health

- `GET /api/health` — process health.
- `GET /api/health/database` — database connectivity.

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Passwords are hashed with bcrypt. Sessions use random opaque tokens; only SHA-256 token hashes are stored in PostgreSQL. Cookies are HttpOnly, SameSite=Lax, scoped to `/api`, and Secure in production.

### Publisher/admin

- `GET /api/admin/exams`
- `POST /api/admin/exams`
- `PATCH /api/admin/exams/:examId`
- `DELETE /api/admin/exams/:examId`
- `GET /api/admin/exams/:examId/questions`
- `POST /api/admin/exams/:examId/questions`
- `PATCH /api/admin/questions/:questionId`
- `DELETE /api/admin/questions/:questionId`

All publisher routes require an authenticated ADMIN account. New registrations are always USER; there is no public role-promotion endpoint.

### Student exams

- `GET /api/exams` — published exams only.
- `GET /api/exams/:examId` — published exam with answer keys excluded.
- `POST /api/exams/:examId/attempts` — start or resume an attempt.
- `GET /api/exams/attempts/:attemptId` — retrieve the user's attempt.
- `PATCH /api/exams/attempts/:attemptId/answers/:questionId` — autosave an answer or question state.
- `POST /api/exams/attempts/:attemptId/submit` — server-side evaluation and closure.

The server enforces ownership and deadlines. Answer keys are never included in active student exam responses. Expired attempts can be finalized from their saved responses.

### Analytics

- `GET /api/analytics/summary` — the authenticated user's scored attempt history and aggregates.
- `GET /api/analytics/attempts/:attemptId` — question-level review for that user's closed attempt.

## Production

The root `render.yaml` configures the Render API service. Set `DATABASE_URL` to the managed PostgreSQL connection string and `CLIENT_ORIGIN` to the deployed frontend origin. Render's build command generates Prisma Client, builds the API, and applies committed migrations using `prisma migrate deploy`.

The root `vercel.json` proxies `/api/*` to the Render service. If the Render service name or hostname changes, update that destination before deploying the frontend.
