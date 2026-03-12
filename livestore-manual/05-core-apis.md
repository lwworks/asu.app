# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Core APIs

This section covers the essential APIs you'll use when working with LiveStore beyond the basics.

### Store Instance Methods

Once you've created a store with `createStorePromise()`, you have access to these key methods:

```tsx
import { State, Events, Schema, makeSchema, createStorePromise, queryDb, signal } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Complete example showing all store methods
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false })
  }
})

const events = {
  todoAdded: Events.synced({
    name: 'todo.added',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      completed: Schema.Boolean
    })
  })
}

const materializers = State.SQLite.materializers(events, {
  'todo.added': (todo) => todos.insert(todo)
})

const state = State.SQLite.makeState({ tables: { todos }, materializers })
const schema = makeSchema({ state, events })

const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'my-app'
})

// ============================================
// store.commit() - Add events to the store
// ============================================
// This is how ALL data changes happen in LiveStore
store.commit(events.todoAdded({
  id: crypto.randomUUID(),
  text: 'Learn LiveStore',
  completed: false
}))

// ============================================
// store.query() - Run queries synchronously
// ============================================
// Define a query
const todosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos',
  bindValues: [] as const,
  schema: Schema.Array(todos.rowSchema)
}))

// For one-time queries without reactivity
const todosList = store.query(todosQuery)
console.log(todosList) // Array of todo objects

// ============================================
// store.subscribe() - React to query changes
// ============================================
// This is the foundation of LiveStore's reactivity
const unsubscribe = store.subscribe(todosQuery, {
  onUpdate: (todos) => {
    console.log('Todos changed:', todos)
    // Update your UI here
  }
})

// Always clean up subscriptions when done
unsubscribe()

// ============================================
// store.setSignal() - Update reactive signals
// ============================================
// Signals are reactive values that queries can depend on
const filterSignal = signal<'all' | 'active' | 'completed'>('all')

// Update the signal - any queries using it will re-run
store.setSignal(filterSignal, 'active')
```

### Events API

Events are how you make changes in LiveStore. Currently, all events are synced:

```tsx
import { Events, Schema, State, makeSchema, createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// ============================================
// Events.synced() - For data that should sync
// ============================================
// Use for: All application data in LiveStore
const todoEvents = {
  todoAdded: Events.synced({
    name: 'todo.added',  // Globally unique event name
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      completed: Schema.Boolean,
      createdAt: Schema.Number
    })
  }),
  
  todoCompleted: Events.synced({
    name: 'todo.completed',
    schema: Schema.Struct({
      id: Schema.String,
      completedAt: Schema.Number
    })
  })
}

// Events require materializers to update the database
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false }),
    completedAt: State.SQLite.integer({ nullable: true })
  }
})

const materializers = State.SQLite.materializers(todoEvents, {
  'todo.added': (todo) => todos.insert({ ...todo, completedAt: null }),
  'todo.completed': ({ id, completedAt }) => 
    todos.update({ completed: true, completedAt }).where({ id })
})

// Create store to use events
const state = State.SQLite.makeState({ tables: { todos }, materializers })
const schema = makeSchema({ state, events: todoEvents })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'events-example'
})

// Commit events to make changes
store.commit(todoEvents.todoAdded({ 
  id: '1', 
  text: 'Buy milk', 
  completed: false, 
  createdAt: Date.now() 
}))

store.commit(todoEvents.todoCompleted({ 
  id: '1', 
  completedAt: Date.now() 
}))
```

### Subscription Patterns

Subscriptions are how you keep your UI in sync with the database:

