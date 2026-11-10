# JEE Archive API

The backend workspace for the JEE Advanced Paper Archive. It currently provides the Express server foundation, environment validation, health endpoints, and the initial PostgreSQL/Prisma data model.

## Requirements

- Node.js 22+
- PostgreSQL 14+

## Setup

From the repository root:

```bash
npm install
cp server/.env.example server/.env
```

Update `DATABASE_URL` in `server/.env` with your PostgreSQL connection string, then generate the Prisma client and create the database tables:

```bash
npm run db:generate
npm run db:migrate
```

Start the API:

```bash
npm run dev:server
```

The API runs on `http://localhost:4000` by default.

## Health endpoints

- `GET /api/health` — confirms that the API process is running.
- `GET /api/health/database` — checks the PostgreSQL connection.

## Current scope

Authentication, exam CRUD, answer autosave, scoring, and analytics routes are intentionally not exposed yet. They will be added in separate, testable milestones.
