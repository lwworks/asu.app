# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Migrations & Schema Evolution

LiveStore handles schema migrations automatically through its event-sourcing architecture. When you change your state schema, LiveStore detects the changes and rematerializes your state from the event log.

### How LiveStore Migrations Work

LiveStore uses schema hashing to detect changes:
1. Each table schema is hashed and stored in the database
2. On startup, LiveStore compares current schema hashes with stored ones
3. If changes are detected, LiveStore updates tables and rematerializes state
4. The event log remains immutable, ensuring data consistency

### Basic Schema Evolution

```tsx
import { State, Events, Schema, makeSchema, createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Initial schema - version 1
const todosV1 = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    userId: State.SQLite.text({ nullable: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

// Define events (these should remain stable)
const events = {
  todoAdded: Events.synced({
    name: 'todo.added',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      userId: Schema.String,
      createdAt: Schema.Number
    })
  })
}

// Initial materializer
const materializersV1 = State.SQLite.materializers(events, {
  'todo.added': (todo) => todosV1.insert(todo)
})

// After some time, you need to add new fields...

// Updated schema - version 2
const todosV2 = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    userId: State.SQLite.text({ nullable: false }),
    createdAt: State.SQLite.integer({ nullable: false }),
    // New fields added
    completed: State.SQLite.boolean({ default: false }),
    priority: State.SQLite.text({ default: 'medium' }),
    tags: State.SQLite.text({ default: '[]' }) // JSON array
  }
})

// Updated materializer to handle new fields
const materializersV2 = State.SQLite.materializers(events, {
  'todo.added': (todo) => todosV2.insert({
    ...todo,
    // Provide defaults for new fields on old events
    completed: false,
    priority: 'medium',
    tags: '[]'
  })
})

// Create store with updated schema
const state = State.SQLite.makeState({ 
  tables: { todos: todosV2 }, 
  materializers: materializersV2 
})
const schema = makeSchema({ state, events })

const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'migration-example'
})

// LiveStore will automatically:
// 1. Detect the schema change
// 2. Update the table structure
// 3. Rematerialize all todos from events
// 4. Apply defaults to new fields
```

### Event Schema Evolution

Events should be evolved carefully to maintain backward compatibility:

```tsx
import { State, Events, Schema } from '@livestore/livestore'

// Original event
const eventsV1 = {
  todoAdded: Events.synced({
    name: 'todo.added',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      userId: Schema.String
    })
  })
}

// Adding optional fields is safe
const eventsV2 = {
  todoAdded: Events.synced({
    name: 'todo.added',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      userId: Schema.String,
      // New optional fields
      priority: Schema.optional(Schema.String),
      dueDate: Schema.optional(Schema.Number)
    })
  })
}

// For breaking changes, use versioned events
const eventsV3 = {
  // Keep old event for compatibility
  todoAdded: Events.synced({
    name: 'todo.added',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      userId: Schema.String
    })
  }),
  // New versioned event with different structure
  todoAddedV2: Events.synced({
    name: 'todo.added.v2',
    schema: Schema.Struct({
      id: Schema.String,
      title: Schema.String, // renamed from 'text'
      description: Schema.String, // new required field
      authorId: Schema.String, // renamed from 'userId'
      metadata: Schema.Struct({
        priority: Schema.String,
        tags: Schema.Array(Schema.String)
      })
    })
  })
}

// Define the target table for materializers
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    title: State.SQLite.text({ nullable: false }),
    description: State.SQLite.text({ nullable: false }),
    authorId: State.SQLite.text({ nullable: false }),
    priority: State.SQLite.text({ default: 'medium' }),
    tags: State.SQLite.text({ default: '[]' })
  }
})

// Handle both event versions in materializers
const materializers = State.SQLite.materializers(eventsV3, {
  'todo.added': (todo) => todos.insert({
    id: todo.id,
    title: todo.text, // Map old field name
    description: '', // Provide default
    authorId: todo.userId,
    priority: 'medium',
    tags: '[]'
  }),
  'todo.added.v2': (todo) => todos.insert({
    id: todo.id,
    title: todo.title,
    description: todo.description,
    authorId: todo.authorId,
    priority: todo.metadata.priority,
    tags: JSON.stringify(todo.metadata.tags)
  })
})
```

