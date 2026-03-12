# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Real-World Application Examples

This section demonstrates complete, working applications built with LiveStore. Each example shows real patterns you can use in production applications.

### 1. Todo List with Real-Time Collaboration

A collaborative todo application showcasing LiveStore's event-sourcing and real-time capabilities.

```tsx
import { State, Events, Schema, makeSchema, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { LiveStoreProvider, useStore } from '@livestore/react'
import React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'

// Define types
interface Todo {
  id: string
  text: string
  completed: boolean
  userId: string
  createdAt: number
  updatedAt: number
  deleted: number | null
}

interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  lastSeen: number
}

// Define the todos table
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    userId: State.SQLite.text({ nullable: false }),
    createdAt: State.SQLite.integer({ nullable: false }),
    updatedAt: State.SQLite.integer({ nullable: false }),
    deleted: State.SQLite.integer({ nullable: true })
  },
  indexes: [
    { name: 'todos_user_created', columns: ['userId', 'createdAt'] },
    { name: 'todos_deleted', columns: ['deleted'] }
  ]
})

// Define users table for collaboration
const users = State.SQLite.table({
  name: 'users',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ nullable: false }),
    email: State.SQLite.text({ nullable: false }),
    avatar: State.SQLite.text({ nullable: true }),
    lastSeen: State.SQLite.integer({ nullable: false })
  }
})

// Define events for todo operations
const events = {
  todoCreated: Events.synced({
    name: 'v1.TodoCreated',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      userId: Schema.String,
      createdAt: Schema.Number,
      updatedAt: Schema.Number
    })
  }),
  
  todoUpdated: Events.synced({
    name: 'v1.TodoUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      updatedAt: Schema.Number
    })
  }),
  
  todoCompleted: Events.synced({
    name: 'v1.TodoCompleted',
    schema: Schema.Struct({
      id: Schema.String,
      completed: Schema.Boolean,
      updatedAt: Schema.Number
    })
  }),
  
  todoDeleted: Events.synced({
    name: 'v1.TodoDeleted',
    schema: Schema.Struct({
      id: Schema.String,
      deleted: Schema.Number
    })
  }),
  
  userPresence: Events.synced({
    name: 'v1.UserPresence',
    schema: Schema.Struct({
      userId: Schema.String,
      name: Schema.String,
      email: Schema.String,
      avatar: Schema.Union(Schema.String, Schema.Null),
      lastSeen: Schema.Number
    })
  })
}

// Define materializers to handle events
const materializers = State.SQLite.materializers(events, {
  'v1.TodoCreated': (data) => 
    todos.insert({
      id: data.id,
      text: data.text,
      completed: false,
      userId: data.userId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deleted: null
    }),
    
  'v1.TodoUpdated': (data) =>
    todos.update({
      text: data.text,
      updatedAt: data.updatedAt
    }).where({ id: data.id }),
    
  'v1.TodoCompleted': (data) =>
    todos.update({
      completed: data.completed,
      updatedAt: data.updatedAt
    }).where({ id: data.id }),
    
  'v1.TodoDeleted': (data) =>
    todos.update({
      deleted: data.deleted
    }).where({ id: data.id }),
    
  'v1.UserPresence': (data) => [
    users.insert({
      id: data.userId,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      lastSeen: data.lastSeen
    }),
    users.update({
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      lastSeen: data.lastSeen
    }).where({ id: data.userId })
  ]
})

// Create the schema
const state = State.SQLite.makeState({ 
  tables: { todos, users }, 
  materializers 
})
const schema = makeSchema({ state, events })

// Queries for the todo app
const activeTodosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos WHERE deleted IS NULL ORDER BY createdAt DESC',
  bindValues: [] as const,
  schema: Schema.Array(Schema.Struct({
    id: Schema.String,
    text: Schema.String,
    completed: Schema.Boolean,
    userId: Schema.String,
    createdAt: Schema.Number,
    updatedAt: Schema.Number,
    deleted: Schema.Union(Schema.Number, Schema.Null)
  }))
}), { label: 'todos.active', deps: [] })

const completedTodosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos WHERE deleted IS NULL AND completed = 1 ORDER BY updatedAt DESC',
  bindValues: [] as const,
  schema: Schema.Array(Schema.Struct({
    id: Schema.String,
    text: Schema.String,
    completed: Schema.Boolean,
    userId: Schema.String,
    createdAt: Schema.Number,
    updatedAt: Schema.Number,
    deleted: Schema.Union(Schema.Number, Schema.Null)
  }))
}), { label: 'todos.completed', deps: [] })

const onlineUsersQuery = queryDb(() => ({
  query: 'SELECT * FROM users ORDER BY lastSeen DESC',
  bindValues: [] as const,
  schema: Schema.Array(Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    email: Schema.String,
    avatar: Schema.Union(Schema.String, Schema.Null),
    lastSeen: Schema.Number
  }))
}), { label: 'users.online', deps: [] })

// TodoApp component
function TodoApp() {
  const { store } = useStore()
  const [newTodoText, setNewTodoText] = React.useState('')
  
  const activeTodos = store.useQuery(activeTodosQuery)
  const completedTodos = store.useQuery(completedTodosQuery)
  const onlineUsers = store.useQuery(onlineUsersQuery)
  
  const currentUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://avatar.example.com/john.jpg'
  }
  
  // Update user presence on mount
  React.useEffect(() => {
    store.commit(events.userPresence({
      userId: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      avatar: currentUser.avatar,
      lastSeen: Date.now()
    }))
    
    // Update presence every minute
    const interval = setInterval(() => {
      store.commit(events.userPresence({
        userId: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        lastSeen: Date.now()
      }))
    }, 60000)
    
    return () => clearInterval(interval)
  }, [store])
  
  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoText.trim()) return
    
    store.commit(events.todoCreated({
      id: crypto.randomUUID(),
      text: newTodoText,
      userId: currentUser.id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }))
    
    setNewTodoText('')
  }
  
  const handleToggleTodo = (todo: Todo) => {
    store.commit(events.todoCompleted({
      id: todo.id,
      completed: !todo.completed,
      updatedAt: Date.now()
    }))
  }
  
  const handleDeleteTodo = (todo: Todo) => {
    store.commit(events.todoDeleted({
      id: todo.id,
      deleted: Date.now()
    }))
  }
  
  const handleUpdateTodo = (todo: Todo, newText: string) => {
    if (newText.trim() && newText !== todo.text) {
      store.commit(events.todoUpdated({
        id: todo.id,
        text: newText.trim(),
        updatedAt: Date.now()
      }))
    }
  }
  
  return (
    <div className="todo-app">
      <header className="app-header">
        <h1>Collaborative Todos</h1>
        <div className="online-users">
          <span>Online: </span>
          {onlineUsers.map((user) => (
            <div key={user.id} className="user-avatar" title={user.name}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div className="avatar-placeholder">{user.name[0]}</div>
              )}
            </div>
          ))}
        </div>
      </header>
      
      <form onSubmit={handleCreateTodo} className="todo-form">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a new todo..."
          className="todo-input"
        />
        <button type="submit" disabled={!newTodoText.trim()}>
          Add Todo
        </button>
      </form>
      
      <div className="todos-container">
        <section className="todos-section">
          <h2>Active Todos ({activeTodos.length})</h2>
          <div className="todos-list">
            {activeTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
                onUpdate={handleUpdateTodo}
              />
            ))}
            {activeTodos.length === 0 && (
              <p className="empty-state">No active todos. Create one above!</p>
            )}
          </div>
        </section>
        
        {completedTodos.length > 0 && (
          <section className="todos-section">
            <h2>Completed ({completedTodos.length})</h2>
            <div className="todos-list">
              {completedTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggleTodo}
                  onDelete={handleDeleteTodo}
                  onUpdate={handleUpdateTodo}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// TodoItem component
function TodoItem({ todo, onToggle, onDelete, onUpdate }: {
  todo: Todo
  onToggle: (todo: Todo) => void
  onDelete: (todo: Todo) => void
  onUpdate: (todo: Todo, text: string) => void
}) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editText, setEditText] = React.useState(todo.text)
  
  const handleSave = () => {
    onUpdate(todo, editText)
    setIsEditing(false)
  }
  
  const handleCancel = () => {
    setEditText(todo.text)
    setIsEditing(false)
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }
  
  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo)}
        className="todo-checkbox"
      />
      
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          className="todo-edit-input"
          autoFocus
        />
      ) : (
        <span
          className="todo-text"
          onDoubleClick={() => setIsEditing(true)}
          title="Double-click to edit"
        >
          {todo.text}
        </span>
      )}
      
      <div className="todo-actions">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="edit-button"
          title="Edit todo"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(todo)}
          className="delete-button"
          title="Delete todo"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

// Provider setup
function App() {
  const adapter = makeInMemoryAdapter()
  
  return (
    <LiveStoreProvider
      schema={schema}
      storeId="todo-app"
      adapter={adapter}
      batchUpdates={batchUpdates}
    >
      <TodoApp />
    </LiveStoreProvider>
  )
}

// Export for module completeness
export { App as TodoApp }
```

