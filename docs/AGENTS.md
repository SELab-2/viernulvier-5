# AGENTS.md

This file provides general instructions for AI coding agents (such as Claude, GitHub Copilot,
Cursor, etc.) working in this repository, as well as a quick-start reference for human developers.
It describes the project structure, conventions, how to run things, and the design principles
that should guide every contribution.

---

## Project Overview

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend / API | Next.js |
| Database | PostgreSQL via Prisma ORM |
| Web server | Nginx (reverse proxy in production) |
| Test framework | Jest |
| CI/CD | GitHub Actions |
| Package manager | npm |
| Language | TypeScript |
| Node.js version | Latest LTS (use `nvm install --lts` if you use nvm) |

---

## Repository Structure

```
/
├── app/                  # Next.js App Router — pages, layouts, API routes
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── prisma/               # Prisma schema and migrations
│   └── schema.prisma
├── public/               # Static assets served by Next.js
├── tests/                # All tests
│   └── unit/             # Unit tests (*.test.tsx / *.test.ts)
├── .github/
│   ├── workflows/        # GitHub Actions CI/CD pipelines
│   ├── ISSUE_TEMPLATE/
│   ├── CODEOWNERS
│   ├── dependabot.yml
│   └── pull_request_template.md
├── eslint.config.mjs     # ESLint flat config
├── jest.config.mjs       # Jest configuration
├── jest.setup.ts         # Jest global setup (runs before each test file)
├── jest.d.ts             # TypeScript declarations for Jest matchers
├── next.config.ts        # Next.js configuration
├── prisma.config.ts      # Prisma client configuration
├── tsconfig.json         # TypeScript configuration
├── package.json
├── AGENTS.md             # This file
└── BRANCH_PROTECTION_SETUP.md
```

---

## Getting Started

### Prerequisites

- Node.js (latest LTS) — use `nvm install --lts` if you use nvm
- npm (comes with Node.js)
- PostgreSQL 16+ running locally, or access to a shared dev database

### Install dependencies

```bash
npm install
```

### Environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Key variables to set (add to `.env.example` as the project grows):

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `NODE_ENV` | `development`, `test`, or `production` |


### Set up the database

```bash
# Apply migrations and generate the Prisma client
npx prisma migrate dev
```

---

## Running the Project Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Linting

The project uses **ESLint** with a flat config (`eslint.config.mjs`).

```bash
npm run lint
```

Linting is a **required status check** — PRs cannot be merged if linting fails.
Silent output (no errors printed) means lint passed.

### Recommended: auto-fix on save

Configure your editor to run ESLint's `--fix` on save. In VS Code, add this to `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## Running Tests

The project uses **Jest** for unit and integration tests.

```bash
# Run all tests once (suitable for CI)
npm test -- --ci

# Run tests in watch mode (during development)
npm test

# Run with coverage report
npm test -- --coverage
```

### Test structure

All tests live in `tests/`:

```
tests/
└── unit/        # Unit tests — fast, no database, mock external dependencies
```

Integration tests (requiring a real database via Prisma) can be added under
`tests/integration/` when needed.

### Writing tests

- File naming: `*.test.ts` for logic, `*.test.tsx` for components
- Use descriptive `describe` and `it`/`test` blocks so failures are self-explanatory
- Unit tests should not hit the database — mock Prisma using `jest.mock()`
- Aim for each test to cover one behaviour; avoid testing implementation details
- Follow TDD where practical: red → green → refactor

### Test coverage

Coverage is measured on every PR and posted as a comment. It is **not** a hard gate —
a PR will not fail because coverage is low. However, reviewers should encourage adding
tests for any new code that is not covered.

---

## Database (Prisma)

The database schema lives in `prisma/schema.prisma`. After any change to the schema:

```bash
# Create and apply a new migration
npx prisma migrate dev --name describe-your-change

# Regenerate the Prisma client (usually automatic after migrate dev)
npx prisma generate
```

