# LiveStore Migration & Schema Evolution Guide

## How LiveStore Migrations Work

LiveStore uses event-sourcing: the **event log is immutable** and SQLite tables are **materialized views** rebuilt entirely from events.

### Schema Hashing & Rematerialization

LiveStore computes a hash of the current schema (events + materializers + table definitions). When a client starts up:

1. It compares the stored schema hash against the current code's schema hash.
2. If the hashes differ, **all tables are dropped and rebuilt** by replaying every event through the materializers.
3. This means table schema changes (adding/removing columns, changing types) are always safe — the tables are just rebuilt.

### When Materializers Run

- **On first load**: All events are replayed to build tables from scratch.
- **On schema change**: Tables are dropped and rebuilt via full replay.
- **On new events**: Each new event is processed incrementally by its materializer.

## Event Evolution Rules

Because the event log is immutable and persisted, **events that have already been written to the log must remain parseable**. Breaking an existing event schema means old events can no longer be processed, which causes data loss during rematerialization.

### Safe Changes (Non-Breaking)

These changes are always safe because they don't break parsing of existing events:

- **Add optional fields** to an existing event (with a default/fallback in the materializer)
- **Add entirely new event types** — old logs simply won't contain them
- **Change table schemas** (add/remove columns, rename columns) — tables are rebuilt from events
- **Change materializer logic** — tables are rebuilt on schema hash change

### Breaking Changes (Unsafe)

These changes break parsing of existing events in the log:

- **Remove a field** from an existing event
- **Rename a field** in an existing event
- **Change a field's type** in an existing event (e.g., `string` → `number`)
- **Remove an event type** that exists in the log

### How to Handle Breaking Changes: Versioned Events

When you need to make a breaking change to an event, create a new versioned event and keep the old one:

```typescript
// Original event — keep this forever
export const forceCreated = createEvent({
  name: 'forceCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    rank: Schema.String,
  }),
})

// New version with breaking changes
export const forceCreatedV2 = createEvent({
  name: 'forceCreatedV2',
  schema: Schema.Struct({
    id: Schema.String,
    firstName: Schema.String,  // was "name"
    lastName: Schema.String,   // new required field
    rank: Schema.String,
    unit: Schema.String,       // new required field
  }),
})
```

Then update the materializer to handle **both** versions:

```typescript
// In the materializer, handle all versions
forceCreated: (state, event) => {
  // Old events: derive firstName/lastName from name, use defaults for new fields
  const [firstName, ...rest] = event.name.split(' ')
  const lastName = rest.join(' ')
  db.exec('INSERT INTO forces ...', {
    id: event.id,
    firstName,
    lastName,
    rank: event.rank,
    unit: 'Unbekannt', // sensible default for old events
  })
},
forceCreatedV2: (state, event) => {
  // New events: use fields directly
  db.exec('INSERT INTO forces ...', {
    id: event.id,
    firstName: event.firstName,
    lastName: event.lastName,
    rank: event.rank,
    unit: event.unit,
  })
},
```

### Adding Optional Fields (Safe)

For non-breaking additions, just add the field as optional and handle the fallback:

```typescript
export const forceCreated = createEvent({
  name: 'forceCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    rank: Schema.String,
    email: Schema.optional(Schema.String), // new optional field
  }),
})
```

## Summary of Rules

| Change | Safe? | Action |
|--------|-------|--------|
| Add optional field to event | Yes | Add with default in materializer |
| Add new event type | Yes | Just add it |
| Change table schema | Yes | Tables are rebuilt automatically |
| Change materializer logic | Yes | Triggers rematerialization |
| Remove/rename event field | No | Create versioned event (v2) |
| Change event field type | No | Create versioned event (v2) |
| Remove event type | No | Keep old event, stop emitting it |
