# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Query Patterns

### Dynamic Filtering

```tsx
import { State, Schema, signal, queryDb, makeSchema, createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Setup table
const issues = State.SQLite.table({
  name: 'issues',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    title: State.SQLite.text({ nullable: false }),
    description: State.SQLite.text({ nullable: false }),
    status: State.SQLite.text({ nullable: false }),
    priority: State.SQLite.text({ nullable: false }),
    assigneeId: State.SQLite.text({ nullable: true }),
    createdAt: State.SQLite.integer({ nullable: false }),
    deletedAt: State.SQLite.integer({ nullable: true })
  }
})

const IssueSchema = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  description: Schema.String,
  status: Schema.String,
  priority: Schema.String,
  assigneeId: Schema.optional(Schema.String),
  createdAt: Schema.Number,
  deletedAt: Schema.optional(Schema.Number)
})

const state = State.SQLite.makeState({ tables: { issues }, materializers: {} })
const schema = makeSchema({ state, events: {} })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'query-patterns-example'
})

// Filter state
const filters = {
  status: signal<'all' | 'active' | 'completed'>('all'),
  priority: signal<'all' | 'low' | 'medium' | 'high'>('all'),
  assignee: signal<string | null>(null),
  search: signal('')
}

// Dynamic query that responds to filter changes
const filteredIssues = queryDb((get) => {
  const status = get(filters.status)
  const priority = get(filters.priority)
  const assignee = get(filters.assignee)
  const search = get(filters.search)
  
  // Build WHERE conditions
  const conditions: string[] = ['deletedAt IS NULL']
  const bindValues: any[] = []
  
  if (status !== 'all') {
    conditions.push('status = ?')
    bindValues.push(status)
  }
  
  if (priority !== 'all') {
    conditions.push('priority = ?')
    bindValues.push(priority)
  }
  
  if (assignee) {
    conditions.push('assigneeId = ?')
    bindValues.push(assignee)
  }
  
  if (search.trim()) {
    conditions.push('(title LIKE ? OR description LIKE ?)')
    bindValues.push(`%${search}%`, `%${search}%`)
  }
  
  const whereClause = conditions.join(' AND ')
  
  return {
    query: `
      SELECT * FROM issues
      WHERE ${whereClause}
      ORDER BY createdAt DESC
    `,
    bindValues: bindValues,
    schema: Schema.Array(IssueSchema)
  }
})

// Update filters to trigger query re-execution
store.setSignal(filters.status, 'active')
store.setSignal(filters.search, 'bug')
```

### Pagination

```tsx
import React from 'react'
import { State, Schema, signal, queryDb, makeSchema, createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Setup
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    userId: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  userId: Schema.String,
  completed: Schema.Boolean,
  createdAt: Schema.Number
})

const state = State.SQLite.makeState({ tables: { todos }, materializers: {} })
const schema = makeSchema({ state, events: {} })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'pagination-example'
})

const currentUser = { id: 'user-123' }

// Pagination state
const pagination = {
  page: signal(1),
  pageSize: signal(20)
}

// Paginated query
const paginatedTodos = queryDb((get) => {
  const page = get(pagination.page)
  const pageSize = get(pagination.pageSize)
  const offset = (page - 1) * pageSize
  
  return {
    query: `
      SELECT * FROM todos
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `,
    bindValues: [currentUser.id, pageSize, offset] as const,
    schema: Schema.Array(TodoSchema)
  }
})

// Total count query for pagination info
const totalCount = queryDb(() => ({
  query: 'SELECT COUNT(*) as count FROM todos WHERE userId = ?',
  bindValues: [currentUser.id] as const,
  schema: Schema.Array(Schema.Struct({ count: Schema.Number }))
}))

type Todo = { id: string; text: string; userId: string; completed: boolean; createdAt: number }

// Simple todo list component
function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map((todo: Todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  )
}

// Pagination component
function PaginatedTodoList() {
  const todos = useQuery(paginatedTodos) as Todo[]
  const countResult = useQuery(totalCount) as { count: number }[]
  const total = countResult.length > 0 ? countResult[0].count : 0
  
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))
  }
  
  return (
    <div>
      <TodoList todos={todos} />
      <div className="pagination">
        <button 
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button 
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

### Full-Text Search

```tsx
import { State, Schema, signal, queryDb, makeSchema, createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Setup with search functionality
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    description: State.SQLite.text({ nullable: true }),
    completed: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  description: Schema.optional(Schema.String),
  completed: Schema.Boolean,
  createdAt: Schema.Number
})

const state = State.SQLite.makeState({ tables: { todos }, materializers: {} })
const schema = makeSchema({ state, events: {} })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'search-example'
})

// Search state
const searchTerm = signal('')

// Basic text search query (uses LIKE for simplicity)
const searchResults = queryDb((get) => {
  const query = get(searchTerm).trim()
  
  if (!query) {
    return {
      query: 'SELECT * FROM todos ORDER BY createdAt DESC',
      bindValues: [] as const,
      schema: Schema.Array(TodoSchema)
    }
  }
  
  return {
    query: `
      SELECT * FROM todos
      WHERE (text LIKE ? OR description LIKE ?)
      ORDER BY 
        CASE 
          WHEN text LIKE ? THEN 1  -- Exact title matches rank higher
          WHEN text LIKE ? THEN 2  -- Title contains query
          ELSE 3                    -- Description matches
        END,
        createdAt DESC
    `,
    bindValues: [
      `%${query}%`,
      `%${query}%`,
      query,
      `%${query}%`
    ] as const,
    schema: Schema.Array(TodoSchema)
  }
})

