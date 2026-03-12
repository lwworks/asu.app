# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## React Integration

LiveStore provides React hooks for seamless integration with React applications.

### Basic Setup

```tsx
import React from 'react'
import { State, Events, Schema, makeSchema, createStorePromise, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Define your LiveStore schema (same as before)
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean,
  createdAt: Schema.Number
})

const events = {
  todoAdded: Events.synced({
    name: 'todo.added',
    schema: TodoSchema
  }),
  todoToggled: Events.synced({
    name: 'todo.toggled',
    schema: Schema.Struct({
      id: Schema.String,
      completed: Schema.Boolean
    })
  })
}

const materializers = State.SQLite.materializers(events, {
  'todo.added': (todo) => todos.insert(todo),
  'todo.toggled': ({ id, completed }) => 
    todos.update({ completed }).where({ id })
})

const state = State.SQLite.makeState({ tables: { todos }, materializers })
const schema = makeSchema({ state, events })

// Create store globally (in real apps, you'd do this in your app setup)
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'react-example'
})

// Define queries
const todosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos ORDER BY createdAt DESC',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))

const completedTodosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos WHERE completed = 1 ORDER BY createdAt DESC',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))
```

### Using useQuery Hook

The `useQuery` hook subscribes to LiveStore queries and automatically re-renders when data changes:

```tsx
import React from 'react'
import { State, Events, Schema, makeSchema, createStorePromise, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Setup - normally done once in your app
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
  todoToggled: Events.synced({
    name: 'todo.toggled',
    schema: Schema.Struct({
      id: Schema.String,
      completed: Schema.Boolean
    })
  })
}

const materializers = State.SQLite.materializers(events, {
  'todo.toggled': ({ id, completed }) => 
    todos.update({ completed }).where({ id })
})

const state = State.SQLite.makeState({ tables: { todos }, materializers })
const schema = makeSchema({ state, events })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'react-example'
})

const todosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos ORDER BY id',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))

const completedTodosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos WHERE completed = 1 ORDER BY id',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))

// TodoList component using useQuery
function TodoList() {
  // useQuery automatically subscribes to the query and handles updates
  const todos = useQuery(todosQuery)
  
  return (
    <div>
      <h2>All Todos ({todos.length})</h2>
      <ul>
        {todos.map((todo: { id: string; text: string; completed: boolean }) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Function to toggle todo
function toggleTodo(id: string) {
  const todos = store.query(todosQuery)
  const todo = todos.find((t: { id: string; completed: boolean }) => t.id === id)
  if (todo) {
    store.commit(events.todoToggled({
      id,
      completed: !todo.completed
    }))
  }
}

// Multiple queries in one component
function TodoStats() {
  const allTodos = useQuery(todosQuery)
  const completedTodos = useQuery(completedTodosQuery)
  
  const activeCount = allTodos.length - completedTodos.length
  
  return (
    <div>
      <p>Total: {allTodos.length}</p>
      <p>Active: {activeCount}</p>
      <p>Completed: {completedTodos.length}</p>
    </div>
  )
}
```

### Working with Signals and Reactive Queries

```tsx
import React from 'react'
import { State, Events, Schema, makeSchema, createStorePromise, queryDb, signal } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Setup
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean,
  createdAt: Schema.Number
})

const events = {
  todoToggled: Events.synced({
    name: 'todo.toggled',
    schema: Schema.Struct({
      id: Schema.String,
      completed: Schema.Boolean
    })
  })
}

const materializers = State.SQLite.materializers(events, {
  'todo.toggled': ({ id, completed }) => 
    todos.update({ completed }).where({ id })
})

const state = State.SQLite.makeState({ tables: { todos }, materializers })
const schema = makeSchema({ state, events })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'react-signals-example'
})

// Create a signal for filtering
const showCompleted = signal(false)

// Reactive query that depends on the signal
const filteredTodosQuery = queryDb((get) => {
  const includeCompleted = get(showCompleted)
  
  return {
    query: includeCompleted 
      ? 'SELECT * FROM todos ORDER BY createdAt DESC'
      : 'SELECT * FROM todos WHERE completed = 0 ORDER BY createdAt DESC',
    bindValues: [] as const,
    schema: Schema.Array(TodoSchema)
  }
})

function toggleTodo(id: string) {
  const todos = store.query(filteredTodosQuery)
  const todo = todos.find((t: { id: string; completed: boolean }) => t.id === id)
  if (todo) {
    store.commit(events.todoToggled({
      id,
      completed: !todo.completed
    }))
  }
}

// Component that uses reactive queries
function FilterableTodoList() {
  const todos = useQuery(filteredTodosQuery)
  
  const handleFilterChange = (showCompletedTodos: boolean) => {
    store.setSignal(showCompleted, showCompletedTodos)
  }
  
  return (
    <div>
      <div>
        <label>
          <input
            type="checkbox"
            onChange={(e) => handleFilterChange(e.target.checked)}
          />
          Show completed todos
        </label>
      </div>
      
      <ul>
        {todos.map((todo: { id: string; text: string; completed: boolean }) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ 
              textDecoration: todo.completed ? 'line-through' : 'none' 
            }}>
              {todo.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Adding New Data

```tsx
import React, { useState } from 'react'
import { State, Events, Schema, makeSchema, createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Setup
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean,
  createdAt: Schema.Number
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
  storeId: 'react-forms-example'
})

