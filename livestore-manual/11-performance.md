# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Performance Optimization

> **⚠️ Important: Premature Optimization Warning**
> 
> **Do NOT implement any of these performance optimizations until you have:**
> - Measured actual performance issues in your application
> - Identified specific bottlenecks through profiling
> - Confirmed that the performance issue impacts user experience
> 
> LiveStore is already optimized for most use cases. The patterns shown here should only be applied when you have concrete evidence they're needed. Premature optimization can make your code harder to maintain without providing real benefits.
>
> **Start with simple, readable code. Optimize only when measurements show it's necessary.**

### Query Optimization

```tsx
import React, { useMemo } from 'react'
import { State, Schema, makeSchema, createStorePromise, queryDb, signal } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Setup optimized tables
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    userId: State.SQLite.text({ nullable: false }),
    projectId: State.SQLite.text({ nullable: false }),
    priority: State.SQLite.integer({ nullable: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean,
  userId: Schema.String,
  projectId: Schema.String,
  priority: Schema.Number,
  createdAt: Schema.Number
})

const state = State.SQLite.makeState({ tables: { todos }, materializers: {} })
const schema = makeSchema({ state, events: {} })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'performance-example'
})

// ❌ Inefficient: Fetching all todos then filtering in JS
const inefficientQuery = queryDb(() => ({
  query: 'SELECT * FROM todos',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))

// ✅ Efficient: Filter in SQL with proper WHERE clause
const efficientUserTodos = queryDb(() => ({
  query: 'SELECT * FROM todos WHERE userId = ? ORDER BY createdAt DESC',
  bindValues: ['user-123'] as const,
  schema: Schema.Array(TodoSchema)
}))

// ✅ Even better: Only select needed columns
const todoSummaries = queryDb(() => ({
  query: 'SELECT id, text, completed FROM todos WHERE userId = ? ORDER BY createdAt DESC',
  bindValues: ['user-123'] as const,
  schema: Schema.Array(Schema.Struct({
    id: Schema.String,
    text: Schema.String,
    completed: Schema.Boolean
  }))
}))

// ✅ Use aggregation instead of fetching all rows
const todoStats = queryDb(() => ({
  query: `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
      COUNT(DISTINCT projectId) as projects
    FROM todos 
    WHERE userId = ?
  `,
  bindValues: ['user-123'] as const,
  schema: Schema.Array(Schema.Struct({
    total: Schema.Number,
    completed: Schema.Number,
    projects: Schema.Number
  }))
}))

// ✅ Limit results for large datasets
const recentTodos = queryDb(() => ({
  query: `
    SELECT * FROM todos 
    WHERE userId = ? 
    ORDER BY createdAt DESC 
    LIMIT 10
  `,
  bindValues: ['user-123'] as const,
  schema: Schema.Array(TodoSchema)
}))

// ✅ Use compound WHERE conditions for complex filtering
const activePriorityTodos = queryDb(() => ({
  query: `
    SELECT * FROM todos 
    WHERE userId = ? 
      AND completed = 0 
      AND priority >= ?
    ORDER BY priority DESC, createdAt DESC
  `,
  bindValues: ['user-123', 3] as const,
  schema: Schema.Array(TodoSchema)
}))
```

### Reactive Query Optimization

