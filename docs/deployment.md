# Deployment Guide

## Prerequisites

- Node.js 22+
- PostgreSQL 16+
- Nginx

## Local Development

### 1. Start the database

```bash
# make sure you have a network for the containers
docker network create vnv_net

# start the database container
docker compose -f docker-compose-db.yml up -d
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env       # Edit values as needed
npm install
npx prisma migrate dev     # Create tables
npx prisma db seed         # Seed sample data (optional)
npm run dev                # Start Fastify on :3001
```

If you want the scraper to run in Docker, make sure `backend/.env` also contains a valid `API_KEY`.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev                # Start Vite on :5173
```

### 4. Access the app

- Frontend: http://localhost:5173
- API: http://localhost:3001/api/health
- API docs: http://localhost:3001/docs
- Admin: http://localhost:5173/admin/login

## Production Deployment

See nginx/nginx.conf for the production reverse proxy configuration.
Because this might not work, you should already have a nginx server running on port 80 in a container
and only then you can modify the ./nginx/nginx.conf to also use certbot

```bash
# make sure you have a network for the containers
docker network create vnv_net

# start the database container
docker compose -f docker-compose-db.yml up -d

# start certbot, nginx, frontend, backend and the daily scraper cron
docker compose up -d
```

The `scraper` service joins the same external `vnv_net` network as the app stack and database, so `DATABASE_URL` should continue to use `database:5432` as the host. Its cron schedule defaults to `0 0 * * *`, and logs are written inside the container to `/usr/src/app/logs/scraper.log`.