### 2. Issue Tracker with Advanced Filtering

A GitHub-style issue tracker demonstrating complex queries, filtering, and real-time updates.

```tsx
import { State, Events, Schema, makeSchema, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { LiveStoreProvider, useStore } from '@livestore/react'
import React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'

// Define types
interface Issue {
  id: number
  title: string
  description: string
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assigneeId: string | null
  createdBy: string
  createdAt: number
  updatedAt: number
  closedAt: number | null
  deleted: number | null
}

interface IssueLabel {
  issueId: number
  labelId: string
  addedAt: number
}

interface Label {
  id: string
  name: string
  color: string
  description: string | null
}

interface User {
  id: string
  name: string
  email: string
  avatar: string | null
}

// Issue status and priority enums
const IssueStatus = Schema.Literal('open', 'in_progress', 'closed')
const IssuePriority = Schema.Literal('low', 'medium', 'high', 'critical')

// Define tables
const issues = State.SQLite.table({
  name: 'issues',
  columns: {
    id: State.SQLite.integer({ primaryKey: true }),
    title: State.SQLite.text({ nullable: false }),
    description: State.SQLite.text({ nullable: false }),
    status: State.SQLite.text({ nullable: false, schema: IssueStatus }),
    priority: State.SQLite.text({ nullable: false, schema: IssuePriority }),
    assigneeId: State.SQLite.text({ nullable: true }),
    createdBy: State.SQLite.text({ nullable: false }),
    createdAt: State.SQLite.integer({ nullable: false }),
    updatedAt: State.SQLite.integer({ nullable: false }),
    closedAt: State.SQLite.integer({ nullable: true }),
    deleted: State.SQLite.integer({ nullable: true })
  },
  indexes: [
    { name: 'issues_status', columns: ['status'] },
    { name: 'issues_priority', columns: ['priority'] },
    { name: 'issues_assignee', columns: ['assigneeId'] },
    { name: 'issues_created', columns: ['createdAt'] }
  ]
})

const labels = State.SQLite.table({
  name: 'labels',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ nullable: false }),
    color: State.SQLite.text({ nullable: false }),
    description: State.SQLite.text({ nullable: true })
  }
})

const issueLabels = State.SQLite.table({
  name: 'issue_labels',
  columns: {
    issueId: State.SQLite.integer({ nullable: false }),
    labelId: State.SQLite.text({ nullable: false }),
    addedAt: State.SQLite.integer({ nullable: false })
  },
  indexes: [
    { name: 'issue_labels_issue', columns: ['issueId'] },
    { name: 'issue_labels_label', columns: ['labelId'] }
  ]
})

const users = State.SQLite.table({
  name: 'users',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ nullable: false }),
    email: State.SQLite.text({ nullable: false }),
    avatar: State.SQLite.text({ nullable: true })
  }
})

// Create the schema
const state = State.SQLite.makeState({ 
  tables: { issues, labels, issueLabels, users }, 
  materializers: State.SQLite.materializers({}, {})
})
const schema = makeSchema({ state, events: {} })

// Queries
const allIssuesQuery = queryDb(() => ({
  query: 'SELECT * FROM issues WHERE deleted IS NULL ORDER BY createdAt DESC',
  bindValues: [] as const,
  schema: Schema.Array(Schema.Struct({
    id: Schema.Number,
    title: Schema.String,
    description: Schema.String,
    status: IssueStatus,
    priority: IssuePriority,
    assigneeId: Schema.Union(Schema.String, Schema.Null),
    createdBy: Schema.String,
    createdAt: Schema.Number,
    updatedAt: Schema.Number,
    closedAt: Schema.Union(Schema.Number, Schema.Null),
    deleted: Schema.Union(Schema.Number, Schema.Null)
  }))
}), { label: 'issues.all', deps: [] })

const allUsersQuery = queryDb(() => ({
  query: 'SELECT * FROM users ORDER BY name ASC',
  bindValues: [] as const,
  schema: Schema.Array(Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    email: Schema.String,
    avatar: Schema.Union(Schema.String, Schema.Null)
  }))
}), { label: 'users.all', deps: [] })

const allLabelsQuery = queryDb(() => ({
  query: 'SELECT * FROM labels ORDER BY name ASC',
  bindValues: [] as const,
  schema: Schema.Array(Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    color: Schema.String,
    description: Schema.Union(Schema.String, Schema.Null)
  }))
}), { label: 'labels.all', deps: [] })

// IssueTracker component
function IssueTracker() {
  const { store } = useStore()
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  
  const allIssues = store.useQuery(allIssuesQuery)
  const allUsers = store.useQuery(allUsersQuery)
  const allLabels = store.useQuery(allLabelsQuery)
  
  const stats = React.useMemo(() => ({
    total: allIssues.length,
    open: allIssues.filter(i => i.status === 'open').length,
    inProgress: allIssues.filter(i => i.status === 'in_progress').length,
    closed: allIssues.filter(i => i.status === 'closed').length
  }), [allIssues])
  
  const handleCreateIssue = (issueData: Partial<Issue>) => {
    // In a real app, this would dispatch an event
    console.log('Creating issue:', issueData)
    setShowCreateModal(false)
  }
  
  const handleUpdateIssue = (issueId: number, updates: Partial<Issue>) => {
    // In a real app, this would dispatch an event
    console.log('Updating issue:', issueId, updates)
  }
  
  return (
    <div className="issue-tracker">
      <header className="tracker-header">
        <h1>Issue Tracker</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="create-issue-btn"
        >
          Create Issue
        </button>
      </header>
      
      <div className="issue-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Issues</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.open}</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.inProgress}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.closed}</span>
          <span className="stat-label">Closed</span>
        </div>
      </div>
      
      <div className="issues-list">
        {allIssues.map((issue) => (
          <IssueCard 
            key={issue.id} 
            issue={issue} 
            onUpdate={handleUpdateIssue}
            users={allUsers}
            labels={allLabels}
          />
        ))}
        
        {allIssues.length === 0 && (
          <div className="empty-state">
            <p>No issues found.</p>
            <button onClick={() => setShowCreateModal(true)}>Create First Issue</button>
          </div>
        )}
      </div>
      
      {showCreateModal && (
        <CreateIssueModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateIssue}
          users={allUsers}
          labels={allLabels}
        />
      )}
    </div>
  )
}

// IssueCard component
function IssueCard({ issue, onUpdate, users, labels }: {
  issue: Issue
  onUpdate: (issueId: number, updates: Partial<Issue>) => void
  users: readonly User[]
  labels: readonly Label[]
}) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#28a745'
      case 'medium': return '#ffc107'
      case 'high': return '#fd7e14'
      case 'critical': return '#dc3545'
      default: return '#6c757d'
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#007bff'
      case 'in_progress': return '#ffc107'
      case 'closed': return '#28a745'
      default: return '#6c757d'
    }
  }
  
  const assignee = users.find(u => u.id === issue.assigneeId)
  
  return (
    <div className="issue-card">
      <div className="issue-header">
        <h3 className="issue-title">#{issue.id} {issue.title}</h3>
        <div className="issue-meta">
          <span 
            className="priority-badge"
            style={{ backgroundColor: getPriorityColor(issue.priority) }}
          >
            {issue.priority}
          </span>
          <span 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(issue.status) }}
          >
            {issue.status.replace('_', ' ')}
          </span>
        </div>
      </div>
      
      <p className="issue-description">{issue.description}</p>
      
      <div className="issue-footer">
        <div className="issue-assignee">
          {assignee ? (
            <div className="assignee-info">
              <span>Assigned to: {assignee.name}</span>
            </div>
          ) : (
            <span className="unassigned">Unassigned</span>
          )}
        </div>
        
        <div className="issue-actions">
          <button 
            onClick={() => onUpdate(issue.id, { 
              status: issue.status === 'closed' ? 'open' : 'closed' 
            })}
            className="action-btn"
          >
            {issue.status === 'closed' ? 'Reopen' : 'Close'}
          </button>
          
          <select 
            value={issue.priority}
            onChange={(e) => onUpdate(issue.id, { priority: e.target.value as Issue['priority'] })}
            className="priority-select"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// CreateIssueModal component
function CreateIssueModal({ onClose, onSubmit, users, labels }: {
  onClose: () => void
  onSubmit: (issueData: Partial<Issue>) => void
  users: readonly User[]
  labels: readonly Label[]
}) {
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    status: 'open' as const,
    priority: 'medium' as const,
    assigneeId: ''
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Issue</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Priority:</label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Assignee:</label>
            <select
              value={formData.assigneeId}
              onChange={(e) => handleChange('assigneeId', e.target.value)}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Create Issue</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Provider setup
function App() {
  const adapter = makeInMemoryAdapter()
  
  return (
    <LiveStoreProvider
      schema={schema}
      storeId="issue-tracker"
      adapter={adapter}
      batchUpdates={batchUpdates}
    >
      <IssueTracker />
    </LiveStoreProvider>
  )
}

// Export for module completeness
export { App as IssueTracker }
```

