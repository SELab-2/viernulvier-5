# Deployment Guide

## Prerequisites

- Node.js 22+
- PostgreSQL 16+
- Nginx

## Local Development

### 1. Start the database

```bash
docker compose up -d
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
