# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Common Pitfalls & Solutions

### 1. Query Creation Without Labels and Dependencies

**❌ Bad:**
```tsx
import { queryDb, State } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React from 'react'

// Define todos table
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    userId: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false })
  }
})

function TodoList({ userId }: { userId: string }) {
  const { store } = useStore()
  
  // Creates new query on every render! No label for debugging!
  const userTodos = store.useQuery(
    queryDb(() => todos.where({ userId }))
  )
  
  return (
    <div>
      {userTodos.map((todo: any) => (
        <div key={todo.id}>{todo.text}</div>
      ))}
    </div>
  )
}
```

**✅ Good:**
```tsx
import { queryDb, State } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React from 'react'

// Define todos table
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    userId: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false })
  }
})

// Define query outside component with proper label
const allTodosQuery = queryDb(
  () => todos.select(),
  { label: 'todos.all' }
)

function TodoList({ userId }: { userId: string }) {
  const { store } = useStore()
  
  // Use deps array to control when query re-runs
  const userTodos = store.useQuery(
    React.useMemo(
      () => queryDb(
        () => todos.where({ userId }),
        { label: `todos.user-${userId}`, deps: [userId] }
      ),
      [userId]
    )
  )
  
  return (
    <div>
      {userTodos.map(todo => (
        <div key={todo.id}>{todo.text}</div>
      ))}
    </div>
  )
}
```

### 2. Missing Error Handling for Single Record Queries

**❌ Bad:**
```tsx
import { queryDb, State } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React from 'react'

// Define posts table
const posts = State.SQLite.table({
  name: 'posts',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    title: State.SQLite.text({ nullable: false }),
    content: State.SQLite.text({ nullable: false })
  }
})

function PostDetail({ postId }: { postId: string }) {
  const { store } = useStore()
  
  // Will return undefined if post doesn't exist!
  const post = store.useQuery(
    queryDb(() => posts.where({ id: postId }).first(), { deps: [postId] })
  )
  
  return <div>{post?.title || 'Loading...'}</div>
}
```

**✅ Good:**
```tsx
import { queryDb, State } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React from 'react'

// Define posts table
const posts = State.SQLite.table({
  name: 'posts',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    title: State.SQLite.text({ nullable: false }),
    content: State.SQLite.text({ nullable: false })
  }
})

function PostDetail({ postId }: { postId: string }) {
  const { store } = useStore()
  
  // Use fallback to handle missing records gracefully
  const post = store.useQuery(
    queryDb(
      () => posts.where({ id: postId }).first({
        behaviour: 'fallback',
        fallback: () => null
      }),
      { label: `post-${postId}`, deps: [postId] }
    )
  )
  
  if (!post) {
    return <div>Post not found</div>
  }
  
  return <div>{post.title}</div>
}
```

### 3. Not Using Indexes for Performance

**❌ Bad:**
```tsx
import { State } from '@livestore/livestore'

// No indexes on frequently queried columns
const issues = State.SQLite.table({
  name: 'issues',
  columns: {
    id: State.SQLite.integer({ primaryKey: true }),
    title: State.SQLite.text({ nullable: false }),
    assigneeId: State.SQLite.integer({ nullable: true }),
    projectId: State.SQLite.integer({ nullable: true }),
    status: State.SQLite.text({ nullable: false }),
    priority: State.SQLite.integer({ default: 0 }),
    created: State.SQLite.integer({ nullable: false }),
    modified: State.SQLite.integer({ nullable: false })
  }
})
```

**✅ Good:**
```tsx
import { State, Schema } from '@livestore/livestore'

// Add indexes for frequently queried columns
const issues = State.SQLite.table({
  name: 'issues',
  columns: {
    id: State.SQLite.integer({ primaryKey: true }),
    title: State.SQLite.text({ nullable: false }),
    assigneeId: State.SQLite.integer({ nullable: true }),
    projectId: State.SQLite.integer({ nullable: true }),
    status: State.SQLite.text({ nullable: false }),
    priority: State.SQLite.integer({ default: 0 }),
    created: State.SQLite.integer({ nullable: false }),
    modified: State.SQLite.integer({ nullable: false }),
    deleted: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber })
  },
  indexes: [
    { name: 'issues_assignee', columns: ['assigneeId'] },
    { name: 'issues_project', columns: ['projectId'] },
    { name: 'issues_status', columns: ['status'] },
    { name: 'issues_created', columns: ['created'] },
    { name: 'issues_priority', columns: ['priority'] }
  ]
})
```

### 4. Improper Event and Materializer Usage

**❌ Bad:**
```tsx
import { Events, State, Schema } from '@livestore/livestore'

// Poorly structured event
const createTodo = Events.synced({
  name: 'todo.created',
  schema: Schema.Struct({
    text: Schema.String  // Missing required fields
  })
})

// Mock todos table for this example
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    userId: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    created: State.SQLite.integer({ nullable: false }),
    modified: State.SQLite.integer({ nullable: false })
  }
})

// Materializer doesn't handle related data properly
const materializers = State.SQLite.materializers({ createTodo }, {
  'todo.created': (data) => 
    todos.insert({
      id: 'todo-123',  // Hardcoded ID!
      text: data.text,
      userId: 'user-123',  // Hardcoded user!
      completed: false,
      created: Date.now(),
      modified: Date.now()
      // Missing proper field handling
    })
})
```

