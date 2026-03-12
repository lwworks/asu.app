# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Introduction & Core Concepts

### What is LiveStore?

LiveStore is a **local-first reactive database** for building real-time collaborative applications. It combines:
- **Local SQLite database** for instant, offline-capable data access
- **Reactive queries** that automatically update UI when data changes
- **Real-time sync** for collaborative features
- **Type-safe TypeScript API** for robust development

### Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React App     │────▶│   LiveStore      │────▶│  SQLite (OPFS)  │
│                 │     │                  │     │                 │
│  - Components   │     │  - Store         │     │  - Tables       │
│  - Hooks        │     │  - Queries       │     │  - Indexes      │
└─────────────────┘     │  - Mutations     │     │  - Data         │
                        │  - Reactivity    │     └─────────────────┘
                        │  - Sync Engine   │
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   Sync Server    │
                        │   (WebSocket)    │
                        └──────────────────┘
```

### Core Concepts

1. Define tables
2. Define schema structs
3. Define events
4. Make materializers from events
5. Make a state
6. Create a schema
7. Create a store with an adapter (go memory if you don’t know what you want)

Also:

* Queries automatically re-run when their dependencies change

```typescript
import { queryDb, signal, State, Events, makeSchema, createStorePromise, Schema } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Define a simple quotes table
const quotes = State.SQLite.table({
  name: 'quotes',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    author: State.SQLite.text({ nullable: false })
  }
})

// Define the Quote schema
const QuoteSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  author: Schema.String
})

// Define events for quotes
const events = {
  quoteAdded: Events.synced({
    name: 'quote.added',
    schema: QuoteSchema
  })
}

// Define materializers to handle events
const materializers = State.SQLite.materializers(events, {
  'quote.added': ({ id, text, author }) => 
    quotes.insert({ id, text, author })
})

// Create state and schema
const state = State.SQLite.makeState({ tables: { quotes }, materializers })
const schema = makeSchema({ state, events })

// Create store
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'quotes-app'
})

// Define a reactive signal for author filter
const authorFilter = signal('')

// Reactive query that re-runs when authorFilter changes
const quotesQuery = queryDb((get) => {
  const author = get(authorFilter)
  
  return {
    query: author 
      ? 'SELECT * FROM quotes WHERE author = ?'
      : 'SELECT * FROM quotes',
    bindValues: author ? [author] as const : [] as const,
    schema: Schema.Array(QuoteSchema)
  }
})

// This goes in your UI or event handler
function addNewQuote(text: string, author: string) {
  store.commit(events.quoteAdded({ id: crypto.randomUUID(), text, author }))
}

// Subscribe to the query to see reactive updates
const unsubscribe = store.subscribe(quotesQuery, {
  onUpdate: (quotes) => {
    console.log(`Query updated! Found ${quotes.length} quotes`)
    quotes.forEach(q => console.log(`- "${q.text}" - ${q.author}`))
  }
})

// Change the filter to 'Steve Jobs' - the subscription will fire!
store.setSignal(authorFilter, 'Steve Jobs')

// Add a new quote - the subscription will fire again with the filtered results!
addNewQuote('The only way to do great work is to love what you do.', 'Steve Jobs')
```

### When to Use LiveStore

**Perfect for:**
- Real-time collaborative apps (docs, whiteboards, project management)
- Offline-first applications
- Apps with complex client-side state
- Low-latency user experiences

**Not ideal for:**
- Simple CRUD apps with minimal client state
- Apps that require server-side data validation only
- Projects without TypeScript
