# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Mutation Patterns

### Event-Driven Mutations

```tsx
import React from 'react'
import { State, Events, Schema, makeSchema, createStorePromise, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Setup tables
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false }),
    completedAt: State.SQLite.integer({ nullable: true }),
    userId: State.SQLite.text({ nullable: false }),
    tags: State.SQLite.text({ nullable: false }) // JSON string
  }
})

const userStats = State.SQLite.table({
  name: 'userStats',
  columns: {
    userId: State.SQLite.text({ primaryKey: true }),
    todosCreated: State.SQLite.integer({ default: 0 }),
    todosCompleted: State.SQLite.integer({ default: 0 })
  }
})

const auditLog = State.SQLite.table({
  name: 'auditLog',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    entityType: State.SQLite.text({ nullable: false }),
    entityId: State.SQLite.text({ nullable: false }),
    action: State.SQLite.text({ nullable: false }),
    changes: State.SQLite.text({ nullable: false }), // JSON string
    userId: State.SQLite.text({ nullable: false }),
    timestamp: State.SQLite.integer({ nullable: false })
  }
})

// Schemas
const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean,
  createdAt: Schema.Number,
  completedAt: Schema.optional(Schema.Number),
  userId: Schema.String,
  tags: Schema.String
})

// Define domain events using LiveStore Events API
const events = {
  todoCreated: Events.synced({
    name: 'todo.created',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      userId: Schema.String,
      tags: Schema.Array(Schema.String)
    })
  }),
  
  todoCompleted: Events.synced({
    name: 'todo.completed',
    schema: Schema.Struct({
      id: Schema.String,
      completedBy: Schema.String
    })
  }),
  
  todoUncompleted: Events.synced({
    name: 'todo.uncompleted',
    schema: Schema.Struct({
      id: Schema.String
    })
  }),
  
  todoUpdated: Events.synced({
    name: 'todo.updated',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      updatedBy: Schema.String
    })
  })
}

// Event handlers (materializers)
const materializers = State.SQLite.materializers(events, {
  'todo.created': (event) => {
    const tagsJson = JSON.stringify(event.tags)
    return todos.insert({
      id: event.id,
      text: event.text,
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
      userId: event.userId,
      tags: tagsJson
    })
  },
  
  'todo.completed': (event) => {
    return todos.update({ 
      completed: true, 
      completedAt: Date.now() 
    }).where({ id: event.id })
  },
  
  'todo.uncompleted': (event) => {
    return todos.update({ 
      completed: false, 
      completedAt: null 
    }).where({ id: event.id })
  },
  
  'todo.updated': (event) => {
    // Update the todo
    const todoResult = todos.update({ 
      text: event.text 
    }).where({ id: event.id })
    
    // Create audit log entry
    const auditResult = auditLog.insert({
      id: crypto.randomUUID(),
      entityType: 'todo',
      entityId: event.id,
      action: 'update',
      changes: JSON.stringify({ text: event.text }),
      userId: event.updatedBy,
      timestamp: Date.now()
    })
    
    return [todoResult, auditResult]
  }
})

// Create store
const state = State.SQLite.makeState({ 
  tables: { todos, userStats, auditLog }, 
  materializers 
})
const schema = makeSchema({ state, events })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'mutation-patterns-example'
})

// Query for todos
const todosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos ORDER BY createdAt DESC',
  bindValues: [] as const,
  schema: Schema.Array(TodoSchema)
}))

const currentUser = { id: 'user-123' }
type Todo = Schema.Schema.Type<typeof TodoSchema>

// Usage in components
function TodoItem({ todo }: { todo: Todo }) {
  const handleComplete = () => {
    if (todo.completed) {
      store.commit(events.todoUncompleted({ id: todo.id }))
    } else {
      store.commit(events.todoCompleted({
        id: todo.id,
        completedBy: currentUser.id
      }))
    }
  }
  
  const handleUpdate = (newText: string) => {
    store.commit(events.todoUpdated({
      id: todo.id,
      text: newText,
      updatedBy: currentUser.id
    }))
  }
  
  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleComplete}
      />
      <span>{todo.text}</span>
      <button onClick={() => handleUpdate(todo.text + ' (updated)')}>
        Update
      </button>
    </div>
  )
}

// Example of using multiple events together
function createTodoWithTags(text: string, tags: string[]) {
  store.commit(events.todoCreated({
    id: crypto.randomUUID(),
    text,
    userId: currentUser.id,
    tags
  }))
}
```

### Batch Operations