```tsx
import { State, Schema, queryDb, makeSchema, createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Simple todos setup for examples
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false })
  }
})

const state = State.SQLite.makeState({ tables: { todos }, materializers: {} })
const schema = makeSchema({ state, events: {} })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'subscription-example'
})

const myQuery = queryDb(() => ({
  query: 'SELECT * FROM todos',
  bindValues: [] as const,
  schema: Schema.Array(todos.rowSchema)
}))

// ============================================
// Basic subscription
// ============================================
function updateUI(todos: readonly any[]) {
  console.log('Updating UI with', todos.length, 'todos')
}

const unsubscribe = store.subscribe(myQuery, {
  onUpdate: (result) => {
    // Called immediately with current value
    // Then called whenever the result changes
    updateUI(result)
  }
})

// ============================================
// Subscription options
// ============================================
const unsubscribe2 = store.subscribe(myQuery, {
  onUpdate: (result) => {
    console.log('Data updated:', result)
  },
  // Note: Error handling happens in the query itself
  // If a query fails, onUpdate won't be called
})

// ============================================
// Multiple subscriptions
// ============================================
// You can have many subscriptions to the same query
const todosQuery = myQuery

function updateTodoList(todos: readonly any[]) {
  console.log('List:', todos)
}

function updateTodoCount(todos: readonly any[]) {
  console.log('Count:', todos.length)
}

const sub1 = store.subscribe(todosQuery, { onUpdate: updateTodoList })
const sub2 = store.subscribe(todosQuery, { onUpdate: updateTodoCount })

// Each subscription is independent
sub1() // Only removes first subscription

// Clean up all subscriptions
sub2()
unsubscribe()
unsubscribe2()
```

### Working with Signals

Signals are reactive values that queries can depend on:

```tsx
import { signal, queryDb, Schema, State, makeSchema, createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Setup for signal examples
const items = State.SQLite.table({
  name: 'items',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ nullable: false }),
    category: State.SQLite.text({ nullable: false })
  }
})

const ItemSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  category: Schema.String
})

const state = State.SQLite.makeState({ tables: { items }, materializers: {} })
const schema = makeSchema({ state, events: {} })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'signals-example'
})

// ============================================
// Creating and using signals
// ============================================
// Signals hold reactive values
const searchTerm = signal('')
const sortOrder = signal<'asc' | 'desc'>('desc')
const currentPage = signal(1)

// Queries can read signals with get()
const searchResults = queryDb((get) => {
  const search = get(searchTerm)
  const order = get(sortOrder)
  const page = get(currentPage)
  
  const offset = (page - 1) * 10
  
  // Note: In real queries, be careful with string interpolation
  // This is safe here because 'order' is constrained to 'asc'|'desc'
  const orderClause = order === 'asc' ? 'ASC' : 'DESC'
  
  return {
    query: `
      SELECT * FROM items 
      WHERE name LIKE ? 
      ORDER BY name ${orderClause}
      LIMIT 10 OFFSET ?
    `,
    bindValues: [`%${search}%`, offset] as const,
    schema: Schema.Array(ItemSchema)
  }
})

// ============================================
// Updating signals
// ============================================
// Only use store.setSignal() to update signals
store.setSignal(searchTerm, 'apple')
store.setSignal(currentPage, 2)

// Never do this - it won't trigger reactivity!
// searchTerm.value = 'apple' // ❌ WRONG

// ============================================
// Signal best practices
// ============================================
// 1. Use signals for UI state (filters, search, pagination)
// 2. Use events/tables for application data
// 3. Keep signals simple - just hold values
// 4. Name signals clearly (whatItHolds, not generic names)
```

### Error Handling

LiveStore operations are generally safe, but you should handle schema validation errors:

