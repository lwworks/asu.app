# CLAUDE.md - AI Assistant Guide for ASU.APP

## Project Overview

**ASU.APP** is a German-language emergency operations management application built for fire departments (Atemschutzuberwachung / Breathing Apparatus Monitoring). It tracks operations, squads, personnel, and activity logs in real-time with full offline capability.

- **Version:** 0.1.0
- **Language:** German (UI text in German)
- **Type:** Full-stack React SPA with event-sourced SQLite backend

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Language | TypeScript 5.8 (strict mode) |
| Build Tool | Vite 6 |
| Routing | TanStack Router (file-based) |
| State Management | Livestore (event-sourced SQLite) |
| Styling | Tailwind CSS v4 + shadcn/ui (New York style) |
| Tables | TanStack Table |
| Icons | Lucide React |
| Package Manager | pnpm 10.10.0 |

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server (default port: 60001)
pnpm dev

# Type check and build
pnpm build

# Lint code
pnpm lint
```

### Development URLs
- Dev server: `http://localhost:60001` (or `PORT` env variable)
- Reset persistence: Add `?reset` query parameter in development

## Project Structure

```
src/
├── components/           # React components
│   ├── forces/          # Personnel management (import, table)
│   ├── layout/          # App layout (header, main, settings drawer)
│   ├── operation/       # Operation management
│   │   └── squads/      # Squad management
│   │       └── card/    # Squad card compound component
│   ├── pages/           # Page wrapper components
│   ├── ui/              # shadcn UI primitives (19 components)
│   └── visuals/         # Icons, logo
├── routes/              # TanStack Router file-based routes
│   ├── __root.tsx       # Root layout with providers
│   ├── index.tsx        # Home page
│   ├── personal.tsx     # Personnel page
│   ├── einstellungen.tsx # Settings page
│   └── einsatz/         # Operation routes
│       └── $operationSlug/
├── livestore/           # Event-sourced state management
│   ├── schema/          # Event and table definitions
│   │   ├── operation/   # Operations, squads, members, logs
│   │   ├── force.ts     # Personnel roster
│   │   └── ui-settings.ts
│   ├── queries/         # SQLite query definitions
│   └── index.tsx        # LiveStore provider setup
├── context/             # React Context providers
├── lib/                 # Utility functions
├── types/               # TypeScript type definitions
└── main.tsx             # Application entry point
```

## Architecture

### Livestore (Event Sourcing)

The application uses **Livestore** for state management, which provides:
- Event-sourced data model with SQLite materialized views
- Full offline capability via OPFS (Origin Private File System)
- Web Worker-based SQLite execution

#### Core Data Model

| Table | Purpose |
|-------|---------|
| `operations` | Emergency operations with description, slug, recordKeeper |
| `squads` | Response teams with status (active/standby/ended/archived) |
| `squadMembers` | Team personnel with pressure readings |
| `squadLogs` | Activity logs with timestamps |
| `forces` | Personnel roster with training/medical status |
| `uiSettings` | User preferences |

#### Event Pattern

Events are defined in `src/livestore/schema/` with versioned names:

```typescript
// Define events with schema validation
export const squadsEvents = {
  squadCreated: Events.synced({
    name: "v1.SquadCreated",
    schema: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      // ...
    }),
  }),
};

// Materializers convert events to table operations
export const squadsMaterializers = State.SQLite.materializers(squadsEvents, {
  "v1.SquadCreated": (data) => squadsTable.insert(data),
  "v1.SquadStarted": ({ id, startedAt }) =>
    squadsTable.update({ startedAt }).where({ id }),
});
```

#### Query Pattern

Queries are defined in `src/livestore/queries/` with `$` suffix:

```typescript
export const squadMembers$ = (squadId: string) => {
  return queryDb(tables.squadMembers.where({ squadId }), {
    label: "squad-members",
  });
};
```

### Routing (TanStack Router)

File-based routing with automatic code splitting:

- Routes defined in `src/routes/`
- Dynamic params use `$` prefix: `$operationSlug`
- Route tree auto-generated at `src/routeTree.gen.ts`