```tsx
import { State, Events, Schema, makeSchema, createStorePromise, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Setup tables for batch operations
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false }),
    completedAt: State.SQLite.integer({ nullable: true }),
    userId: State.SQLite.text({ nullable: false }),
    tags: State.SQLite.text({ nullable: false })
  }
})

const archivedTodos = State.SQLite.table({
  name: 'archivedTodos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ nullable: false }),
    createdAt: State.SQLite.integer({ nullable: false }),
    completedAt: State.SQLite.integer({ nullable: true }),
    userId: State.SQLite.text({ nullable: false }),
    tags: State.SQLite.text({ nullable: false }),
    archivedAt: State.SQLite.integer({ nullable: false })
  }
})

// Batch events
const batchEvents = {
  todoTagsUpdated: Events.synced({
    name: 'todo.tagsUpdated',
    schema: Schema.Struct({
      todoIds: Schema.Array(Schema.String),
      tags: Schema.Array(Schema.String)
    })
  }),
  
  todoCompleted: Events.synced({
    name: 'todo.completed',
    schema: Schema.Struct({
      id: Schema.String,
      completedBy: Schema.String
    })
  }),
  
  todoArchived: Events.synced({
    name: 'todo.archived',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      completed: Schema.Boolean,
      createdAt: Schema.Number,
      completedAt: Schema.optional(Schema.Number),
      userId: Schema.String,
      tags: Schema.String
    })
  })
}

// Materializers for batch operations
const materializers = State.SQLite.materializers(batchEvents, {
  'todo.tagsUpdated': (event) => {
    const tagsJson = JSON.stringify(event.tags)
    // Update multiple todos with same tags
    const results = event.todoIds.map(id => 
      todos.update({ tags: tagsJson }).where({ id })
    )
    return results
  },
  
  'todo.completed': (event) => {
    return todos.update({ 
      completed: true, 
      completedAt: Date.now() 
    }).where({ id: event.id })
  },
  
  'todo.archived': (event) => {
    // Archive todo and remove from main table
    const archiveResult = archivedTodos.insert({
      id: event.id,
      text: event.text,
      completed: event.completed,
      createdAt: event.createdAt,
      completedAt: event.completedAt ?? null,
      userId: event.userId,
      tags: event.tags,
      archivedAt: Date.now()
    })
    
    const deleteResult = todos.delete().where({ id: event.id })
    
    return [archiveResult, deleteResult]
  }
})

const state = State.SQLite.makeState({ 
  tables: { todos, archivedTodos }, 
  materializers 
})
const schema = makeSchema({ state, events: batchEvents })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'batch-operations-example'
})

// Batch update tags for multiple todos
function updateTodoTags(todoIds: string[], tags: string[]) {
  store.commit(batchEvents.todoTagsUpdated({
    todoIds,
    tags
  }))
}

// Archive old completed todos
function archiveOldTodos(daysOld: number) {
  const cutoffDate = Date.now() - (daysOld * 86400000)
  
  // Query for old completed todos
  const oldTodosQuery = queryDb(() => ({
    query: `
      SELECT * FROM todos 
      WHERE completed = 1 
      AND completedAt < ?
    `,
    bindValues: [cutoffDate] as const,
    schema: Schema.Array(Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      completed: Schema.Boolean,
      createdAt: Schema.Number,
      completedAt: Schema.Union(Schema.Number, Schema.Null),
      userId: Schema.String,
      tags: Schema.String
    }))
  }))
  
  const oldTodos = store.query(oldTodosQuery)
  
  // Archive each todo (one event per todo for proper tracking)
  oldTodos.forEach(todo => {
    store.commit(batchEvents.todoArchived({
      id: todo.id,
      text: todo.text,
      completed: todo.completed,
      createdAt: todo.createdAt,
      completedAt: todo.completedAt || undefined,
      userId: todo.userId,
      tags: todo.tags
    }))
  })
  
  return oldTodos.length
}

// Bulk operations on selected todos
function bulkCompleteTodos(todoIds: string[]) {
  // Use individual events for each todo
  // This ensures proper event tracking and potential rollback
  todoIds.forEach(id => {
    store.commit(batchEvents.todoCompleted({
      id,
      completedBy: 'current-user-id'
    }))
  })
}

// Usage examples
updateTodoTags(['todo-1', 'todo-2'], ['urgent', 'priority'])
const archivedCount = archiveOldTodos(30) // Archive todos older than 30 days
bulkCompleteTodos(['todo-3', 'todo-4', 'todo-5'])
```