// Form component for adding todos
function AddTodoForm() {
  const [text, setText] = useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!text.trim()) return
    
    // Commit new todo event
    store.commit(events.todoAdded({
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now()
    }))
    
    // Clear the form
    setText('')
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
      />
      <button type="submit">Add Todo</button>
    </form>
  )
}

// Placeholder components for complete app example
function TodoStats() {
  return <div>Todo stats would go here</div>
}

function FilterableTodoList() {
  return <div>Todo list would go here</div>
}

// Complete todo app
function TodoApp() {
  return (
    <div>
      <h1>Todo App</h1>
      <AddTodoForm />
      <TodoStats />
      <FilterableTodoList />
    </div>
  )
}
```

### Custom Hooks Pattern

Create reusable hooks that encapsulate LiveStore logic:

```tsx
import React, { useCallback } from 'react'
import { State, Events, Schema, makeSchema, createStorePromise, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Setup
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean,
  createdAt: Schema.Number
})

const events = {
  todoAdded: Events.synced({
    name: 'todo.added',
    schema: TodoSchema
  }),
  todoToggled: Events.synced({
    name: 'todo.toggled',
    schema: Schema.Struct({
      id: Schema.String,
      completed: Schema.Boolean
    })
  })
}

const materializers = State.SQLite.materializers(events, {
  'todo.added': (todo) => todos.insert(todo),
  'todo.toggled': ({ id, completed }) => 
    todos.update({ completed }).where({ id })
})

const state = State.SQLite.makeState({ tables: { todos }, materializers })
const schema = makeSchema({ state, events })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'react-hooks-example'
})

const todosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos ORDER BY createdAt DESC',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))

type Todo = { id: string; text: string; completed: boolean; createdAt: number }

// Custom hook for todo management
function useTodos() {
  // Get current todos
  const todos = useQuery(todosQuery) as Todo[]
  
  // Helper functions
  const addTodo = useCallback((text: string) => {
    store.commit(events.todoAdded({
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now()
    }))
  }, [])
  
  const toggleTodo = useCallback((id: string) => {
    const todo = todos.find((t: Todo) => t.id === id)
    if (todo) {
      store.commit(events.todoToggled({
        id,
        completed: !todo.completed
      }))
    }
  }, [todos])
  
  const getStats = useCallback(() => {
    const completed = todos.filter((t: Todo) => t.completed).length
    const active = todos.length - completed
    return { total: todos.length, active, completed }
  }, [todos])
  
  return {
    todos,
    addTodo,
    toggleTodo,
    stats: getStats()
  }
}

