# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### 朋友揪團日曆 (group-calendar)

A shared group availability calendar app where friends can mark the days they're free. No login required.

**Features:**
- First-visit setup: pick a nickname + emoji (saved to localStorage)
- Shared calendar showing all 12 months
- Each day cell shows count + emoji avatars of who's free
- Click a day to toggle your own availability
- Click any day to see a popup of who's available
- Summary banner showing the best days to meet

**Tech stack:**
- Frontend: React + Vite at `/` (artifacts/group-calendar)
- Backend: Express API server at `/api` (artifacts/api-server)
- Database: PostgreSQL with Drizzle ORM

**DB Schema:**
- `users` — id, nickname (unique), emoji, created_at
- `availability` — id, date, user_id (unique constraint on date+user_id)

**API Endpoints:**
- GET /api/users — list all users
- POST /api/users — create or find user by nickname
- GET /api/availability — all date→user mappings
- POST /api/availability/toggle — toggle user availability for a date
- GET /api/availability/summary — top dates, total users, total days marked
