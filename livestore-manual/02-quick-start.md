# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Quick Start

This guide walks you through building a todo app with LiveStore, step by step.

### Installation

```bash
# Core packages
npm install @livestore/livestore @livestore/react

# Platform-specific adapters
npm install @livestore/adapter-web    # For browsers
npm install @livestore/adapter-node   # For Node.js
npm install @livestore/adapter-expo   # For React Native
```

### Building a Todo App

Here's a complete todo app that demonstrates all the core concepts of LiveStore:

```tsx
import { 
  State, Events, Schema, makeSchema, createStorePromise, 
  queryDb, signal 
} from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// ============================================
// STEP 1: DEFINE YOUR TABLE STRUCTURE
// ============================================
// Tables in LiveStore are defined using State.SQLite.table()
// This creates a type-safe table definition that LiveStore uses to:
// - Generate SQL CREATE TABLE statements automatically
// - Provide type-safe insert/update/delete operations
// - Validate data at compile time
// - Enable auto-completion in your editor

const todos = State.SQLite.table({
  name: 'todos',  // The actual SQL table name
  columns: {
    // Each column specifies its SQL type and constraints
    // SQLite types: text, integer, real, blob, boolean
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

// ============================================
// STEP 2: CREATE SCHEMA TYPES
// ============================================
// Schema.Struct creates a runtime schema that can:
// - Validate data at runtime (important for user input!)
// - Parse JSON into typed objects
// - Encode objects back to JSON for storage/transmission
// - Provide TypeScript types via Schema.Schema.Type<>
// 
// This is different from the table definition above:
// - Table definition = SQL structure
// - Schema = Runtime validation + TypeScript types

const TodoSchema = Schema.Struct({
  id: Schema.String,        // Validates the value is a string at runtime
  text: Schema.String,      // These should match your table columns
  completed: Schema.Boolean, // Boolean validates true/false
  createdAt: Schema.Number  // Number for Unix timestamps
})

// Extract the TypeScript type from the schema
// This gives you full type safety in your application code
type Todo = Schema.Schema.Type<typeof TodoSchema>
// Resulting type: { id: string; text: string; completed: boolean; createdAt: number }

// ============================================
// STEP 3: DEFINE EVENTS
// ============================================
// Events are THE ONLY WAY to change data in LiveStore
// This might seem restrictive, but it enables:
// - Complete audit trail of all changes
// - Time-travel debugging
// - Undo/redo functionality
// - Conflict-free sync across devices
// - Event replay for migrations
//
// Think of events as "user intentions" rather than database operations

const events = {
  // Each event represents something that happened in your app
  todoAdded: Events.synced({
    name: 'todo.added',     // Globally unique event name
    schema: TodoSchema      // Reuse our schema for validation
  }),
  
  // Events can have different schemas based on needed data
  // For toggling, we only need the id and new completed state
  todoToggled: Events.synced({
    name: 'todo.toggled',
    schema: Schema.Struct({
      id: Schema.String,       
      completed: Schema.Boolean
    })
  }),
  
  // For deletion, we only need the id
  todoDeleted: Events.synced({
    name: 'todo.deleted', 
    schema: Schema.Struct({
      id: Schema.String
    })
  })
}

// ============================================
// STEP 4: CREATE MATERIALIZERS
// ============================================
// Materializers are pure functions that turn events into SQL operations
// They define HOW events change your database
//
// Rules for materializers:
// - Must be pure functions (no side effects, no randomness)
// - Must be deterministic (same event = same result)
// - Can only modify the database, not read from it
// - Run automatically when events are committed
//
// This separation of events and materializers enables:
// - Replaying events to rebuild state
// - Running events through different materializers for different views

const materializers = State.SQLite.materializers(events, {
  // The key MUST match the event name exactly
  'todo.added': ({ id, text, completed, createdAt }) => 
    // Return a SQL operation (not executed immediately)
    todos.insert({ id, text, completed, createdAt }),
  
  'todo.toggled': ({ id, completed }) =>
    // Update only the completed field where id matches
    // The .where() creates a WHERE clause
    todos.update({ completed }).where({ id }),
  
  'todo.deleted': ({ id }) =>
    // Delete the row where id matches
    todos.delete().where({ id })
})

// ============================================
// STEP 5: CREATE STATE AND SCHEMA
// ============================================
// Combine tables and materializers into a state object
// This represents your entire database structure
const state = State.SQLite.makeState({ 
  tables: { todos },  // All your tables go here
  materializers       // How events modify those tables
})

// Create the complete schema that LiveStore needs
// This combines your state (tables + materializers) with events
const schema = makeSchema({ state, events })

// ============================================
// STEP 6: INITIALIZE THE STORE
// ============================================
// The store is your main interface to LiveStore
// It handles:
// - Database initialization
// - Event processing
// - Query execution
// - Reactivity
// - Sync (if configured)

const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(), // In-memory SQLite for development
  storeId: 'todo-app'            // Unique identifier for this store
})

// Other adapter options:
// - makePersistedAdapter() - Uses OPFS in browsers for persistence
// - makeAdapter() - Uses SQLite file on disk
// - makePersistedAdapter() - Uses SQLite on mobile

// ============================================
// STEP 7: CREATE REACTIVE QUERIES
// ============================================
// Signals are reactive values that trigger re-computation
// When a signal changes, any queries that depend on it re-run
const filterMode = signal<'all' | 'active' | 'completed'>('all')

// queryDb creates a reactive query that:
// - Re-runs when the data changes (todos added/deleted/toggled)
// - Re-runs when signals it depends on change (filterMode)
// - Returns the same result if nothing changed (memoized)
const todosQuery = queryDb((get) => {
  // get() subscribes to the signal - this creates the dependency
  const filter = get(filterMode)
  
  // Build SQL dynamically based on current filter
  let whereClause = ''
  const bindValues: any[] = []
  
  if (filter === 'active') {
    whereClause = 'WHERE completed = 0'  // SQLite uses 0/1 for booleans
  } else if (filter === 'completed') {
    whereClause = 'WHERE completed = 1'
  }
  // 'all' has no WHERE clause
  
  return {
    query: `SELECT * FROM todos ${whereClause} ORDER BY createdAt DESC`,
    bindValues,  // SQL parameters for security (prevents injection)
    schema: Schema.Array(TodoSchema) // Validates each row
  }
})

// ============================================
// STEP 8: CREATE HELPER FUNCTIONS
// ============================================
// These functions make it easy to work with your store
// They handle event creation and committing

function addTodo(text: string) {
  // store.commit() is SYNCHRONOUS - no await needed!
  // This is a key LiveStore feature: all operations are instant
  store.commit(events.todoAdded({
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: Date.now()
  }))
}

function toggleTodo(id: string, completed: boolean) {
  store.commit(events.todoToggled({ id, completed }))
}

function deleteTodo(id: string) {
  store.commit(events.todoDeleted({ id }))
}

// ============================================
// STEP 9: SUBSCRIBE TO CHANGES
// ============================================
// Subscriptions are how you react to data changes
// Use these to update your UI, log changes, sync to server, etc.

const unsubscribe = store.subscribe(todosQuery, {
  onUpdate: (todos) => {
    // This function runs whenever:
    // 1. A todo is added/updated/deleted (data change)
    // 2. The filterMode signal changes (dependency change)
    console.log(`Todos updated: ${todos.length} items`)
    todos.forEach(todo => {
      console.log(`- [${todo.completed ? 'x' : ' '}] ${todo.text}`)
    })
  }
})

// ============================================
// STEP 10: USE YOUR APP!
// ============================================
// Everything is set up, now let's use it

// Add some todos - each triggers the subscription
addTodo('Learn LiveStore')      
addTodo('Build awesome apps')   
addTodo('Deploy to production')

// Change filter to 'active' - subscription fires with filtered results
store.setSignal(filterMode, 'active')

// Toggle a todo as completed
// In a real app, you'd get the ID from user interaction
// toggleTodo(someId, true)

// Clean up when done (important in React components!)
// unsubscribe()

// ============================================
// MINIMAL REACT COMPONENT
// ============================================
// Here's the simplest possible React component using our todo app

import React from 'react'
import { useQuery } from '@livestore/react'

function TodoList() {
  // useQuery subscribes to the query and re-renders on changes
  const todos = useQuery(todosQuery)
  
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={(e) => toggleTodo(todo.id, e.target.checked)}
          />
          {todo.text}
        </li>
      ))}
    </ul>
  )
}

// That's it! The component will automatically re-render when:
// - Todos are added/deleted/toggled
// - The filterMode signal changes

// ============================================
// WHAT'S HAPPENING UNDER THE HOOD
// ============================================
// 1. When you commit an event:
//    - Event is validated against its schema
//    - Event is stored in the event log
//    - Materializer runs to update the database
//    - All affected queries re-run
//    - Subscriptions fire with new results
//
// 2. When you change a signal:
//    - All queries that depend on it re-run
//    - Subscriptions fire with new results
//
// 3. Everything is synchronous and instant
//    - No async/await needed
//    - No loading states
//    - UI updates immediately
```

### Next Steps

- Check out @06-react-integration.md to use LiveStore with React hooks
- Learn about @07-query-patterns.md for complex queries and joins
- Explore @14-sync-realtime.md for multi-device collaboration
- Read about @09-testing.md to test your LiveStore applications