// Component using the custom hook
function TodoListWithHook() {
  const { todos, addTodo, toggleTodo, stats } = useTodos()
  const [newTodoText, setNewTodoText] = React.useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTodoText.trim()) {
      addTodo(newTodoText)
      setNewTodoText('')
    }
  }
  
  return (
    <div>
      <h2>Todo List</h2>
      <p>{stats.active} active, {stats.completed} completed</p>
      
      <form onSubmit={handleSubmit}>
        <input
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a todo..."
        />
        <button type="submit">Add</button>
      </form>
      
      <ul>
        {todos.map((todo: Todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Advanced Patterns

```tsx
import React, { useEffect, useMemo, useCallback } from 'react'
import { State, Events, Schema, makeSchema, createStorePromise, queryDb, signal } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Setup
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean,
  createdAt: Schema.Number
})

const state = State.SQLite.makeState({ tables: { todos }, materializers: {} })
const schema = makeSchema({ state, events: {} })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'react-advanced-example'
})

type Todo = { id: string; text: string; completed: boolean; createdAt: number }

// Search functionality
const searchTerm = signal('')

const searchQuery = queryDb((get) => {
  const search = get(searchTerm)
  
  if (!search) {
    return {
      query: 'SELECT * FROM todos ORDER BY createdAt DESC',
      bindValues: [] as const,
      schema: Schema.Array(TodoSchema)
    }
  }
  
  return {
    query: 'SELECT * FROM todos WHERE text LIKE ? ORDER BY createdAt DESC',
    bindValues: [`%${search}%`] as const,
    schema: Schema.Array(TodoSchema)
  }
})

const todosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos ORDER BY createdAt DESC',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))

function SearchableTodoList() {
  const todos = useQuery(searchQuery) as Todo[]
  const [search, setSearch] = React.useState('')
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      store.setSignal(searchTerm, search)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search])
  
  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search todos..."
      />
      
      <ul>
        {todos.map((todo: Todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  )
}

// Optimistic updates pattern
function OptimisticTodoList() {
  const todos = useQuery(todosQuery) as Todo[]
  const [pendingTodos, setPendingTodos] = React.useState<string[]>([])
  
  const displayTodos = useMemo(() => {
    return todos.filter((todo: Todo) => !pendingTodos.includes(todo.id))
  }, [todos, pendingTodos])
  
  const deleteTodo = useCallback(async (id: string) => {
    // Optimistically hide the todo
    setPendingTodos(prev => [...prev, id])
    
    try {
      // In a real app, you'd have a delete event and materializer
      // For this example, we'll simulate it
      console.log('Deleting todo:', id)
      
      // Remove from pending after "success"
      setTimeout(() => {
        setPendingTodos(prev => prev.filter(pid => pid !== id))
      }, 1000)
    } catch (error) {
      // On error, show the todo again
      setPendingTodos(prev => prev.filter(pid => pid !== id))
      console.error('Failed to delete todo:', error)
    }
  }, [])
  
  return (
    <ul>
      {displayTodos.map((todo: Todo) => (
        <li key={todo.id}>
          {todo.text}
          <button onClick={() => deleteTodo(todo.id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
```

### Best Practices

1. **Use useQuery for data fetching**: It automatically handles subscriptions and cleanup
2. **Create custom hooks**: Encapsulate related LiveStore operations  
3. **Keep components simple**: Move LiveStore logic to custom hooks
4. **Use signals for UI state**: Search, filters, pagination, etc.
5. **Batch related operations**: Group related store.commit() calls when possible
6. **Handle loading states**: Use React state for pending operations

### Common Patterns

```tsx
import React from 'react'
import { State, Events, Schema, makeSchema, createStorePromise, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Setup
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean,
  createdAt: Schema.Number
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
  storeId: 'react-patterns-example'
})

const todosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos ORDER BY createdAt DESC',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))

const completedTodosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos WHERE completed = 1 ORDER BY createdAt DESC',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))

type Todo = { id: string; text: string; completed: boolean; createdAt: number }

// Pattern 1: Loading states with React state
function TodoListWithLoading() {
  const todos = useQuery(todosQuery) as Todo[]
  const [isLoading, setIsLoading] = React.useState(false)
  
  const addTodo = async (text: string) => {
    setIsLoading(true)
    try {
      store.commit(events.todoAdded({
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: Date.now()
      }))
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div>
      <button disabled={isLoading} onClick={() => addTodo('New todo')}>
        {isLoading ? 'Adding...' : 'Add Todo'}
      </button>
      <ul>
        {todos.map((todo: Todo) => <li key={todo.id}>{todo.text}</li>)}
      </ul>
    </div>
  )
}

// Pattern 2: Conditional queries
function ConditionalTodoList({ showCompleted }: { showCompleted: boolean }) {
  const query = showCompleted ? todosQuery : completedTodosQuery
  const todos = useQuery(query) as Todo[]
  
  return (
    <ul>
      {todos.map((todo: Todo) => <li key={todo.id}>{todo.text}</li>)}
    </ul>
  )
}
```

### Next Steps

- Learn about @07-query-patterns.md for advanced querying techniques
- Explore @08-mutation-patterns.md for complex data operations  
- Read about @09-testing.md to test your React + LiveStore components