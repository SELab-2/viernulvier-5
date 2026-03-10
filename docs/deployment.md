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
cp ./backend/.env.example ./backend/.env        # Edit values as needed

# build and start the backend container
docker compose -f docker-compose-app.yml up -d --build

# migrate prisma in docker
docker exec vnv_backend npx prisma migrate dev

# seed database
docker exec vnv_backend npx prisma db seed      # (optional)

# run backend
docker exec vnv_backend npm run dev             # now Fastify should be running on port :3001
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev                # Start Vite on :5173
```


### 4. Nginx
```bash
docker compose -f docker-compose.yml
```

### 5. Access the app

- Frontend: http://localhost:5173
- API: http://localhost:3001/api/health
- API docs: http://localhost:3001/docs
- Admin: http://localhost:5173/admin/login

## Production Deployment

See nginx/nginx.conf for the production reverse proxy configuration.

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build

# Start backend
cd backend && npm run start

# Copy frontend/dist to /var/www/viernulvier/frontend/dist
# Configure Nginx with nginx/nginx.conf
```