In tests, mock the Prisma client rather than hitting a real database:

```ts
jest.mock('@/lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
  },
}));
```

---

## Code Conventions

### General

- Write code for readability first; optimise only when there is a measured need
- Keep functions small and focused on a single responsibility
- Prefer explicit over implicit — avoid clever tricks that require deep knowledge to understand
- Leave the code better than you found it (Boy Scout Rule)
- Use TDD: red → green → refactor

### Naming

| Thing | Convention | Example |
|---|---|---|
| Variables & functions | camelCase | `getUserById` |
| React components | PascalCase | `UserProfile` |
| Files (components) | PascalCase | `UserProfile.tsx` |
| Files (utilities) | camelCase | `formatDate.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Database tables | snake_case | `user_accounts` |
| Database columns | snake_case | `created_at` |

### TypeScript

- Use TypeScript for all new code
- Avoid `any` — use `unknown` and narrow the type, or define a proper interface
- Export types alongside the code that uses them
- Do not suppress TypeScript errors with `@ts-ignore` without an explanation comment

### Commit messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `ci`

Examples:
```
feat(auth): add JWT refresh token support
fix(api): handle null response from user endpoint
chore(deps): update React to 19.1.0
test(utils): add unit tests for getUserById helper
```

---

## Branching Strategy

- `main` — production-ready code; protected, never commit directly
- `feat/<short-description>` — new features (e.g. `feat/user-auth`)
- `fix/<short-description>` — bug fixes (e.g. `fix/login-redirect`)
- `chore/<short-description>` — maintenance tasks (e.g. `chore/update-deps`)

---

## Pull Request Process

1. Open a PR using the provided template (`.github/pull_request_template.md`)
2. 2 random reviewers are assigned automatically
3. All CI checks (lint + tests) must pass
4. At least 2 approvals are required
5. All review conversations must be resolved
6. Merge using **Squash and merge** to keep `main` history clean

---

## Issue Process

Choose the appropriate issue template when opening a new issue:

| Template | Use when |
|---|---|
| **Bug Report** | Something is broken or behaving unexpectedly |
| **Feature Request** | Proposing new functionality or an improvement |
| **Performance Issue** | Something works but is too slow or resource-heavy |
| **Question** | You need clarification on the codebase, architecture, or process |
| **Task** | Refactoring, chores, documentation, tooling, technical debt, or something that needs to be setup |

Issues are the primary place for discussion — keep relevant conversations in the issue / related pull request
comments so context is preserved.

---

## Dependency Management

Dependabot automatically opens PRs for dependency updates on a weekly schedule (Sunday nights at 02:00 CET).
Security vulnerabilities are patched immediately regardless of the schedule.

When reviewing a Dependabot PR:
- Check the changelog / release notes linked in the PR description
- For major version bumps, check for a migration guide before approving
- Minor and patch updates are generally safe to approve quickly
- Do not approve a Dependabot PR if CI is failing on it

---

## Instructions for AI Agents

If you are an AI coding assistant working in this repository, follow these guidelines:

- **Always run lint and tests** before declaring a task complete:
  ```bash
  npm run lint
  npm test -- --ci
  ```
- **Follow the conventions** in this file — naming, commit format, file organisation.
- **Do not modify** `.github/workflows/`, `CODEOWNERS`, or `dependabot.yml` unless the task explicitly involves CI/CD changes.
- **Write tests** for any new logic you introduce. Prefer unit tests; use integration tests for database interactions. Unit tests go in `tests/unit/`. Mock Prisma — do not rely on a real database in unit tests.
- **After any Prisma schema change**, run `npx prisma migrate dev` and `npx prisma generate` and include the migration file in the same commit.
- **Keep PRs focused** — one problem, one PR. Do not bundle unrelated changes.
- **Check the issue** linked to the task for acceptance criteria before writing code. The criteria define what "done" means.
- **Ask before assuming** — if requirements are ambiguous, surface the ambiguity rather than picking an arbitrary interpretation.
