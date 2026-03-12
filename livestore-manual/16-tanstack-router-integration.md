# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## TanStack Router Integration

LiveStore works seamlessly with TanStack Router, providing type-safe routing with reactive data loading. This guide shows best practices for integrating these powerful tools.

### Setup & Installation

Install both LiveStore and TanStack Router:

```bash
npm install @livestore/livestore @livestore/react @tanstack/react-router
```

### Basic Router Setup with LiveStore

Set up your router with LiveStore provider at the root:

```tsx
// __root.tsx
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { LiveStoreProvider } from '@livestore/react'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { State, Events, Schema, makeSchema } from '@livestore/livestore'

// Define your schema
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
      text: Schema.String
    })
  })
}

const materializers = State.SQLite.materializers(events, {
  'todo.added': (todo) => todos.insert(todo)
})

const state = State.SQLite.makeState({ tables: { todos }, materializers })
const schema = makeSchema({ state, events })

// Create adapter
const adapter = makeInMemoryAdapter()

// Create root route with LiveStore provider
export const Route = createRootRoute({
  component: () => (
    <LiveStoreProvider
      schema={schema}
      storeId="my-app"
      adapter={adapter}
      batchUpdates={batchUpdates}
    >
      <div className="app">
        <nav>
          {/* Navigation links */}
        </nav>
        <main>
          <Outlet />
        </main>
      </div>
    </LiveStoreProvider>
  )
})
```

### Route-Based Data Loading

LiveStore queries integrate naturally with TanStack Router's route parameters:

```tsx
// posts/$postId.tsx
import { State, queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React from 'react'

// Define schema tables
const posts = State.SQLite.table({
  name: 'posts',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    title: State.SQLite.text({ nullable: false }),
    content: State.SQLite.text({ nullable: false }),
    authorId: State.SQLite.text({ nullable: false }),
    published: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

function PostDetail() {
  // Get route params (from TanStack Router)
  const postId = 'post-123' // In real app: Route.useParams().postId
  const { store } = useStore()
  
  // Create reactive query for post data  
  const postQuery = React.useMemo(
    () => queryDb(
      () => posts
        .where({ id: postId, published: true })
        .limit(1),
      { label: `post-${postId}`, deps: [postId] }
    ),
    [postId]
  )
  
  const postResult = store.useQuery(postQuery)
  const post = postResult[0]
  
  if (!post) {
    return <div>Post not found</div>
  }
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>Created: {new Date(post.createdAt).toLocaleDateString()}</p>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}

// Export route configuration
// export const Route = createFileRoute('/posts/$postId')({
//   component: PostDetail
// })
```

### Search with URL State Sync

Synchronize search parameters with URL state for shareable searches:

```tsx
// products.tsx
import { State, queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React from 'react'

// Define products table
const products = State.SQLite.table({
  name: 'products',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ nullable: false }),
    description: State.SQLite.text({ nullable: false }),
    price: State.SQLite.real({ nullable: false }),
    category: State.SQLite.text({ nullable: false }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

function ProductSearch() {
  // Get search params (from TanStack Router)
  const [searchParams, setSearchParams] = React.useState({
    q: '',
    category: ''
  })
  
  const { store } = useStore()
  
  // Build reactive query based on search params
  const productsQuery = React.useMemo(
    () => queryDb(() => {
      let query = products.select()
      
      if (searchParams.q) {
        // Note: Use proper parameterization in production
        // For demo - in real app use parameterized queries
        query = products.select() // Would filter by searchParams.q
      }
      
      if (searchParams.category) {
        query = query.where({ category: searchParams.category })
      }
      
      return query // Order by createdAt DESC
    }, { label: `products-${searchParams.q}-${searchParams.category}`, deps: [searchParams.q, searchParams.category] }),
    [searchParams.q, searchParams.category]
  )
  
  const searchResults = store.useQuery(productsQuery)
  
  return (
    <div className="product-search">
      <div className="search-controls">
        <input
          type="search"
          placeholder="Search products..."
          value={searchParams.q}
          onChange={(e) => setSearchParams(prev => ({ ...prev, q: e.target.value }))}
        />
        
        <select 
          value={searchParams.category} 
          onChange={(e) => setSearchParams(prev => ({ ...prev, category: e.target.value }))}
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="books">Books</option>
        </select>
      </div>
      
      <div className="search-results">
        <p>Found {searchResults.length} products</p>
        <div className="product-grid">
          {searchResults.map((product: any) => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p>${product.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Protected Routes with Authentication

Implement authentication with route guards:

```tsx
// dashboard.tsx
import { State, Events, Schema, queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React from 'react'

// Define sessions table  
const sessions = State.SQLite.table({
  name: 'sessions',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    userId: State.SQLite.text({ nullable: false }),
    active: State.SQLite.boolean({ default: true }),
    expiresAt: State.SQLite.integer({ nullable: false })
  }
})

