# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

```
asu-app/
├── apps/
│   ├── web/        # React frontend (@asu/web)
│   ├── auth/       # BetterAuth + Hono server (@asu/auth)
│   └── sync/       # CF Worker for LiveStore sync (@asu/sync)
├── packages/
│   └── shared/     # Shared types (@asu/shared)
└── livestore-manual/  # Reference docs
```

## Commands

```bash
pnpm install                          # Install all workspace deps
pnpm --filter @asu/web dev            # Start frontend dev server on port 60001
pnpm --filter @asu/web build          # TypeScript check + Vite build
pnpm --filter @asu/web lint           # ESLint check
pnpm --filter @asu/auth dev           # Start auth server (tsx watch)
pnpm --filter @asu/sync dev           # Start sync worker (wrangler dev)
```

## Architecture Overview

This is an emergency operations management application ("ASÜ.APP") built with React 19, TypeScript, and Vite. The app manages operations (Einsätze), squads (Trupps), and personnel (Personal/Forces).

### Auth: BetterAuth on Hono

- Auth server in `apps/auth/` — email+password and email OTP login
- PostgreSQL database on Hetzner, Drizzle ORM
- Custom routes for orgs, invites, sync tokens
- JWT sync tokens signed with shared secret (verified by CF Worker)

### Organizations

- Users belong to organizations via memberships (admin | member)
- Invite-based onboarding with expiring codes
- Org switcher in frontend — switching remounts LiveStore with new storeId

### State Management: Livestore (Event-Sourcing)

The app uses Livestore for event-driven state management with client-side SQLite persistence via OPFS, synced across devices/users via `@livestore/sync-cf`.

**Key pattern:**
- Events are the source of truth for mutations (e.g., `operationCreated`, `squadStarted`)
- Events are defined in `apps/web/src/livestore/schema/` and materialized into SQLite tables
- Queries use `queryDb()` wrapper: `tables.tableName.where().orderBy().first()`
- React integration: `store.useQuery(query$)` for reactive data
- `storeId = orgId` — all org members share the same Durable Object

**Schema location:** `apps/web/src/livestore/schema/`
- `operation/` - operations, squads, squad members, squad logs
- `force.ts` - personnel database
- `ui-settings.ts` - theme, mode, font preferences

**Queries location:** `apps/web/src/livestore/queries/`

**Event schema evolution rules** (see `apps/web/livestore-migrations.md` for full details):
- Never modify existing event schemas with breaking changes (removing/renaming fields, changing types)
- Only add **optional** fields to existing events, with sensible defaults in materializers
- For breaking changes, create versioned events (`forceCreatedV2`, `forceCreatedV3`...) and keep old ones
- Update materializers to handle **all** event versions
- Table schema changes (adding/removing columns) are always safe — tables are rebuilt from events

### Sync: CF Worker

- `apps/sync/` — Cloudflare Worker with Durable Objects
- `storeId = orgId` → one Durable Object per org
- JWT validation on WebSocket connect (verifies org membership)

### Routing: TanStack Router

File-based routing in `apps/web/src/routes/`:
- Parameterized routes use `$` prefix: `/einsatz/$operationSlug`
- Route loaders fetch params: `loader: async ({ params }) => params.operationSlug`
- `routeTree.gen.ts` is auto-generated
- Auth routes: `/anmelden`, `/registrieren`, `/einladung/$code`, `/organisationen`

### UI Components

- Shadcn/ui components in `apps/web/src/components/ui/` (New York style)
- Radix UI primitives for accessibility
- Tailwind CSS with custom OKLch color scheme (primary: #F1FF00)
- Lucide React for icons

### Path Aliases

`@/*` maps to `./src/*` (configured in apps/web/tsconfig.app.json)

## Domain Model

- **Operations** (Einsätze): Main event containers with description, timestamps
- **Squads** (Trupps): Teams with status flow: created → active/standby → ended → archived
- **Squad Members**: Personnel assigned to squads
- **Squad Logs**: Activity logs with timestamps
- **Forces**: Personnel database with training/medical check dates

## Localization

The app is in German:
- Einsätze = Operations
- Trupps = Squads
- Personal = Forces/Personnel
- Einstellungen = Settings
- Anmelden = Sign In
- Registrieren = Register
- Organisationen = Organizations
- Einladung = Invitation

## Key Files

- `apps/web/src/main.tsx` - Entry point
- `apps/web/src/routes/__root.tsx` - Root layout with providers (Auth, Org, Livestore, CurrentTime)
- `apps/web/src/livestore/index.tsx` - Livestore provider setup (accepts orgId + syncToken)
- `apps/web/src/livestore/schema/index.ts` - Database schema aggregation
- `apps/web/src/context/auth.tsx` - Auth context (BetterAuth React client)
- `apps/web/src/context/org.tsx` - Org context (org list, switcher, sync token)
- `apps/auth/src/index.ts` - Auth server entry
- `apps/sync/src/index.ts` - Sync worker entry