**✅ Good:**
```tsx
import { Events, State, Schema } from '@livestore/livestore'

// Proper event structure with all required fields
const createTodo = Events.synced({
  name: 'v1.CreateTodo',
  schema: Schema.Struct({
    id: Schema.String,
    text: Schema.String,
    userId: Schema.String,
    completed: Schema.Boolean,
    created: Schema.DateFromNumber,
    modified: Schema.DateFromNumber
  })
})

// Mock todos table for this example
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    userId: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    created: State.SQLite.integer({ nullable: false }),
    modified: State.SQLite.integer({ nullable: false })
  }
})

// Materializer handles all data properly
const materializers = State.SQLite.materializers({ createTodo }, {
  'v1.CreateTodo': (data) => 
    todos.insert({
      id: data.id,
      text: data.text,
      userId: data.userId,
      completed: data.completed,
      created: Date.now(),  // Use proper timestamps
      modified: Date.now()
    })
})
```

### 5. Not Batching Related Operations

**❌ Bad:**
```tsx
import { Events, Schema } from '@livestore/livestore'
import { useStore } from '@livestore/react'

// Define events
const createIssue = Events.synced({
  name: 'v1.CreateIssue',
  schema: Schema.Struct({
    id: Schema.Number,
    title: Schema.String,
    created: Schema.DateFromNumber
  })
})

const addLabel = Events.synced({
  name: 'v1.AddLabel',
  schema: Schema.Struct({
    issueId: Schema.Number,
    labelId: Schema.Number,
    created: Schema.DateFromNumber
  })
})

async function createIssueWithLabels(title: string, labelIds: number[]) {
  const { store } = useStore()
  
  // Multiple separate transactions - not atomic!
  store.commit(createIssue({
    id: 1,
    title,
    created: new Date()
  }))
  
  // Each label is a separate transaction
  for (const labelId of labelIds) {
    store.commit(addLabel({
      issueId: 1,
      labelId,
      created: new Date()
    }))
  }
}
```

**✅ Good:**
```tsx
import { Events, Schema } from '@livestore/livestore'
import { useStore } from '@livestore/react'

// Define events (same as above)
const createIssue = Events.synced({
  name: 'v1.CreateIssue',
  schema: Schema.Struct({
    id: Schema.Number,
    title: Schema.String,
    created: Schema.DateFromNumber
  })
})

const addLabel = Events.synced({
  name: 'v1.AddLabel',
  schema: Schema.Struct({
    issueId: Schema.Number,
    labelId: Schema.Number,
    created: Schema.DateFromNumber
  })
})

function createIssueWithLabels(title: string, labelIds: number[]) {
  const { store } = useStore()
  const now = new Date()
  const issueId = 1
  
  // Single atomic transaction for all related operations
  store.commit(
    createIssue({
      id: issueId,
      title,
      created: now
    }),
    // Spread all label operations into same transaction
    ...labelIds.map(labelId => 
      addLabel({
        issueId,
        labelId,
        created: now
      })
    )
  )
}
```

### 6. Memory Leaks from Improper Subscription Management

**❌ Bad:**
```tsx
import { queryDb, State } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React from 'react'

// Mock todos table for this example
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false })
  }
})

// Mock query for this example
const todosQuery = queryDb(() => todos.select(), { label: 'todos.all' })

function TodoList() {
  const { store } = useStore()
  const [todoList, setTodoList] = React.useState<any[]>([])
  
  React.useEffect(() => {
    // Manual subscription without cleanup!
    const subscription = store.subscribe(todosQuery, {
      onUpdate: (newTodos: any) => {
        setTodoList(newTodos)
      }
    })
    
    // Missing cleanup - memory leak!
  }, [])
  
  return (
    <div>
      {todoList.map((todo: any) => (
        <div key={todo.id}>{todo.text}</div>
      ))}
    </div>
  )
}
```

**✅ Good:**
```tsx
import { queryDb, State } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React from 'react'

// Define todos table
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false })
  }
})

const todosQuery = queryDb(
  () => todos.select(),
  { label: 'todos.all' }
)

function TodoList() {
  const { store } = useStore()
  
  // Use the hook - handles subscription lifecycle automatically
  const todos = store.useQuery(todosQuery)
  
  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>{todo.text}</div>
      ))}
    </div>
  )
}

// If you need manual subscriptions, always clean up
function TodoListWithManualSubscription() {
  const { store } = useStore()
  const [todoList, setTodoList] = React.useState<any[]>([])
  
  React.useEffect(() => {
    const subscription = store.subscribe(todosQuery, {
      onUpdate: (newTodos: any) => {
        setTodoList(newTodos)
      }
    })
    
    // Proper cleanup
    return subscription
  }, [store])
  
  return (
    <div>
      {todoList.map((todo: any) => (
        <div key={todo.id}>{todo.text}</div>
      ))}
    </div>
  )
}
```