```tsx
import React, { useState, useMemo } from 'react'
import { State, Schema, makeSchema, createStorePromise, queryDb, signal } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Setup
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    userId: State.SQLite.text({ nullable: false }),
    projectId: State.SQLite.text({ nullable: false }),
    priority: State.SQLite.integer({ nullable: false })
  }
})

const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean,
  userId: Schema.String,
  projectId: Schema.String,
  priority: Schema.Number
})

const state = State.SQLite.makeState({ tables: { todos }, materializers: {} })
const schema = makeSchema({ state, events: {} })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'reactive-performance-example'
})

// Use signals for dynamic filtering
const filterStatus = signal<'all' | 'active' | 'completed'>('all')
const filterProject = signal<string | null>(null)
const sortBy = signal<'priority' | 'created'>('created')

// ✅ Optimized reactive query that only re-runs when signals change
const filteredTodos = queryDb((get) => {
  const status = get(filterStatus)
  const project = get(filterProject)
  const sort = get(sortBy)
  
  // Build dynamic query conditions
  const conditions: string[] = ['userId = ?']
  const bindValues: (string | number)[] = ['user-123']
  
  if (status !== 'all') {
    conditions.push('completed = ?')
    bindValues.push(status === 'completed' ? 1 : 0)
  }
  
  if (project) {
    conditions.push('projectId = ?')
    bindValues.push(project)
  }
  
  const orderBy = sort === 'priority' ? 'priority DESC' : 'createdAt DESC'
  
  return {
    query: `
      SELECT * FROM todos 
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT 100
    `,
    bindValues: bindValues as readonly (string | number)[],
    schema: Schema.Array(TodoSchema)
  }
})

// ✅ Separate queries for different data needs
const todoCount = queryDb((get) => {
  const status = get(filterStatus)
  const project = get(filterProject)
  
  const conditions: string[] = ['userId = ?']
  const bindValues: (string | number)[] = ['user-123']
  
  if (status !== 'all') {
    conditions.push('completed = ?')
    bindValues.push(status === 'completed' ? 1 : 0)
  }
  
  if (project) {
    conditions.push('projectId = ?')
    bindValues.push(project)
  }
  
  return {
    query: `SELECT COUNT(*) as count FROM todos WHERE ${conditions.join(' AND ')}`,
    bindValues: bindValues as readonly (string | number)[],
    schema: Schema.Array(Schema.Struct({ count: Schema.Number }))
  }
})

// Component using optimized queries
function OptimizedTodoList() {
  const todos = useQuery(filteredTodos)
  const countResult = useQuery(todoCount)
  const count = countResult.length > 0 ? countResult[0].count : 0
  
  // ✅ Update signals to trigger reactive queries
  const handleStatusChange = (status: 'all' | 'active' | 'completed') => {
    store.setSignal(filterStatus, status)
  }
  
  const handleProjectChange = (projectId: string | null) => {
    store.setSignal(filterProject, projectId)
  }
  
  const handleSortChange = (sort: 'priority' | 'created') => {
    store.setSignal(sortBy, sort)
  }
  
  return (
    <div>
      <div className="filters">
        <select onChange={(e) => handleStatusChange(e.target.value as any)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        
        <select onChange={(e) => handleProjectChange(e.target.value || null)}>
          <option value="">All Projects</option>
          <option value="project-1">Project 1</option>
          <option value="project-2">Project 2</option>
        </select>
        
        <select onChange={(e) => handleSortChange(e.target.value as any)}>
          <option value="created">Sort by Created</option>
          <option value="priority">Sort by Priority</option>
        </select>
      </div>
      
      <p>Showing {todos.length} of {count} todos</p>
      
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Component Optimization

```tsx
import React, { useMemo, useCallback } from 'react'
import { State, Schema, makeSchema, createStorePromise, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Setup
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    priority: State.SQLite.integer({ nullable: false })
  }
})

const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean,
  priority: Schema.Number
})

const state = State.SQLite.makeState({ tables: { todos }, materializers: {} })
const schema = makeSchema({ state, events: {} })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'component-optimization-example'
})

type Todo = Schema.Schema.Type<typeof TodoSchema>

// ✅ Memoize expensive query definitions
const todosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos ORDER BY priority DESC, text',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))