// Auth check query
const activeSessionQuery = queryDb(
  () => sessions
    .where({ active: true })
    .limit(1),
  { label: 'active-session', deps: [] }
)

// Define session ended event
const sessionEndedEvent = Events.synced({
  name: 'session.ended',
  schema: Schema.Struct({ sessionId: Schema.String })
})

function Dashboard() {
  const { store } = useStore()
  
  // Get current session
  const sessions = store.useQuery(activeSessionQuery)
  const currentSession = sessions[0]
  
  if (!currentSession) {
    return <div>No active session</div>
  }
  
  const handleLogout = () => {
    // Update session to inactive
    store.commit(sessionEndedEvent({ sessionId: currentSession.id }))
  }
  
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Session ID: {currentSession.id}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

// Route configuration with auth check
// export const Route = createFileRoute('/dashboard')({
//   beforeLoad: async ({ context }) => {
//     // Check auth and redirect if needed
//   },
//   component: Dashboard
// })
```

### Optimistic Navigation

Implement instant navigation with local events:

```tsx
// articles/$articleId.tsx
import { Events, Schema } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React from 'react'

// Define event for page views (would be local-only in real app)
const pageViewEvent = Events.synced({
  name: 'page.viewed',
  schema: Schema.Struct({
    pageId: Schema.String,
    timestamp: Schema.Number
  })
})

function Article() {
  // Get route params
  const articleId = 'article-123' // In real app: from route params
  const { store } = useStore()
  
  // Track page view
  React.useEffect(() => {
    store.commit(pageViewEvent({ 
      pageId: articleId, 
      timestamp: Date.now() 
    }))
  }, [articleId, store])
  
  // Navigate to related article
  const navigateToRelated = (relatedId: string) => {
    // Commit optimistic event before navigation
    store.commit(pageViewEvent({ 
      pageId: relatedId, 
      timestamp: Date.now() 
    }))
    
    // Then navigate (using TanStack Router's navigate)
    // navigate({ to: '/articles/$articleId', params: { articleId: relatedId } })
  }
  
  return (
    <article>
      <h1>Article {articleId}</h1>
      <button onClick={() => navigateToRelated('next-article')}>
        Next Article
      </button>
    </article>
  )
}
```

### Layout Routes

Create layout routes for shared UI and data loading:

```tsx
// dashboard/_layout.tsx
import { State, queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React from 'react'

// Define todos table for stats
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false })
  }
})

// Dashboard stats query - get counts
const totalCountQuery = queryDb(
  () => todos.select(),
  { label: 'todos-count', deps: [] }
)

const completedCountQuery = queryDb(
  () => todos.where({ completed: true }),
  { label: 'todos-completed', deps: [] }
)

function DashboardLayout() {
  const { store } = useStore()
  const allTodos = store.useQuery(totalCountQuery)
  const completedTodos = store.useQuery(completedCountQuery)
  
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h2>Dashboard</h2>
        <nav>
          <a href="/dashboard">Overview</a>
          <a href="/dashboard/settings">Settings</a>
        </nav>
        <div className="stats">
          <p>Total: {allTodos.length}</p>
          <p>Completed: {completedTodos.length}</p>
        </div>
      </aside>
      <main>
        {/* Child routes render here */}
      </main>
    </div>
  )
}
```

### File-Based Routes Organization

Organize routes using TanStack Router's file-based routing:

```
src/
  routes/
    __root.tsx          # Root layout with LiveStore provider
    index.tsx           # Home page
    posts/
      index.tsx         # Posts list
      $postId.tsx       # Post detail
      new.tsx           # Create post
    dashboard/
      _layout.tsx       # Dashboard layout
      index.tsx         # Dashboard home
      settings.tsx      # User settings
    login.tsx           # Login page
```

### Navigation Tracking

You can track navigation state in LiveStore for analytics or state management:

```tsx
import React from 'react'
import { Events, Schema } from '@livestore/livestore'
import { useStore } from '@livestore/react'

// Define navigation event
const navigationEvent = Events.clientOnly({
  name: 'navigation.changed',
  schema: Schema.Struct({
    pathname: Schema.String,
    search: Schema.String,
    navigatedAt: Schema.Number
  })
})