### 7. Not Handling Soft Deletes Properly

**❌ Bad:**
```tsx
import { Events, State, Schema } from '@livestore/livestore'

// Missing soft delete support
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false })
  }
})

// Hard delete event
const deleteTodo = Events.synced({
  name: 'v1.DeleteTodo',
  schema: Schema.Struct({
    id: Schema.String
  })
})

const materializers = State.SQLite.materializers({ deleteTodo }, {
  'v1.DeleteTodo': (data) => 
    todos.delete().where({ id: data.id })  // Hard delete!
})
```

**✅ Good:**
```tsx
import { Events, State, Schema, queryDb } from '@livestore/livestore'

// Include deleted timestamp for soft deletes
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    created: State.SQLite.integer({ nullable: false, schema: Schema.DateFromNumber }),
    deleted: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber })
  }
})

// Soft delete event
const deleteTodo = Events.synced({
  name: 'v1.DeleteTodo',
  schema: Schema.Struct({
    id: Schema.String,
    deleted: Schema.DateFromNumber
  })
})

const materializers = State.SQLite.materializers({ deleteTodo }, {
  'v1.DeleteTodo': (data) => 
    todos.update({ deleted: data.deleted }).where({ id: data.id })
})

// Always filter out deleted records in queries
const activeTodosQuery = queryDb(
  () => todos.where({ deleted: null }),
  { label: 'todos.active' }
)
```

### 8. Performance Issues with Large Lists

**❌ Bad:**
```tsx
import { queryDb, State } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React from 'react'

// Define issues table
const issues = State.SQLite.table({
  name: 'issues',
  columns: {
    id: State.SQLite.integer({ primaryKey: true }),
    title: State.SQLite.text({ nullable: false }),
    created: State.SQLite.integer({ nullable: false })
  }
})

function IssueList() {
  const { store } = useStore()
  
  // Renders ALL issues without virtualization!
  const allIssues = store.useQuery(
    queryDb(() => issues.select(), { label: 'issues.all' })
  )
  
  return (
    <div>
      {allIssues.map((issue: any) => (
        <div key={issue.id} style={{ height: '40px' }}>
          {issue.title}
        </div>
      ))}
    </div>
  )
}
```

**✅ Good:**
```tsx
import { queryDb, State } from '@livestore/livestore'
import { useStore } from '@livestore/react'
import React from 'react'

// Define issues table
const issues = State.SQLite.table({
  name: 'issues',
  columns: {
    id: State.SQLite.integer({ primaryKey: true }),
    title: State.SQLite.text({ nullable: false }),
    created: State.SQLite.integer({ nullable: false })
  }
})

function IssueList() {
  const { store } = useStore()
  
  // Get just the IDs first for virtualization
  const issueIds = store.useQuery(
    queryDb(
      () => issues.select('id').orderBy('created', 'desc'),
      { label: 'issues.ids' }
    )
  )
  
  return (
    <div style={{ height: '400px', overflow: 'auto' }}>
      {/* Use virtualization for large lists */}
      <VirtualizedList 
        itemCount={issueIds.length}
        itemHeight={40}
        renderItem={({ index }) => <IssueRow issueId={issueIds[index] || 0} />}
      />
    </div>
  )
}

function IssueRow({ issueId }: { issueId: number }) {
  const { store } = useStore()
  
  // Individual queries are cached efficiently
  const issue = store.useQuery(
    queryDb(
      () => issues.where({ id: issueId }).first(),
      { label: `issue-${issueId}`, deps: [issueId] }
    )
  )
  
  return (
    <div style={{ height: '40px' }}>
      {issue?.title || 'Loading...'}
    </div>
  )
}

// Mock virtualization component
function VirtualizedList({ itemCount, itemHeight, renderItem }: {
  itemCount: number
  itemHeight: number
  renderItem: (props: { index: number }) => React.ReactElement
}) {
  return (
    <div>
      {Array.from({ length: Math.min(itemCount, 20) }, (_, index) => (
        <div key={index}>
          {renderItem({ index })}
        </div>
      ))}
    </div>
  )
}
```

### Best Practices Summary

1. **Always use labels** in queries for debugging and performance monitoring
2. **Include deps arrays** to control when queries re-run
3. **Handle missing records** with proper fallback behavior
4. **Add indexes** for frequently queried columns
5. **Batch related operations** in single transactions
6. **Use the reactive hooks** instead of manual subscriptions
7. **Implement soft deletes** with timestamp columns
8. **Virtualize large lists** to prevent performance issues
9. **Structure events properly** with all required fields
10. **Version your events** with proper naming conventions

### Next Steps

- Explore @19-real-world-examples.md
- Return to @09-testing.md for validation strategies