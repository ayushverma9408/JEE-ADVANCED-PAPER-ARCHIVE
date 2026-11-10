# JEE Advanced Paper Archive

A full-stack JEE Advanced archive and exam-practice platform. The frontend provides official previous-year paper PDFs (2007–2025), while the API and PostgreSQL database support accounts, published practice exams, saved attempts, scoring, and performance analytics.

## Features

- Browse 19 years of JEE Advanced papers (2007–2025), with Paper 1 and Paper 2 entries.
- Filter by Physics, Chemistry, and Mathematics; search by year and paper.
- Embedded PDF reader with language switching where available, zoom, page navigation, and saved reading position.
- Registration, login, session restoration, and sign-out using bcrypt password hashes and opaque HttpOnly sessions.
- Role-based access control with protected publisher/admin APIs and dashboard.
- Create exams, manage questions, and publish papers.
- Student exam engine for single-correct, multiple-correct, and numerical questions.
- Server-authoritative exam deadlines, answer autosave, resume, question palette, and mark-for-review.
- Server-side scoring with configured positive and negative marks; answer keys are not returned during active attempts.
- Private attempt history, question-level result review, subject performance, and topic revision priorities.
- PostgreSQL schema and versioned Prisma SQL migrations.

## Technology

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Frontend hosting | Vercel |
| API hosting | Render |
| Database hosting | Neon (or any managed PostgreSQL provider) |

## Run locally

Requirements: Node.js 22+ and PostgreSQL 14+.

```bash
npm install
```

Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` to your PostgreSQL connection string. Keep this file private; never commit credentials.

```bash
npm run db:generate
npm run db:migrate
```

Run the frontend and API in separate terminals:

```bash
npm run dev
npm run dev:server
```

Frontend: `http://localhost:5173`  
API: `http://localhost:4000`

## Production deployment

The deployment configuration in this repository uses Vercel for the Vite frontend, Render for the Express API, and Neon for managed PostgreSQL. The Vercel rewrite sends `/api/*` requests through the frontend's own domain to the Render service. This keeps browser requests same-origin, including the HttpOnly session cookie.

### 1. Create the production database

1. Create a PostgreSQL project in Neon.
2. Copy the **direct (non-pooled) connection string** for the production database.
3. Keep the connection string private. Do not paste it into GitHub, source files, or chat.

### 2. Deploy the API on Render

1. In Render, choose **New → Blueprint** and connect this GitHub repository.
2. Render reads `render.yaml` and creates the `jee-archive-api` web service.
3. In the service's Environment settings, set:
   - `DATABASE_URL`: the Neon PostgreSQL connection string.
   - `CLIENT_ORIGIN`: the exact production Vercel URL, for example `https://your-project.vercel.app`.
4. Deploy. The build command generates Prisma Client, builds the API, and applies committed migrations using `prisma migrate deploy`.
5. Check `https://jee-archive-api.onrender.com/api/health`. It should return JSON with `"status":"ok"`.

The free Render web service may sleep when idle; the first request after inactivity can take longer.

### 3. Deploy the frontend on Vercel

1. In Vercel, import this repository.
2. Use the Vite defaults: build command `npm run build`, output directory `dist`, install command `npm install`.
3. Deploy the project.
4. The committed `vercel.json` proxies `/api/*` to `https://jee-archive-api.onrender.com/api/*`.

If you choose a different Render service name or custom API domain, update the destination in `vercel.json` and redeploy the frontend. If Vercel assigns a different production domain, update Render's `CLIENT_ORIGIN` to match it exactly.

### 4. Verify production

After both services are deployed:

- Open `https://your-project.vercel.app/api/health`; it should return the API health response.
- Open `https://your-project.vercel.app/api/health/database`; it should report `"database":"connected"`.
- Register a test student account and verify login, logout, and session restoration.
- Verify the student can see published papers, complete a short test, and review the result.
- Verify a normal student cannot access `/api/admin/*`.
- Sign in with the publisher account and verify the Admin Dashboard and publishing flow.

The Vercel rewrite is important: use the Vercel domain for the app, not the Render API domain directly in the browser. Session cookies are HttpOnly and Secure in production.

### 5. Publisher account on a fresh production database

A newly created Neon database starts empty. Register the publisher account through the deployed app first. If that production account is not already marked as `ADMIN`, update its role through Neon SQL Editor using the exact registered email:

```sql
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "email" = 'your-registered-email@example.com';
```

Then sign out and sign in again so the app reloads the role from the production session. Never add a public role-promotion endpoint.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NODE_ENV` | Production | Set to `production` on Render |
| `PORT` | Render provides it | API listening port |
| `CLIENT_ORIGIN` | Yes on Render | Exact Vercel production origin |
| `DATABASE_URL` | Yes | PostgreSQL connection string |

## API health checks

- `GET /api/health` — API process health.
- `GET /api/health/database` — database connectivity.
- `GET /api/analytics/summary` — signed-in user's attempt history and aggregate performance.
- `GET /api/analytics/attempts/:attemptId` — question-level review for that user's closed attempt.

## Project structure

```text
.
├── .github/workflows/build.yml
├── render.yaml
├── vercel.json
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── src/
│       ├── admin-routes.ts
│       ├── analytics-routes.ts
│       ├── auth-routes.ts
│       ├── auth.ts
│       ├── exam-routes.ts
│       ├── middleware.ts
│       └── index.ts
├── src/
│   ├── components/
│   ├── data/papers.ts
│   ├── lib/auth.ts
│   ├── App.tsx
│   └── index.css
├── package.json
└── vite.config.ts
```

## Roadmap

- [x] Official paper archive and PDF reader
- [x] Backend workspace and API foundation
- [x] PostgreSQL/Prisma data model and migrations
- [x] Registration, login, and session handling
- [x] Role-based authorization and protected admin APIs
- [x] Admin dashboard and question management
- [x] Student exam engine, autosave, and resume
- [x] JEE-style evaluation and result review
- [x] Attempt history and performance analytics
- [x] Vercel, Render, and managed PostgreSQL deployment configuration
- [ ] Live production deployment and end-to-end verification

## Official paper sources

- Official archive: https://jeeadv.ac.in/archive.html
- Official question-paper PDFs: https://jeeadv.ac.in/past_qps

The PDFs are loaded from the official website; this repository does not bundle the question-paper files.
