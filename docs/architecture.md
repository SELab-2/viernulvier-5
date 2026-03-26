# Architecture Documentation

## Overview

The VIERNULVIER archive website follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────┐
│       React SPA (Vite)      │  ← Presentation layer (frontend/)
│  Public views + Admin views │
└─────────────┬───────────────┘
              │ REST API (JSON)
┌─────────────▼───────────────┐
│     Nginx Reverse Proxy     │  ← Infrastructure layer
│  Static files + API proxy   │
└─────────────┬───────────────┘
              │
┌─────────────▼───────────────┐
│      Fastify API Server     │  ← Application layer (backend/)
│                             │
│  ┌────────────────────────┐ │
│  │     Routes/Controllers │ │  ← HTTP handling
│  ├────────────────────────┤ │
│  │       Services         │ │  ← Business logic
│  ├────────────────────────┤ │
│  │     Repositories       │ │  ← Data access abstraction
│  ├────────────────────────┤ │
│  │    Prisma ORM Client   │ │  ← Database interaction
│  └────────────────────────┘ │
└─────────────┬───────────────┘
              │
┌─────────────▼───────────────┐
│        PostgreSQL           │  ← Data layer
└─────────────────────────────┘
```

## Key Design Decisions

- **Feature-based modules**: Code organized by domain feature, not by technical layer
- **Repository pattern**: Abstracts database access for testability
- **JWT in HttpOnly cookies**: Secure, stateless authentication
- **Single SPA with subdomain detection**: Reduces deployment complexity
- **i18n scaffold (nl/en)**: Translation structure is prepared in `frontend/src/i18n` for gradual rollout

See [deployment.md](./deployment.md) for deployment instructions.
