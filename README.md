# VierNulVier - Project 5

This project is a full-stack application for VierNulVier, consisting of a Fastify backend, a React frontend, and an automated scraper.

## Tech Stack

- **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [Fastify](https://fastify.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Testing:** [Vitest](https://vitest.dev/)
- **Infrastructure:** [Docker](https://www.docker.com/) & [Nginx](https://www.nginx.com/)

## Project Structure

- `/backend`: Fastify API, Prisma schemas, and business logic.
- `/frontend`: React SPA with Vite.
- `/nginx`: Configuration for the reverse proxy.
- `/docs`: Extensive documentation on architecture, API, and deployment.

## Getting Started (Development)

### 1. Preparation
Create the required external Docker network:
```bash
docker network create vnv_net
```

Copy the environment files and fill in the necessary variables:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

### 2. Start Database
Use Docker to start the PostgreSQL database:
```bash
docker compose -f docker-compose-db.yml up -d
```

### 3. Backend Setup
```bash
cd backend
npm install
npm run db:migrate   # Run database migrations
npm run db:seed      # (Optional) Add test data
npm run dev          # Start backend in watch mode (http://localhost:3001)
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Start frontend (http://localhost:5173)
```

## Testing

Both environments use **Vitest**.

- **Backend:** `cd backend && npm test`
- **Frontend:** `cd frontend && npm test`

## Database & Scraper

- **Prisma Studio:** Use `npm run db:studio` in the backend folder to manage data visually.
- **Scraper:** The scraper can be run manually via `npm run scraper` in the backend folder.

## Testing

### Frontend
```bash
cd frontend
npm install         # if not already done
npm run test
```

### backend
```bash
cd backend
npm install         # if not already done
npm run test
```

## Documentation

For more in-depth information, refer to the documentation in the `/docs` folder:

- [Architecture Overview](./docs/architecture.md)
- [API Design & Endpoints](./docs/api-design.md)
- [Deployment Instructions](./docs/deployment.md)
- [Branch Protection Setup](./docs/BRANCH_PROTECTION_SETUP.md)

---
*This project was developed for VierNulVier.*