### Migration Hooks

For custom migration logic, use migration hooks:

```tsx
import { State, Events, Schema, makeSchema, createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Define tables
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    userId: State.SQLite.text({ nullable: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

// Define events
const events = {
  todoAdded: Events.synced({
    name: 'todo.added',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      userId: Schema.String,
      createdAt: Schema.Number
    })
  })
}

// Define materializers
const materializers = State.SQLite.materializers(events, {
  'todo.added': (todo) => todos.insert(todo)
})

const state = State.SQLite.makeState({ 
  tables: { todos }, 
  materializers,
  // Migration configuration
  migration: {
    strategy: 'auto', // Default strategy
    hooks: {
      // Run once when database is first created
      init: async (db: any) => {
        console.log('Initializing database...')
        // Create custom indexes, views, etc.
        await db.exec(`
          CREATE INDEX IF NOT EXISTS idx_todos_user 
          ON todos(userId, createdAt DESC)
        `)
      },
      // Run before migration
      pre: async (db: any) => {
        console.log('About to migrate schema...')
        // Backup critical data, log migration start, etc.
      },
      // Run after migration
      post: async (db: any) => {
        console.log('Migration completed!')
        // Verify data integrity, update caches, etc.
      }
    },
    logging: {
      enabled: true // Enable migration logging
    }
  }
})
```

### Best Practices

1. **Keep Events Immutable**: Never change the structure of existing events
2. **Use Optional Fields**: Add new fields as optional with defaults
3. **Version Event Names**: For breaking changes, create new event versions
4. **Test Migrations**: Always test schema changes in development first
5. **Provide Defaults**: Ensure materializers handle missing fields gracefully

### Manual Migration Strategy

For complex scenarios requiring data transformation:

```tsx
import { State, Events, Schema } from '@livestore/livestore'
// Note: Manual migration requires SQL.js or similar for database manipulation
// import SQL from 'sql.js'

// Define tables
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    userId: State.SQLite.text({ nullable: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

// Define events
const events = {
  todoAdded: Events.synced({
    name: 'todo.added',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      userId: Schema.String,
      createdAt: Schema.Number
    })
  })
}

// Define materializers
const materializers = State.SQLite.materializers(events, {
  'todo.added': (todo) => todos.insert(todo)
})

const state = State.SQLite.makeState({
  tables: { todos },
  materializers,
  migration: {
    strategy: 'manual',
    migrate: async (oldDb: Uint8Array) => {
      // Export old database
      // const tempDb = new SQL.Database(oldDb)
      
      // Perform complex transformations
      // - Rename columns
      // - Transform data formats
      // - Merge/split tables
      
      // Return new database
      // return tempDb.export()
      
      // For now, just return the original database
      return oldDb
    }
  }
})
```

> **Note**: Manual migrations are rarely needed. LiveStore's auto-migration handles most schema evolution scenarios through rematerialization.

### Common Migration Scenarios

#### Adding a Column
```tsx
import { State } from '@livestore/livestore'

// Before
const todosBefore = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false })
  }
})

// After
const todosAfter = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }) // New column
  }
})
```

#### Changing Column Types
```tsx
import { State, Events, Schema } from '@livestore/livestore'

// Instead of changing types directly, add a new column
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    oldPriority: State.SQLite.text({ nullable: true }), // Keep old
    priority: State.SQLite.integer({ default: 2 }) // Add new
  }
})

// Define events
const events = {
  todoAdded: Events.synced({
    name: 'todo.added',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      priority: Schema.optional(Schema.String) // Old string priority
    })
  })
}

// Update materializer to handle conversion
const materializers = State.SQLite.materializers(events, {
  'todo.added': (todo) => todos.insert({
    id: todo.id,
    text: todo.text,
    oldPriority: todo.priority, // Keep old value
    priority: todo.priority ? parseInt(todo.priority) : 2 // Convert to number
  })
})
```

### Next Steps

- Learn about @14-sync-realtime.md features
- Explore @15-debugging-tools.md for migration issues
- Read about @17-common-pitfalls.md in schema design