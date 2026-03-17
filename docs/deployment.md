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

# start certbot, nginx, frontend and backend
docker compose up -d
```