```tsx
import { Schema, Events, State, makeSchema, createStorePromise, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Setup for error examples
const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean
})

const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false })
  }
})

const events = {
  todoAdded: Events.synced({
    name: 'todo.added',
    schema: TodoSchema
  })
}

const materializers = State.SQLite.materializers(events, {
  'todo.added': (todo) => todos.insert(todo)
})

const state = State.SQLite.makeState({ tables: { todos }, materializers })
const schema = makeSchema({ state, events })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'error-example'
})

// ============================================
// Schema validation errors
// ============================================
try {
  // This will throw if data doesn't match schema
  store.commit(events.todoAdded({
    id: 123, // ❌ Should be string!
    text: 'Invalid todo',
    completed: false
  } as any))
} catch (error) {
  console.error('Invalid event data:', error)
  // Show validation error to user
}

// ============================================
// Query errors
// ============================================
// Queries that reference non-existent tables will fail
// when the query is executed, not when it's defined
const problematicQuery = queryDb(() => ({
  query: 'SELECT * FROM non_existent_table',
  bindValues: [] as const,
  schema: Schema.Array(Schema.Unknown)
}))

// This will log an error to the console when the query fails
try {
  const result = store.query(problematicQuery)
  console.log('Result:', result)
} catch (error) {
  console.error('Query failed:', error)
  // Handle the error appropriately
}

// ============================================
// External data validation
// ============================================
function handleUserInput(data: unknown) {
  try {
    // Validate untrusted data before committing
    const validData = Schema.decodeUnknownSync(TodoSchema)(data)
    store.commit(events.todoAdded(validData))
    return { success: true }
  } catch (error) {
    // Schema validation failed
    return { error: 'Invalid todo data' }
  }
}
```

### SQL Template Tag

LiveStore provides a sql function for building SQL strings (note: it returns a string, not an object):

```tsx
import { sql, queryDb, Schema } from '@livestore/livestore'

// ============================================
// Using sql`` template literal
// ============================================
// The sql function builds SQL strings with placeholders
const userId = 'user-123'
const category = 'electronics'

// Note: sql returns a string with placeholders embedded
const query = sql`
  SELECT * FROM items 
  WHERE userId = ${userId} 
  AND category = ${category}
`
// Result: "SELECT * FROM items WHERE userId = 'user-123' AND category = 'electronics'"

// ============================================
// Use with queryDb - manual approach
// ============================================
// For parameterized queries, you typically write SQL manually
const itemsQuery = queryDb(() => {
  return {
    query: 'SELECT * FROM items WHERE userId = ? AND category = ?',
    bindValues: [userId, category] as const,
    schema: Schema.Array(Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      userId: Schema.String,
      category: Schema.String
    }))
  }
})

// The sql template is mainly useful for building complex dynamic queries
// For simple queries, prefer the manual approach shown above
```

### Best Practices

1. **Always unsubscribe**: Clean up subscriptions to prevent memory leaks
2. **Handle errors**: Especially for queries and external data
3. **Use Events.synced()**: All data changes go through synced events
4. **Validate external data**: Always validate before committing
5. **Keep queries simple**: Complex SQL is hard to maintain
6. **Use signals sparingly**: Only for truly reactive UI state

### Common Patterns

```tsx
import { signal, queryDb, Schema, Events, State, makeSchema, createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Complete setup for patterns
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false })
  }
})

const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean
})

const events = {
  todoCompleted: Events.synced({
    name: 'todo.completed',
    schema: Schema.Struct({ id: Schema.String })
  })
}

const materializers = State.SQLite.materializers(events, {
  'todo.completed': ({ id }) => todos.update({ completed: true }).where({ id })
})

const state = State.SQLite.makeState({ tables: { todos }, materializers })
const schema = makeSchema({ state, events })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'patterns-example'
})

// Pattern 1: Filter with signal
const showCompleted = signal(false)
const filteredTodos = queryDb((get) => ({
  query: get(showCompleted) 
    ? 'SELECT * FROM todos'
    : 'SELECT * FROM todos WHERE completed = 0',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))

// Pattern 2: Batch updates
const incompleteTodosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos WHERE completed = 0',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))

function markAllComplete() {
  const todos = store.query(incompleteTodosQuery)
  todos.forEach(todo => {
    store.commit(events.todoCompleted({ id: todo.id }))
  })
}

// Pattern 3: Conditional subscriptions
const isLoggedIn = true // Example condition

if (isLoggedIn) {
  const userDataQuery = filteredTodos // Reuse query for example
  const unsubscribe = store.subscribe(userDataQuery, { 
    onUpdate: (data) => console.log('User data:', data) 
  })
  // Remember to unsubscribe later!
}
```

### Next Steps

- Learn about @06-react-integration.md for using LiveStore with React hooks
- Explore @07-query-patterns.md for advanced query techniques
- Read about @08-mutation-patterns.md for complex data updates