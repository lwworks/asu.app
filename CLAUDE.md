# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev      # Start dev server on port 60001
pnpm build    # TypeScript check + Vite build
pnpm lint     # ESLint check
pnpm preview  # Preview production build
```

## Architecture Overview

This is an emergency operations management application ("ASÜ.APP") built with React 19, TypeScript, and Vite. The app manages operations (Einsätze), squads (Trupps), and personnel (Personal/Forces).

### State Management: Livestore (Event-Sourcing)

The app uses Livestore for event-driven state management with client-side SQLite persistence via OPFS.

**Key pattern:**
- Events are the source of truth for mutations (e.g., `operationCreated`, `squadStarted`)
- Events are defined in `/src/livestore/schema/` and materialized into SQLite tables
- Queries use `queryDb()` wrapper: `tables.tableName.where().orderBy().first()`
- React integration: `store.useQuery(query$)` for reactive data

**Schema location:** `/src/livestore/schema/`
- `operation/` - operations, squads, squad members, squad logs
- `force.ts` - personnel database
- `ui-settings.ts` - theme, mode, font preferences

**Queries location:** `/src/livestore/queries/`

**Event schema evolution rules** (see `livestore-migrations.md` for full details):
- Never modify existing event schemas with breaking changes (removing/renaming fields, changing types)
- Only add **optional** fields to existing events, with sensible defaults in materializers
- For breaking changes, create versioned events (`forceCreatedV2`, `forceCreatedV3`...) and keep old ones
- Update materializers to handle **all** event versions
- Table schema changes (adding/removing columns) are always safe — tables are rebuilt from events

### Routing: TanStack Router

File-based routing in `/src/routes/`:
- Parameterized routes use `$` prefix: `/einsatz/$operationSlug`
- Route loaders fetch params: `loader: async ({ params }) => params.operationSlug`
- `routeTree.gen.ts` is auto-generated

### UI Components

- Shadcn/ui components in `/src/components/ui/` (New York style)
- Radix UI primitives for accessibility
- Tailwind CSS with custom OKLch color scheme (primary: #F1FF00)
- Lucide React for icons

### Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.app.json)

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

## Key Files

- `/src/main.tsx` - Entry point
- `/src/routes/__root.tsx` - Root layout with providers (Livestore, CurrentTime)
- `/src/livestore/index.tsx` - Livestore provider setup
- `/src/livestore/schema/index.ts` - Database schema aggregation
