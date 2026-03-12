# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Sync & Real-time Updates

LiveStore provides a pluggable sync architecture that enables real-time collaboration. Sync is optional - you can use LiveStore as a local-only database or enable sync by choosing a sync backend.

### How LiveStore Sync Works

LiveStore uses an event-sourcing model with Git-like synchronization:
- **Push/Pull Model**: Clients pull remote events before pushing local changes
- **Event Ordering**: Maintains global order across all clients
- **Automatic Rebasing**: Local events rebase on top of remote events
- **Eventual Consistency**: All clients converge to the same state

### Available Sync Backends

#### Cloudflare Sync (@livestore/sync-cf)

Real-time sync using Cloudflare Workers and Durable Objects:

```tsx
import { State, Events, Schema, makeSchema } from '@livestore/livestore'
// Note: These imports would come from separate packages
// import { makeWebWorker } from '@livestore/web'
// import { makeCfSync } from '@livestore/sync-cf'

// Example schema
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false })
  }
})

const events = {
  todoAdded: Events.synced({
    name: 'todo.added',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String
    })
  })
}

const materializers = State.SQLite.materializers(events, {
  'todo.added': (todo) => todos.insert(todo)
})

const state = State.SQLite.makeState({ tables: { todos }, materializers })
const schema = makeSchema({ state, events })

// Usage with sync backend (pseudo-code)
/*
const worker = makeWebWorker({
  schema,
  sync: {
    backend: makeCfSync({
      url: 'wss://your-sync-worker.workers.dev',
      roomId: 'my-app-room'
    }),
    initialSyncOptions: {
      _tag: 'Blocking',
      timeout: 5000
    }
  }
})

const client = worker.makeClient()
const store = await client.createStore({
  storeId: 'my-store'
})
*/
```

#### ElectricSQL Sync (@livestore/sync-electric)

HTTP-based sync using ElectricSQL:

```tsx
// Note: These imports would come from separate packages
// import { makeWebWorker } from '@livestore/web'
// import { makeElectricSync } from '@livestore/sync-electric'
// import { schema } from './schema'

// Usage with ElectricSQL (pseudo-code)
/*
const worker = makeWebWorker({
  schema,
  sync: {
    backend: makeElectricSync({
      url: 'https://your-electric-instance.com',
      token: 'your-auth-token'
    })
  }
})
*/
```

### Enabling Sync in Your App

1. **Install the sync backend package**:
   ```bash
   npm install @livestore/sync-cf
   # or
   npm install @livestore/sync-electric
   ```

2. **Deploy the sync server** (see backend-specific docs)

3. **Configure your adapter with sync**:
   ```tsx
   // Note: These imports would come from separate packages
   // import { makeWebWorker } from '@livestore/web'
   // import { makeCfSync } from '@livestore/sync-cf'
   // import { schema } from './schema'
   
   // Example configuration (pseudo-code)
   /*
   const worker = makeWebWorker({
     schema,
     sync: {
       backend: makeCfSync({
         url: process.env.SYNC_URL
       })
     }
   })
   */
   ```

### Sync Configuration Options

```tsx
// Sync configuration options (pseudo-code)
const syncConfig = {
  // backend: makeCfSync({ /* backend config */ }),
  
  // Initial sync behavior
  initialSyncOptions: {
    _tag: 'Blocking' as const,    // Wait for sync before continuing
    timeout: 5000                  // Max wait time in ms
  },
  /* Alternative:
  initialSyncOptions: {
    _tag: 'NonBlocking' as const  // Start immediately, sync in background
  },
  */
  
  // Sync interval (default: 1000ms)
  pullInterval: 2000,
  
  // Batch size for push operations
  pushBatchSize: 100
}
```

### Conflict Resolution

LiveStore uses last-write-wins by default based on event sequence numbers. The sync system automatically handles:
- **Event rebasing**: Local events are rebased when remote events arrive
- **Deterministic ordering**: Same final state across all clients
- **No data loss**: All events are preserved in the log

For custom conflict resolution, implement logic in your materializers:

```tsx
import { State, Events, Schema } from '@livestore/livestore'

// Define table
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    updatedAt: State.SQLite.integer({ nullable: false })
  }
})

// Define events
const events = {
  todoUpdated: Events.synced({
    name: 'todo.updated',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      updatedAt: Schema.Number
    })
  })
}

// Materializer with conflict resolution logic
const materializers = State.SQLite.materializers(events, {
  'todo.updated': (event) => {
    // Custom merge logic based on timestamp
    // In practice, you might compare event.updatedAt with existing value
    return todos.update({
      text: event.text,
      updatedAt: event.updatedAt
    }).where({ 
      id: event.id
    })
  }
})
```

### Offline Support

Sync backends automatically handle offline scenarios:
- **Event queuing**: Local events are queued when offline
- **Auto-reconnect**: Sync resumes when connection is restored
- **No data loss**: All queued events sync when online

### Monitoring Sync Status

```tsx
// Monitoring sync status (pseudo-code)
// Note: Exact API depends on the adapter implementation

/*
// Check if sync is enabled
const hasSyncEnabled = store.syncEnabled()

// Monitor sync events
store.on('sync:connected', () => console.log('Sync connected'))
store.on('sync:disconnected', () => console.log('Sync disconnected'))
store.on('sync:error', (error: Error) => console.error('Sync error:', error))
*/
```

### Important Notes

- **Sync is optional**: LiveStore works perfectly as a local-only database
- **Server required**: You must deploy a sync backend server
- **Auth not included**: Implement authentication at the sync server level
- **Not peer-to-peer**: Requires a central sync server

### Next Steps

- Deploy a sync backend: See [@livestore/sync-cf docs](https://github.com/livestorejs/livestore/tree/main/packages/sync-cf)
- Learn about @15-debugging-tools.md
- Explore @17-common-pitfalls.md