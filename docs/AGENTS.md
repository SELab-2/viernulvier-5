# AGENTS.md

This file provides general instructions for AI coding agents (such as Claude, GitHub Copilot,
Cursor, etc.) working in this repository, plus a practical quick start for human developers.
It documents the current monorepo layout, conventions, and workflows.

---

## Project Overview

| Layer | Technology |
|---|---|
| Frontend | React + Vite + React Router |
| Backend / API | Fastify + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Reverse proxy (prod) | Nginx |
| Test framework | Vitest |
| CI/CD | GitHub Actions |
| Package manager | npm |
| Language | TypeScript |
| Node.js version | 22.x |

---

## Repository Structure

```text
/
├── backend/                    # Fastify API
│   ├── prisma/
│   │   ├── schema.prisma       # Source of truth Prisma schema
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── modules/            # Feature modules (auth, archive, ...)
│   │   ├── plugins/            # Fastify plugins (cors, auth, prisma, ...)
│   │   └── generated/prisma/   # Generated Prisma client code
│   ├── test/                   # Backend tests
│   ├── package.json
│   └── prisma.config.ts
├── frontend/                   # React SPA (public + admin)
│   ├── src/
│   │   ├── pages/
│   │   ├── api/
│   │   ├── i18n/               # i18n scaffold (nl/en)
│   │   └── styles/
│   └── package.json
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── coverage.yml
│   │   └── assign-reviewers.yml
│   ├── ISSUE_TEMPLATE/
│   ├── CODEOWNERS
│   ├── dependabot.yml
│   └── pull_request_template.md
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── AGENTS.md
│   └── BRANCH_PROTECTION_SETUP.md
├── docker-compose.yml          # Local Postgres
└── nginx/
```

Important: do not reintroduce a root-level `prisma/schema.prisma`. Prisma schema ownership is in `backend/prisma/schema.prisma`.

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- Docker (for local Postgres via `docker compose`)

### Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Environment variables

```bash
cd backend
cp .env.example .env
```

Common backend env vars:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `PORT` | API server port (default: `3001`) |
| `HOST` | API host binding |
| `JWT_SECRET` | JWT signing secret |
| `NODE_ENV` | `development`, `test`, `production` |

### Start local database

```bash
docker compose up -d
```

### Prepare database

```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run db:seed
```

---

## Running Locally

Run both apps in separate terminals.

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173` (or `http://127.0.0.1:5173`)
- Admin login: `http://localhost:5173/admin/login` and `http://127.0.0.1:5173/admin/login`
- Backend health: `http://localhost:3001/api/health`
- Swagger docs: `http://localhost:3001/docs`

---

## Linting

Backend:

```bash
cd backend
npm run lint
```

Frontend:

```bash
cd frontend
npm run lint
```

CI enforces strict lint with `--max-warnings=0`. If a temporary scaffold placeholder must stay,
use a targeted inline eslint disable with a clear reason.

---

## Testing

The project uses Vitest in both apps.

Backend:

```bash
cd backend
npm test
npm run test:watch
npm run test:coverage
```

Frontend:

```bash
cd frontend
npm test
npm run test:watch
npm run test:coverage
```

### Testing rules

- Unit tests should mock external dependencies (including Prisma when possible).
- Integration tests that require DB access should be explicit and isolated.
- Keep tests near the domain they validate (`backend/test`, `frontend/src/**/*.test.tsx`).

Coverage is posted on PRs via `.github/workflows/coverage.yml` and is informational.

---

## Database and Prisma

Prisma schema source of truth:

- `backend/prisma/schema.prisma`

After schema changes:

```bash
cd backend
npx prisma migrate dev --name <describe_change>
npx prisma generate
```

Also update:

- `backend/prisma/migrations/*` (if migration is created)
- `backend/src/generated/prisma/*` (generated client output)

---

## CI and Workflows

- Main CI: `.github/workflows/ci.yml`
  - Backend: lint, build, test
  - Frontend: lint, test, build
- Coverage CI: `.github/workflows/coverage.yml`
  - Backend and frontend Vitest coverage
  - Coverage comments posted to PR
- Runners: self-hosted

Do not change CI workflows unless the task explicitly includes CI changes.

---

## Code Conventions

### General

- Prioritize readability and explicitness.
- Keep functions/modules focused and cohesive.
- Keep PRs scoped to one concern.

### Naming

| Thing | Convention | Example |
|---|---|---|
| Variables/functions | camelCase | `getUserById` |
| Components/classes | PascalCase | `LoginPage`, `AuthService` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| DB tables/columns | snake_case | `created_at` |

### TypeScript

- Prefer concrete types over `any`.
- If `any` is temporarily required in scaffold code, document why inline.
- Avoid `@ts-ignore` unless there is a strong, documented reason.

### Commits

Use Conventional Commits:

```text
<type>(<scope>): <short description>
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `ci`

---

## Branching and PR Process

- `main` is protected. Do not push directly.
- Use topic branches (`feat/...`, `fix/...`, `chore/...`).
- Open PR using `.github/pull_request_template.md`.
- Resolve all review threads and required checks before merge.

---

## Instructions for AI Agents

If you are an AI coding assistant in this repository:

- Run relevant checks before claiming task completion:

```bash
cd backend && npm run lint && npm test
cd frontend && npm run lint && npm test
```

- Respect monorepo boundaries:
  - Backend changes belong in `backend/`
  - Frontend changes belong in `frontend/`
- Do not assume root-level scripts exist.
- Do not add back Next.js/Jest-era root scaffolding unless explicitly requested.
- For schema changes, run Prisma commands in `backend/` and keep generated output in sync.
- Keep changes focused and aligned with the issue/PR acceptance criteria.