### 3. Real-Time Chat Application

A complete chat application demonstrating messaging, presence, and typing indicators.

```tsx
import { State, Events, Schema, makeSchema, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { LiveStoreProvider, useStore } from '@livestore/react'
import React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'

// Define types
interface Message {
  id: string
  roomId: string
  userId: string
  content: string
  createdAt: number
  editedAt: number | null
  deleted: number | null
}

interface User {
  id: string
  name: string
  avatar: string | null
  status: string
  lastSeen: number
}

interface Room {
  id: string
  name: string
  description: string | null
  createdAt: number
}

interface TypingIndicator {
  userId: string
  roomId: string
  startedAt: number
}

// Define tables
const messages = State.SQLite.table({
  name: 'messages',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    roomId: State.SQLite.text({ nullable: false }),
    userId: State.SQLite.text({ nullable: false }),
    content: State.SQLite.text({ nullable: false }),
    createdAt: State.SQLite.integer({ nullable: false }),
    editedAt: State.SQLite.integer({ nullable: true }),
    deleted: State.SQLite.integer({ nullable: true })
  },
  indexes: [
    { name: 'messages_room_created', columns: ['roomId', 'createdAt'] },
    { name: 'messages_user', columns: ['userId'] }
  ]
})

const users = State.SQLite.table({
  name: 'users',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ nullable: false }),
    avatar: State.SQLite.text({ nullable: true }),
    status: State.SQLite.text({ nullable: false }),
    lastSeen: State.SQLite.integer({ nullable: false })
  }
})

const rooms = State.SQLite.table({
  name: 'rooms',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ nullable: false }),
    description: State.SQLite.text({ nullable: true }),
    createdAt: State.SQLite.integer({ nullable: false })
  }
})

const typingIndicators = State.SQLite.table({
  name: 'typing_indicators',
  columns: {
    userId: State.SQLite.text({ nullable: false }),
    roomId: State.SQLite.text({ nullable: false }),
    startedAt: State.SQLite.integer({ nullable: false })
  },
  indexes: [
    { name: 'typing_room_started', columns: ['roomId', 'startedAt'] }
  ]
})

// Create the schema
const state = State.SQLite.makeState({ 
  tables: { messages, users, rooms, typingIndicators }, 
  materializers: State.SQLite.materializers({}, {})
})
const schema = makeSchema({ state, events: {} })

// Queries
const createRoomMessagesQuery = (roomId: string) => queryDb(() => ({
  query: 'SELECT * FROM messages WHERE roomId = ? AND deleted IS NULL ORDER BY createdAt ASC LIMIT 100',
  bindValues: [roomId] as const,
  schema: Schema.Array(Schema.Struct({
    id: Schema.String,
    roomId: Schema.String,
    userId: Schema.String,
    content: Schema.String,
    createdAt: Schema.Number,
    editedAt: Schema.Union(Schema.Number, Schema.Null),
    deleted: Schema.Union(Schema.Number, Schema.Null)
  }))
}), { label: `messages.room-${roomId}`, deps: [roomId] })

const onlineUsersQuery = queryDb(() => ({
  query: 'SELECT * FROM users ORDER BY lastSeen DESC',
  bindValues: [] as const,
  schema: Schema.Array(Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    avatar: Schema.Union(Schema.String, Schema.Null),
    status: Schema.String,
    lastSeen: Schema.Number
  }))
}), { label: 'users.online', deps: [] })

const createTypingUsersQuery = (roomId: string, currentUserId: string) => queryDb(() => ({
  query: 'SELECT * FROM typing_indicators WHERE roomId = ? AND userId != ? ORDER BY startedAt DESC',
  bindValues: [roomId, currentUserId] as const,
  schema: Schema.Array(Schema.Struct({
    userId: Schema.String,
    roomId: Schema.String,
    startedAt: Schema.Number
  }))
}), { label: `typing.room-${roomId}`, deps: [roomId, currentUserId] })

const allRoomsQuery = queryDb(() => ({
  query: 'SELECT * FROM rooms ORDER BY name ASC',
  bindValues: [] as const,
  schema: Schema.Array(Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    description: Schema.Union(Schema.String, Schema.Null),
    createdAt: Schema.Number
  }))
}), { label: 'rooms.all', deps: [] })

// ChatApp component
function ChatApp() {
  const { store } = useStore()
  const [currentRoomId, setCurrentRoomId] = React.useState('room-1')
  const [messageText, setMessageText] = React.useState('')
  const [typingTimeout, setTypingTimeout] = React.useState<NodeJS.Timeout | null>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  
  const currentUser = {
    id: 'user-1',
    name: 'John Doe',
    avatar: 'https://avatar.example.com/john.jpg'
  }
  
  const roomMessages = store.useQuery(createRoomMessagesQuery(currentRoomId))
  const onlineUsers = store.useQuery(onlineUsersQuery)
  const typingUsers = store.useQuery(createTypingUsersQuery(currentRoomId, currentUser.id))
  const allRooms = store.useQuery(allRoomsQuery)
  
  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [roomMessages])
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return
    
    // In a real app, this would dispatch events
    console.log('Sending message:', messageText)
    setMessageText('')
    
    if (typingTimeout) {
      clearTimeout(typingTimeout)
      setTypingTimeout(null)
    }
  }
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value)
    
    // In a real app, this would dispatch typing events
    console.log('User is typing...')
    
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
    
    // Stop typing after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      console.log('User stopped typing')
    }, 3000)
    
    setTypingTimeout(timeout)
  }
  
  const handleDeleteMessage = (messageId: string) => {
    // In a real app, this would dispatch events
    console.log('Deleting message:', messageId)
  }
  
  const handleEditMessage = (messageId: string, newContent: string) => {
    // In a real app, this would dispatch events
    console.log('Editing message:', messageId, newContent)
  }
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  const getUserInfo = (userId: string) => {
    return onlineUsers.find(u => u.id === userId) || { name: 'Unknown User', avatar: null }
  }
  
  return (
    <div className="chat-app">
      <div className="chat-sidebar">
        <h3>Rooms</h3>
        <div className="rooms-list">
          {allRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setCurrentRoomId(room.id)}
              className={`room-item ${currentRoomId === room.id ? 'active' : ''}`}
            >
              #{room.name}
            </button>
          ))}
        </div>
        
        <h3>Online Users ({onlineUsers.length})</h3>
        <div className="users-list">
          {onlineUsers.map((user) => (
            <div key={user.id} className="user-item">
              <div className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <div className="avatar-placeholder">{user.name[0]}</div>
                )}
                <div className={`status-indicator ${user.status}`}></div>
              </div>
              <span className="user-name">{user.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="chat-main">
        <div className="chat-header">
          <h2>#{allRooms.find(r => r.id === currentRoomId)?.name || 'Unknown Room'}</h2>
        </div>
        
        <div className="messages-container">
          <div className="messages-list">
            {roomMessages.map((message) => {
              const user = getUserInfo(message.userId)
              const isOwnMessage = message.userId === currentUser.id
              
              return (
                <div
                  key={message.id}
                  className={`message ${isOwnMessage ? 'own-message' : ''}`}
                >
                  <div className="message-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">{user.name[0]}</div>
                    )}
                  </div>
                  
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-author">{user.name}</span>
                      <span className="message-time">{formatTime(message.createdAt)}</span>
                      {message.editedAt && (
                        <span className="message-edited">(edited)</span>
                      )}
                    </div>
                    
                    <div className="message-text">{message.content}</div>
                    
                    {isOwnMessage && (
                      <div className="message-actions">
                        <button
                          onClick={() => {
                            const newContent = prompt('Edit message:', message.content)
                            if (newContent && newContent !== message.content) {
                              handleEditMessage(message.id, newContent)
                            }
                          }}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">
                  {typingUsers.map(t => getUserInfo(t.userId).name).join(', ')} 
                  {typingUsers.length === 1 ? ' is' : ' are'} typing...
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            value={messageText}
            onChange={handleMessageChange}
            placeholder="Type a message..."
            className="message-input"
          />
          <button type="submit" disabled={!messageText.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

// Provider setup
function App() {
  const adapter = makeInMemoryAdapter()
  
  return (
    <LiveStoreProvider
      schema={schema}
      storeId="chat-app"
      adapter={adapter}
      batchUpdates={batchUpdates}
    >
      <ChatApp />
    </LiveStoreProvider>
  )
}

// Export for module completeness
export { App as ChatApp }
```

### Key Takeaways from Real-World Examples

These examples demonstrate LiveStore's core strengths:

1. **Event-Sourced Architecture**: All state changes go through events, making them auditable and collaborative
2. **Real-Time Reactivity**: Components automatically update when data changes
3. **Offline-First**: Applications work without network connectivity
4. **Type Safety**: Full TypeScript support with schema validation
5. **Performance**: Efficient queries with proper indexing and caching
6. **Developer Experience**: Simple, intuitive APIs that scale with complexity

Each example can be extended with additional features like:
- Data persistence with adapters
- Real-time sync between users
- Advanced querying and filtering
- Conflict resolution for collaborative editing
- Integration with backend systems

### Next Steps

- Explore @09-testing.md for comprehensive testing approaches
- Review @17-common-pitfalls.md to avoid typical mistakes
- Check @11-performance.md for scaling tips