// ✅ Memoized component to prevent unnecessary re-renders
const TodoItem = React.memo(({ 
  todo, 
  onToggle 
}: { 
  todo: Todo
  onToggle: (id: string) => void 
}) => {
  // ✅ Memoize callback to prevent child re-renders
  const handleToggle = useCallback(() => {
    onToggle(todo.id)
  }, [todo.id, onToggle])
  
  return (
    <li className={`todo ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
      />
      <span>{todo.text}</span>
      <span className="priority">Priority: {todo.priority}</span>
    </li>
  )
})

// ✅ Split queries for different data needs
const highPriorityTodos = queryDb(() => ({
  query: 'SELECT * FROM todos WHERE priority >= 4 ORDER BY priority DESC',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))

const completedCount = queryDb(() => ({
  query: 'SELECT COUNT(*) as count FROM todos WHERE completed = 1',
  bindValues: [] as const,
  schema: Schema.Array(Schema.Struct({ count: Schema.Number }))
}))

// ✅ Optimized component with memoization
function OptimizedTodoApp() {
  const todos = useQuery(todosQuery)
  const urgentTodos = useQuery(highPriorityTodos)
  const completedResult = useQuery(completedCount)
  
  // ✅ Memoize expensive computations
  const todoStats = useMemo(() => {
    const total = todos.length
    const completed = completedResult.length > 0 ? completedResult[0].count : 0
    const active = total - completed
    const urgent = urgentTodos.length
    
    return { total, completed, active, urgent }
  }, [todos.length, completedResult, urgentTodos.length])
  
  // ✅ Memoize callback to prevent child re-renders
  const handleToggleTodo = useCallback((id: string) => {
    // Implementation would go here
    console.log('Toggle todo:', id)
  }, [])
  
  // ✅ Memoize filtered lists
  const activeTodos = useMemo(() => 
    todos.filter(todo => !todo.completed), 
    [todos]
  )
  
  const completedTodos = useMemo(() => 
    todos.filter(todo => todo.completed),
    [todos]
  )
  
  return (
    <div className="todo-app">
      {/* ✅ Stats component only re-renders when stats change */}
      <TodoStats stats={todoStats} />
      
      {/* ✅ Separate sections to minimize re-renders */}
      <section>
        <h2>Urgent Todos ({todoStats.urgent})</h2>
        <ul>
          {urgentTodos.map(todo => (
            <TodoItem 
              key={todo.id} 
              todo={todo} 
              onToggle={handleToggleTodo}
            />
          ))}
        </ul>
      </section>
      
      <section>
        <h2>Active Todos ({todoStats.active})</h2>
        <ul>
          {activeTodos.map(todo => (
            <TodoItem 
              key={todo.id} 
              todo={todo} 
              onToggle={handleToggleTodo}
            />
          ))}
        </ul>
      </section>
      
      <section>
        <h2>Completed Todos ({todoStats.completed})</h2>
        <ul>
          {completedTodos.map(todo => (
            <TodoItem 
              key={todo.id} 
              todo={todo} 
              onToggle={handleToggleTodo}
            />
          ))}
        </ul>
      </section>
    </div>
  )
}

// ✅ Memoized stats component
const TodoStats = React.memo(({ 
  stats 
}: { 
  stats: { total: number; completed: number; active: number; urgent: number } 
}) => (
  <div className="stats">
    <div>Total: {stats.total}</div>
    <div>Active: {stats.active}</div>
    <div>Completed: {stats.completed}</div>
    <div>Urgent: {stats.urgent}</div>
  </div>
))

// ✅ Example of lazy component pattern (without actual imports)
function TodoDetailView({ todoId }: { todoId: string }) {
  return React.createElement('div', null, `Todo details for ${todoId}`)
}

// ✅ Use React.lazy for large components (simulated)
const LazyDetailView = React.lazy(async () => {
  // Simulate module loading
  await new Promise(resolve => setTimeout(resolve, 100))
  return { default: TodoDetailView }
})

function AppWithLazyLoading() {
  const [selectedTodo, setSelectedTodo] = React.useState<string | null>(null)
  
  return (
    <div>
      <OptimizedTodoApp />
      
      {selectedTodo && (
        <React.Suspense fallback={<div>Loading details...</div>}>
          <LazyDetailView todoId={selectedTodo} />
        </React.Suspense>
      )}
    </div>
  )
}
```

### Large Dataset Strategies

```tsx
import React, { useState, useMemo } from 'react'
import { State, Schema, makeSchema, createStorePromise, queryDb, signal } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Setup for large datasets
const items = State.SQLite.table({
  name: 'items',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ nullable: false }),
    category: State.SQLite.text({ nullable: false }),
    value: State.SQLite.integer({ nullable: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

const ItemSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  category: Schema.String,
  value: Schema.Number,
  createdAt: Schema.Number
})

const state = State.SQLite.makeState({ tables: { items }, materializers: {} })
const schema = makeSchema({ state, events: {} })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'large-dataset-example'
})

// ✅ Pagination with LIMIT and OFFSET
const pageSize = 50
const currentPage = signal(1)

const paginatedItems = queryDb((get) => {
  const page = get(currentPage)
  const offset = (page - 1) * pageSize
  
  return {
    query: `
      SELECT * FROM items 
      ORDER BY createdAt DESC 
      LIMIT ? OFFSET ?
    `,
    bindValues: [pageSize, offset] as const,
    schema: Schema.Array(ItemSchema)
  }
})

const totalItemCount = queryDb(() => ({
  query: 'SELECT COUNT(*) as count FROM items',
  bindValues: [] as const,
  schema: Schema.Array(Schema.Struct({ count: Schema.Number }))
}))

// ✅ Search with debouncing
const searchTerm = signal('')

const searchResults = queryDb((get) => {
  const term = get(searchTerm).trim()
  
  if (!term) {
    return {
      query: 'SELECT * FROM items ORDER BY createdAt DESC LIMIT 20',
      bindValues: [] as const,
      schema: Schema.Array(ItemSchema)
    }
  }
  
  return {
    query: `
      SELECT * FROM items 
      WHERE name LIKE ? OR category LIKE ?
      ORDER BY 
        CASE 
          WHEN name = ? THEN 1
          WHEN name LIKE ? THEN 2
          ELSE 3
        END,
        createdAt DESC
      LIMIT 100
    `,
    bindValues: [
      `%${term}%`, 
      `%${term}%`, 
      term, 
      `${term}%`
    ] as const,
    schema: Schema.Array(ItemSchema)
  }
})

// ✅ Virtualized list component for large datasets
function VirtualizedItemList() {
  const items = useQuery(paginatedItems)
  const countResult = useQuery(totalItemCount)
  const totalCount = countResult.length > 0 ? countResult[0].count : 0
  const totalPages = Math.ceil(totalCount / pageSize)
  
  const [currentPageValue, setCurrentPageValue] = useState(1)
  
  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(totalPages, page))
    setCurrentPageValue(newPage)
    store.setSignal(currentPage, newPage)
  }
  
  return (
    <div className="virtualized-list">
      <div className="pagination-controls">
        <button 
          onClick={() => goToPage(currentPageValue - 1)}
          disabled={currentPageValue === 1}
        >
          Previous
        </button>
        
        <span>
          Page {currentPageValue} of {totalPages} ({totalCount} items)
        </span>
        
        <button 
          onClick={() => goToPage(currentPageValue + 1)}
          disabled={currentPageValue === totalPages}
        >
          Next
        </button>
      </div>
      
      <div className="items-list">
        {items.map((item) => (
          <div key={item.id} className="item">
            <h3>{item.name}</h3>
            <p>Category: {item.category}</p>
            <p>Value: {item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ✅ Debounced search component
function SearchableItemList() {
  const [inputValue, setInputValue] = useState('')
  const items = useQuery(searchResults)
  
  // ✅ Debounce search to avoid excessive queries
  React.useEffect(() => {
    const timer = setTimeout(() => {
      store.setSignal(searchTerm, inputValue)
    }, 300) // 300ms debounce
    
    return () => clearTimeout(timer)
  }, [inputValue])
  
  return (
    <div className="searchable-list">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Search items..."
        className="search-input"
      />
      
      <div className="search-results">
        {items.length === 0 ? (
          <p>No items found</p>
        ) : (
          <div>
            <p>Found {items.length} items</p>
            {items.map((item) => (
              <div key={item.id} className="item">
                <h4>{item.name}</h4>
                <span className="category">{item.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ✅ Category-based filtering with counts
const categoryFilter = signal<string | null>(null)

const categoryCounts = queryDb(() => ({
  query: `
    SELECT 
      category, 
      COUNT(*) as count 
    FROM items 
    GROUP BY category 
    ORDER BY count DESC
  `,
  bindValues: [] as const,
  schema: Schema.Array(Schema.Struct({
    category: Schema.String,
    count: Schema.Number
  }))
}))

const filteredByCategory = queryDb((get) => {
  const category = get(categoryFilter)
  
  if (!category) {
    return {
      query: 'SELECT * FROM items ORDER BY createdAt DESC LIMIT 100',
      bindValues: [] as const,
      schema: Schema.Array(ItemSchema)
    }
  }
  
  return {
    query: 'SELECT * FROM items WHERE category = ? ORDER BY createdAt DESC',
    bindValues: [category] as const,
    schema: Schema.Array(ItemSchema)
  }
})

function CategoryFilteredList() {
  const categories = useQuery(categoryCounts)
  const items = useQuery(filteredByCategory)
  
  const handleCategoryChange = (category: string | null) => {
    store.setSignal(categoryFilter, category)
  }
  
  return (
    <div className="category-filtered-list">
      <div className="category-filters">
        <button 
          onClick={() => handleCategoryChange(null)}
          className={categoryFilter === null ? 'active' : ''}
        >
          All Categories
        </button>
        
        {categories.map((cat) => (
          <button
            key={cat.category}
            onClick={() => handleCategoryChange(cat.category)}
          >
            {cat.category} ({cat.count})
          </button>
        ))}
      </div>
      
      <div className="filtered-items">
        {items.map((item) => (
          <div key={item.id} className="item">
            {item.name} - {item.category}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Best Practices

1. **Query Efficiently**
   - Use SQL WHERE clauses instead of filtering in JavaScript
   - Select only needed columns with specific SELECT statements
   - Use LIMIT to restrict result sizes
   - Use aggregation (COUNT, SUM) instead of fetching all rows

2. **Optimize React Components**
   - Use React.memo for expensive components
   - Memoize callbacks with useCallback
   - Memoize expensive computations with useMemo
   - Split queries to minimize unnecessary re-renders

3. **Handle Large Datasets**
   - Implement pagination with LIMIT/OFFSET
   - Use debounced search to reduce query frequency
   - Filter by category or status to reduce result sets
   - Consider lazy loading for large component trees

4. **LiveStore Patterns**
   - Use signals for dynamic query parameters
   - Split complex queries into smaller, focused ones
   - Leverage LiveStore's reactive system efficiently
   - Cache query definitions with useMemo

5. **Avoid Anti-patterns**
   - Don't fetch all data then filter in JavaScript
   - Don't create new query objects on every render
   - Don't subscribe to queries you don't actually use
   - Don't ignore the reactive nature of signals

### Next Steps

- Explore @13-migrations.md for schema performance considerations
- Read about @17-common-pitfalls.md to avoid performance mistakes