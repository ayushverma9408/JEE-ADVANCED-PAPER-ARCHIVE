# JEE Advanced Paper Archive

A full-stack JEE Advanced archive and exam-practice platform. The existing frontend provides a responsive library of official previous-year paper PDFs (2007–2025). A separate API and PostgreSQL data model are being added to support accounts, interactive exams, saved attempts, scoring, and performance analytics.

## Current features

### Archive frontend

- Browse 19 years of JEE Advanced papers (2007–2025)
- Separate Paper 1 and Paper 2 entries for each year
- Filter by Physics, Chemistry, and Mathematics
- Search papers by year and paper number
- Embedded PDF reader with English/Hindi language switching where available
- Previous/Next paper navigation, zoom controls, and page navigation
- Locally save and restore each paper's selected page and zoom
- Responsive dark academic interface

### Full-stack foundation

- React + TypeScript + Vite frontend
- Node.js + Express + TypeScript API in the `server/` workspace
- PostgreSQL database schema managed with Prisma
- Initial models for users, exams, questions, exam attempts, and saved answers
- API health and database health endpoints
- Registration/login UI with session restoration and sign-out
- Bcrypt password hashing and opaque, hashed database sessions
- HttpOnly, SameSite cookie sessions with seven-day expiry
- Rate-limited authentication endpoints
- Vite development proxy for `/api` requests
- CI builds the frontend and backend separately

> Account registration, sign-in, sign-out, and session restoration are implemented in the API and connected to the frontend. PostgreSQL must be configured and migrated locally before account creation can be used. Exam management, answer autosave, scoring, and analytics are not implemented yet.

## Technology

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |

## Run locally

Requirements: Node.js 22+ and PostgreSQL 14+.

Install all workspace dependencies from the repository root:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Configure the backend:

```bash
cp server/.env.example server/.env
```

Set `DATABASE_URL` in `server/.env` to your PostgreSQL connection string. Then generate the Prisma client and create the database tables:

```bash
npm run db:generate
npm run db:migrate
```

Start the API in a second terminal:

```bash
npm run dev:server
```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:4000`. During local development, Vite proxies `/api` requests to the backend.

## API health checks

- `GET /api/health` — confirms that the API process is running.
- `GET /api/health/database` — checks the PostgreSQL connection.

## Project structure

```text
.
├── .github/workflows/build.yml
├── server/
│   ├── prisma/schema.prisma
│   ├── src/index.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── data/papers.ts
│   ├── types/paper.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── package.json
└── vite.config.ts
```

## Roadmap

- [x] Official paper archive and PDF reader
- [x] Saved PDF reading positions
- [x] Backend workspace and API foundation
- [x] Initial PostgreSQL/Prisma data model
- [x] User registration, login, and session handling
- [ ] Admin question and exam management
- [ ] Interactive MCQ, MSQ, and numerical exam engine
- [ ] Timed attempts, answer autosave, and submission
- [ ] JEE-style marking and result evaluation
- [ ] Attempt history and performance analytics
- [ ] Production deployment for frontend, API, and database

## Official paper sources

- Official archive: https://jeeadv.ac.in/archive.html
- Official question-paper PDFs: https://jeeadv.ac.in/past_qps

The PDFs are loaded from the official website; this repository does not bundle the question-paper files.
