# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Project Structure Best Practices

### Recommended Directory Structure

```
src/
├── store/
│   ├── index.ts              # Store initialization & export
│   ├── schema.ts             # Table definitions & types
│   ├── migrations/           # Database migrations
│   │   ├── v1-initial.ts
│   │   ├── v2-add-tags.ts
│   │   └── index.ts
│   ├── queries/              # Reusable reactive queries
│   │   ├── todos.ts
│   │   ├── users.ts
│   │   └── index.ts
│   ├── mutations/            # Mutation helpers & validators
│   │   ├── todos.ts
│   │   └── users.ts
│   ├── events.ts             # Event definitions
│   └── types.ts              # Generated/exported types
├── components/
│   ├── TodoList.tsx
│   └── TodoItem.tsx
├── hooks/                    # Custom LiveStore hooks
│   ├── useTodos.ts
│   └── useOptimisticUpdate.ts
└── utils/
    └── validation.ts         # Input validation schemas
```

### File Organization Guidelines

Based on the todo app example from @02-quick-start.md, here's how you would organize the code into separate files:

#### **store/index.ts**
This is your main store initialization file. It:
- Creates the store instance with `createStorePromise()`
- Exports the configured store for use throughout your app
- Sets up the adapter (web, node, or expo)
- Configures any middleware or plugins

#### **store/schema.ts**
Contains all your table definitions and TypeScript types:
- Table definitions using `State.SQLite.table()`
- Schema definitions using `Schema.Struct()`
- Exported TypeScript types derived from schemas
- Any custom type utilities or helpers

#### **store/events.ts**
Defines all events that can occur in your system:
- Event definitions using `Events.synced()` or `Events.local()`
- Event schemas that validate event payloads
- Event name constants to avoid typos
- Helper functions to create events with proper typing

#### **store/queries/**
Reactive queries organized by domain:
- Each file exports related queries (e.g., `todos.ts` has all todo-related queries)
- Shared signals that queries depend on
- Query composition and reusable query fragments
- Computed values derived from queries

#### **store/mutations/**
Helper functions that commit events:
- Input validation before creating events
- Business logic that determines which events to create
- Batch operations that commit multiple events
- Error handling and user feedback

#### **components/**
React components that use LiveStore:
- Use `useQuery()` hook to subscribe to queries
- Call mutation helpers to modify data
- Handle loading and error states
- Implement optimistic UI updates

#### **hooks/**
Custom React hooks that encapsulate LiveStore logic:
- Combine multiple queries into a single hook
- Add optimistic update logic
- Handle complex subscription patterns
- Provide convenient APIs for components

### Best Practices

1. **Keep Store Logic Separate**: Don't put store initialization or queries directly in components. This makes testing easier and keeps concerns separated.

2. **Group Related Code**: Put related queries, mutations, and types in the same domain folder or file.

3. **Export Everything from Index**: Use barrel exports (`index.ts` files) to provide clean import paths.

4. **Type Everything**: LiveStore is built for TypeScript. Take advantage of type safety everywhere.

5. **Pure Functions**: Materializers and query functions should be pure - no side effects, no randomness.

6. **Single Source of Truth**: All state lives in LiveStore. Don't duplicate state in React components.

### Migration Strategy

When starting with LiveStore:

1. Start with everything in one file (like our Quick Start example)
2. As the app grows, extract schemas and events first
3. Move queries to separate files when you have 5+ queries
4. Create mutation helpers when you have repeated event creation logic
5. Extract custom hooks when components share similar LiveStore usage patterns

Remember: The goal is maintainability and clarity, not premature optimization. Start simple and refactor as needed.
