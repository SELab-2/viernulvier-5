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
Make sure the backend/.env exists by running the following code:
```bash
cd backend
cp .env.example .env
```
Next startup the development container
```bash
cd ..                        # return from backend/ to project root
docker compose -f docker-compose-dev.yml up -d
# npx prisma db seed         # Seed sample data (optional) this has to be done explicitly in the container
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

# start the database container first
docker compose -f docker-compose-db.yml up -d

# then start the app stack
docker compose up -d --build
```

The Docker app services override `DATABASE_URL` to use the `database` container hostname by default: `postgresql://postgres:postgres@database:5432/viernulvier?schema=public`. If your Docker database uses different credentials or a different database name, set `DOCKER_DATABASE_URL` before running `docker compose up`.

The `scraper` service joins the same external `vnv_net` network as the app stack and database. On container startup it runs one scraper sync immediately, then continues on its cron schedule, which defaults to `0 0 * * *`. Logs are written inside the container to `/usr/src/app/logs/scraper.log`. Set `SCRAPER_RUN_ON_STARTUP=false` if you want to disable the startup run.