// Advanced search with multiple terms
const advancedSearch = queryDb((get) => {
  const query = get(searchTerm).trim()
  
  if (!query) {
    return {
      query: 'SELECT * FROM todos ORDER BY createdAt DESC LIMIT 50',
      bindValues: [] as const,
      schema: Schema.Array(TodoSchema)
    }
  }
  
  // Split search into terms
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  
  if (terms.length === 1) {
    const term = terms[0]
    return {
      query: `
        SELECT * FROM todos
        WHERE (LOWER(text) LIKE ? OR LOWER(description) LIKE ?)
        ORDER BY createdAt DESC
      `,
      bindValues: [`%${term}%`, `%${term}%`] as const,
      schema: Schema.Array(TodoSchema)
    }
  }
  
  // Multiple terms - all must match
  const conditions = terms.map(() => '(LOWER(text) LIKE ? OR LOWER(description) LIKE ?)').join(' AND ')
  const bindValues = terms.flatMap(term => [`%${term}%`, `%${term}%`])
  
  return {
    query: `
      SELECT * FROM todos
      WHERE ${conditions}
      ORDER BY createdAt DESC
    `,
    bindValues: bindValues,
    schema: Schema.Array(TodoSchema)
  }
})

// Update search term
store.setSignal(searchTerm, 'important task')
```

### Aggregations & Analytics

```tsx
import { State, Schema, queryDb, makeSchema, createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Setup tables for analytics
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    userId: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false }),
    completedAt: State.SQLite.integer({ nullable: true })
  }
})

const users = State.SQLite.table({
  name: 'users',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ nullable: false })
  }
})

const state = State.SQLite.makeState({ tables: { todos, users }, materializers: {} })
const schema = makeSchema({ state, events: {} })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'analytics-example'
})

// Summary statistics
const summaryStats = queryDb(() => {
  const thirtyDaysAgo = Date.now() - 30 * 86400000
  
  return {
    query: `
      SELECT 
        COUNT(DISTINCT userId) as totalUsers,
        COUNT(*) as totalTodos,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completedTodos,
        AVG(CASE 
          WHEN completed = 1 AND completedAt IS NOT NULL 
          THEN completedAt - createdAt 
          ELSE NULL 
        END) as avgCompletionTime
      FROM todos
      WHERE createdAt > ?
    `,
    bindValues: [thirtyDaysAgo] as const,
    schema: Schema.Array(Schema.Struct({
      totalUsers: Schema.Number,
      totalTodos: Schema.Number,
      completedTodos: Schema.Number,
      avgCompletionTime: Schema.Union(Schema.Number, Schema.Null)
    }))
  }
})

// Daily todo creation timeline
const dailyTimeline = queryDb(() => {
  const sevenDaysAgo = Date.now() - 7 * 86400000
  
  return {
    query: `
      SELECT 
        DATE(createdAt / 1000, 'unixepoch') as date,
        COUNT(*) as count,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
      FROM todos
      WHERE createdAt > ?
      GROUP BY DATE(createdAt / 1000, 'unixepoch')
      ORDER BY date
    `,
    bindValues: [sevenDaysAgo] as const,
    schema: Schema.Array(Schema.Struct({
      date: Schema.String,
      count: Schema.Number,
      completed: Schema.Number
    }))
  }
})

// Top users by completion
const topUsers = queryDb(() => ({
  query: `
    SELECT 
      u.id,
      u.name,
      COUNT(t.id) as todoCount,
      SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) as completedCount,
      CASE 
        WHEN COUNT(t.id) > 0 
        THEN CAST(SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(t.id)
        ELSE 0
      END as completionRate
    FROM users u
    LEFT JOIN todos t ON u.id = t.userId
    GROUP BY u.id, u.name
    HAVING COUNT(t.id) > 0
    ORDER BY completedCount DESC, completionRate DESC
    LIMIT 10
  `,
  bindValues: [] as const,
  schema: Schema.Array(Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    todoCount: Schema.Number,
    completedCount: Schema.Number,
    completionRate: Schema.Number
  }))
}))

// Combined dashboard data
const dashboardData = queryDb(() => {
  // Get current results from other queries
  const summary = store.query(summaryStats)
  const timeline = store.query(dailyTimeline)
  const leaderboard = store.query(topUsers)
  
  return {
    query: 'SELECT 1 as dummy', // Dummy query since we're combining results
    bindValues: [] as const,
    schema: Schema.Array(Schema.Struct({
      summary: Schema.Unknown,
      timeline: Schema.Unknown,
      leaderboard: Schema.Unknown
    }))
  }
})

// Usage examples:
const stats = store.query(summaryStats)
const timeline = store.query(dailyTimeline)
const leaders = store.query(topUsers)
```