```typescript
// Route component pattern
export const Route = createFileRoute('/einsatz/$operationSlug/trupps')({
  component: TruppsPage,
});
```

## Code Conventions

### File Naming

- Components: `PascalCase.tsx` (e.g., `SquadCard.tsx`)
- Utilities: `kebab-case.ts` (e.g., `check-date-format.ts`)
- Queries: `camelCase.ts` with `$` suffix (e.g., `squadMembers$`)
- Routes: lowercase (e.g., `personal.tsx`, `einstellungen.tsx`)

### Component Structure

```typescript
// Standard component pattern
import { Button } from "@/components/ui/button";
import { useStore } from "@livestore/react";
import { useCurrentTime } from "@/context/current-time";
import { events } from "@/livestore/schema";
import { someQuery$ } from "@/livestore/queries/...";

export const ComponentName = ({ prop }: Props) => {
  const { store } = useStore();
  const data = store.useQuery(someQuery$());
  const { currentTime } = useCurrentTime();

  const handleAction = () => {
    store.commit(events.eventName({ ...payload }));
  };

  return <div className="...">{/* JSX */}</div>;
};
```

### Import Order

1. External packages (react, tanstack, etc.)
2. Internal components (`@/components/...`)
3. Livestore imports (`@/livestore/...`)
4. Utilities (`@/lib/...`)
5. Types (`@/types/...`)

### Styling

- Use Tailwind CSS classes with `cn()` utility for conditional classes
- Follow shadcn/ui patterns for component variants (CVA)
- Theme colors defined in `src/index.css` using CSS variables
- Dark mode supported via `.dark` class

```typescript
import { cn } from "@/lib/cn";

<div className={cn("base-classes", condition && "conditional-class")} />
```

### UI Components

- shadcn/ui components in `src/components/ui/`
- Radix UI primitives with Tailwind styling
- Use `Slot` pattern for composition
- Export both component and variants when applicable

## Key Patterns

### Creating New Events

1. Define event in appropriate schema file (`src/livestore/schema/`)
2. Add materializer to handle the event
3. Export from schema index
4. Commit events using `store.commit(events.eventName({...}))`

### Adding New Queries

1. Create query file in `src/livestore/queries/`
2. Use `queryDb()` with table and label
3. Use in components with `store.useQuery(query$())`

### Adding New Routes

1. Create file in `src/routes/` following naming convention
2. TanStack Router auto-generates route tree
3. Use `createFileRoute()` or `createRootRoute()`

### Adding UI Components

```bash
# Add shadcn component
pnpm dlx shadcn@latest add <component-name>
```

Components are added to `src/components/ui/`.

## Domain Terminology (German)

| German | English | Context |
|--------|---------|---------|
| Einsatz | Operation | Emergency response operation |
| Trupp | Squad | Response team |
| Atemschutz | Breathing apparatus | Fire department safety equipment |
| Uberwachung | Monitoring | Tracking/surveillance |
| Kräfte/Personal | Forces/Personnel | Responders roster |
| Einstellungen | Settings | Application settings |

## Testing

Currently no automated testing framework is configured. When adding tests:
- Consider Vitest (Vite-native testing)
- Place tests adjacent to source files or in `__tests__/` directories

## Common Tasks

### Committing State Changes

```typescript
const { store } = useStore();

// Single event
store.commit(events.squadCreated({ id, name, operationId, ... }));

// Multiple related events
store.commit(events.operationCreated({ ... }));
store.commit(events.squadCreated({ ... }));
```

### Reading State

```typescript
const { store } = useStore();
const operations = store.useQuery(operations$());
const members = store.useQuery(squadMembers$(squadId));
```

### Navigating

```typescript
const navigate = useNavigate();
navigate({
  to: "/einsatz/$operationSlug/trupps",
  params: { operationSlug: slug },
});
```

## Important Notes

- **Language:** All UI text is in German - maintain consistency
- **Offline-first:** Application works fully offline; changes sync when online
- **Event Sourcing:** Never mutate state directly; always commit events
- **Type Safety:** Strict TypeScript; avoid `any` types
- **IDs:** Use `crypto.randomUUID()` for generating unique identifiers
- **Dates:** Use `date-fns` for date formatting/manipulation