// Track navigation in route component
function MyRoute() {
  const { store } = useStore()
  // In real app: const router = useRouter()
  
  React.useEffect(() => {
    // Track navigation changes
    store.commit(navigationEvent({
      pathname: '/current-path',
      search: '?param=value',
      navigatedAt: Date.now()
    }))
  }, [store])
  
  return React.createElement('div', null, 'Route content...')
}
```

### Filter State in LiveStore

For complex filtering, store filter state in LiveStore client documents rather than URL params:

```tsx
import React from 'react'
import { State, Schema, queryDb } from '@livestore/livestore'
import { useStore } from '@livestore/react'

// Define filter state schema
const FilterState = Schema.Struct({
  orderBy: Schema.Literal('created', 'modified', 'priority'),
  orderDirection: Schema.Literal('asc', 'desc'),
  status: Schema.Union(Schema.Array(Schema.String), Schema.Null),
  query: Schema.Union(Schema.String, Schema.Null)
})

// Define items table for example
const items = State.SQLite.table({
  name: 'items',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    title: State.SQLite.text({ nullable: false }),
    status: State.SQLite.text({ nullable: false }),
    created: State.SQLite.integer({ nullable: false }),
    modified: State.SQLite.integer({ nullable: false }),
    priority: State.SQLite.integer({ nullable: false })
  }
})

// Use in component
function SearchPage() {
  const { store } = useStore()
  const [filters, setFilters] = React.useState({
    orderBy: 'created' as const,
    orderDirection: 'desc' as const,
    status: null as string[] | null,
    query: null as string | null
  })
  
  // Build query based on filters
  const searchQuery = React.useMemo(
    () => queryDb(() => ({
      query: `
        SELECT * FROM items 
        ${filters.status ? 'WHERE status = ?' : ''}
        ORDER BY ${filters.orderBy} ${filters.orderDirection}
      `,
      bindValues: filters.status ? [filters.status[0]] : [] as const,
      schema: Schema.Array(Schema.Struct({
        id: Schema.String,
        title: Schema.String,
        status: Schema.String,
        created: Schema.Number,
        modified: Schema.Number,
        priority: Schema.Number
      }))
    }), { label: 'filtered-search', deps: [filters.orderBy, filters.orderDirection, filters.status?.[0] ?? null, filters.query] }),
    [filters.orderBy, filters.orderDirection, filters.status, filters.query]
  )
  
  const results = store.useQuery(searchQuery)
  
  // Type the results array
  type Item = {
    id: string
    title: string
    status: string
    created: number
    modified: number
    priority: number
  }
  
  return React.createElement('div', null,
    React.createElement('div', { className: 'search-filters' },
      React.createElement('input', {
        type: 'text',
        placeholder: 'Search...',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
          setFilters(prev => ({ ...prev, query: e.target.value }))
      })
    ),
    React.createElement('div', { className: 'search-results' },
      (results as Item[]).map((item: Item) => 
        React.createElement('div', { key: item.id }, item.title)
      )
    )
  )
}
```

### Best Practices

1. **Query Dependencies**: Always include `deps` array for queries that depend on route params or state
2. **Type-Safe Params**: Use TanStack Router's type-safe params
3. **Filter State**: Store complex filters in LiveStore client documents, not URL params
4. **Layout Routes**: Use layout routes for shared UI and queries
5. **Navigation Tracking**: Track navigation events for analytics or state management

### Performance Tips

- Use route-based code splitting with React.lazy
- Preload data in route loaders when possible
- Batch related queries to reduce re-renders
- Use LiveStore's reactive queries for automatic updates

### Integration Patterns

#### Route Parameters in Queries

When using route parameters, memoize queries to prevent unnecessary re-execution:

```tsx
import React from 'react'
import { queryDb, State } from '@livestore/livestore'

// Define posts table
const posts = State.SQLite.table({
  name: 'posts',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    title: State.SQLite.text({ nullable: false })
  }
})

// Example pattern for route params
const postId = "post-123" // From route params
const postQuery = React.useMemo(
  () => queryDb(() => posts.where({ id: postId }), { deps: [postId] }),
  [postId]
)
```

#### Search State Synchronization

Keep search state in URL for shareable links by syncing with TanStack Router's search params.

#### Protected Route Pattern

Use beforeLoad hooks in route configuration to check authentication before rendering components.

### Common Gotchas

1. **Forgetting to memoize queries** - Always memoize queries that use route params
2. **Not handling loading states** - LiveStore queries are synchronous but initial data might not be ready
3. **Mixing navigation and state updates** - Commit events before navigating for better UX
4. **Not using layout routes** - Share queries and UI with layout routes

### Next Steps

- Learn about @17-common-pitfalls.md
- See @19-real-world-examples.md