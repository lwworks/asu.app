# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Error Handling & Recovery

### Schema Validation Errors

```tsx
import React from 'react'
import { State, Events, Schema, makeSchema, createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Setup
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false }),
    priority: State.SQLite.text({ nullable: false }) // Required field
  }
})

const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean,
  priority: Schema.Union(
    Schema.Literal('low'),
    Schema.Literal('medium'), 
    Schema.Literal('high')
  )
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
  storeId: 'error-handling-example'
})

// Safe event committing with validation
function addTodo(todoData: unknown): { success: boolean; error?: string } {
  try {
    // Validate the data against our schema first
    const validTodo = Schema.decodeUnknownSync(TodoSchema)(todoData)
    
    // Commit the validated event
    store.commit(events.todoAdded(validTodo))
    
    return { success: true }
  } catch (error) {
    // Handle validation errors
    if (error instanceof Error) {
      console.error('Todo validation failed:', error.message)
      return { 
        success: false, 
        error: `Invalid todo data: ${error.message}` 
      }
    }
    
    return { 
      success: false, 
      error: 'Unknown validation error' 
    }
  }
}

// Example usage with user input
function handleUserInput() {
  const userInput = {
    id: crypto.randomUUID(),
    text: 'Learn LiveStore',
    completed: false,
    priority: 'invalid-priority' // This will cause validation error
  }
  
  const result = addTodo(userInput)
  
  if (!result.success) {
    console.error('Failed to add todo:', result.error)
    // Show error to user in UI
  }
}

// Batch validation for multiple todos
function addMultipleTodos(todosData: unknown[]): { 
  successful: number; 
  failed: Array<{ index: number; error: string }> 
} {
  const results = { successful: 0, failed: [] as Array<{ index: number; error: string }> }
  
  todosData.forEach((todoData, index) => {
    const result = addTodo(todoData)
    if (result.success) {
      results.successful++
    } else {
      results.failed.push({ index, error: result.error || 'Unknown error' })
    }
  })
  
  return results
}
```

### Query Error Handling

```tsx
import { State, Schema, makeSchema, createStorePromise, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Setup
const users = State.SQLite.table({
  name: 'users',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ nullable: false }),
    email: State.SQLite.text({ nullable: false })
  }
})

const UserSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String
})

const state = State.SQLite.makeState({ tables: { users }, materializers: {} })
const schema = makeSchema({ state, events: {} })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'query-error-example'
})

// Safe query execution with error handling
function safeQuery<T>(queryFn: () => T): { data?: T; error?: string } {
  try {
    const data = queryFn()
    return { data }
  } catch (error) {
    console.error('Query failed:', error)
    
    if (error instanceof Error) {
      return { error: error.message }
    }
    
    return { error: 'Unknown query error' }
  }
}

// Example: Query with potential SQL errors
const getUsersQuery = queryDb(() => ({
  query: 'SELECT * FROM users ORDER BY name',
  bindValues: [] as const,
  schema: Schema.Array(UserSchema)
}))

// Safe query execution
function getUsers() {
  const result = safeQuery(() => store.query(getUsersQuery))
  
  if (result.error) {
    console.error('Failed to fetch users:', result.error)
    return []
  }
  
  return result.data || []
}

// Query with dynamic conditions (potential for SQL injection prevention)
function searchUsers(searchTerm: string) {
  // Validate search term first
  if (!searchTerm || searchTerm.trim().length === 0) {
    return { data: [], error: undefined }
  }
  
  if (searchTerm.length > 100) {
    return { error: 'Search term too long' }
  }
  
  const searchQuery = queryDb(() => ({
    query: 'SELECT * FROM users WHERE name LIKE ? OR email LIKE ?',
    bindValues: [`%${searchTerm}%`, `%${searchTerm}%`] as const,
    schema: Schema.Array(UserSchema)
  }))
  
  return safeQuery(() => store.query(searchQuery))
}

// Query with fallback data
function getUsersWithFallback() {
  const result = safeQuery(() => store.query(getUsersQuery))
  
  if (result.error) {
    console.warn('Using fallback data due to query error:', result.error)
    // Return empty array or cached data as fallback
    return []
  }
  
  return result.data || []
}
```

### React Error Boundaries

```tsx
import React, { Component, ReactNode } from 'react'
import { State, Schema, makeSchema, createStorePromise, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { useQuery } from '@livestore/react'

// Setup for error boundary examples
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
  storeId: 'error-boundary-example'
})

// Error boundary for LiveStore components
class LiveStoreErrorBoundary extends Component<
  {
    children: ReactNode
    fallback?: (error: Error, retry: () => void) => ReactNode
    onError?: (error: Error, errorInfo: any) => void
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('LiveStore Error Boundary caught error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }
  
  render() {
    if (this.state.hasError && this.state.error) {
      const retry = () => {
        this.setState({ hasError: false, error: undefined })
      }
      
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, retry)
      }
      
      return (
        <div className="error-boundary">
          <h3>Something went wrong</h3>
          <p>{this.state.error.message}</p>
          <button onClick={retry}>Try again</button>
        </div>
      )
    }
    
    return this.props.children
  }
}

// Hook for error handling in components
function useErrorHandler() {
  const [error, setError] = React.useState<string | null>(null)
  
  const handleError = React.useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError(error.message)
    } else {
      setError('An unknown error occurred')
    }
    
    // Clear error after a delay
    setTimeout(() => setError(null), 5000)
  }, [])
  
  const clearError = React.useCallback(() => {
    setError(null)
  }, [])
  
  return { error, handleError, clearError }
}

// Component with error handling
function TodoList() {
  const { error, handleError, clearError } = useErrorHandler()
  
  // This query might fail if the table doesn't exist
  const todosQuery = React.useMemo(() => queryDb(() => ({
    query: 'SELECT * FROM todos ORDER BY id',
    bindValues: [] as const,
    schema: Schema.Array(Schema.Struct({
      id: Schema.String,
      text: Schema.String,
      completed: Schema.Boolean
    }))
  })), [])
  
  let todos: readonly any[] = []
  
  try {
    todos = useQuery(todosQuery)
  } catch (queryError) {
    handleError(queryError)
  }
  
  if (error) {
    return (
      <div className="error-message">
        <p>Error loading todos: {error}</p>
        <button onClick={clearError}>Dismiss</button>
      </div>
    )
  }
  
  return (
    <ul>
      {todos.map((todo: any) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  )
}

// App with error boundary
function App() {
  const handleError = (error: Error, errorInfo: any) => {
    // Log to error reporting service
    console.error('App error:', error, errorInfo)
  }
  
  const errorFallback = (error: Error, retry: () => void) => (
    <div className="app-error">
      <h1>Application Error</h1>
      <p>Sorry, something went wrong with the application.</p>
      <details>
        <summary>Error details</summary>
        <pre>{error.message}</pre>
      </details>
      <button onClick={retry}>Reload Application</button>
    </div>
  )
  
  return (
    <LiveStoreErrorBoundary 
      fallback={errorFallback}
      onError={handleError}
    >
      <div className="app">
        <h1>Todo App</h1>
        <TodoList />
      </div>
    </LiveStoreErrorBoundary>
  )
}
```

### Validation and Recovery Patterns

```tsx
import React, { useState, useCallback } from 'react'
import { State, Events, Schema, makeSchema, createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// Setup
const formData = State.SQLite.table({
  name: 'formData',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ nullable: false }),
    email: State.SQLite.text({ nullable: false }),
    age: State.SQLite.integer({ nullable: false }),
    submittedAt: State.SQLite.integer({ nullable: false })
  }
})

const FormSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  age: Schema.Number,
  submittedAt: Schema.Number
})

const events = {
  formSubmitted: Events.synced({
    name: 'form.submitted',
    schema: FormSchema
  })
}

const materializers = State.SQLite.materializers(events, {
  'form.submitted': (data) => formData.insert(data)
})

const state = State.SQLite.makeState({ tables: { formData }, materializers })
const schema = makeSchema({ state, events })
const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'validation-example'
})

// Form validation with detailed error reporting
function validateForm(data: {
  name: string
  email: string
  age: string
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  
  // Name validation
  if (!data.name.trim()) {
    errors.name = 'Name is required'
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!data.email.trim()) {
    errors.email = 'Email is required'
  } else if (!emailRegex.test(data.email)) {
    errors.email = 'Please enter a valid email address'
  }
  
  // Age validation
  const ageNum = parseInt(data.age, 10)
  if (!data.age.trim()) {
    errors.age = 'Age is required'
  } else if (isNaN(ageNum)) {
    errors.age = 'Age must be a number'
  } else if (ageNum < 13 || ageNum > 120) {
    errors.age = 'Age must be between 13 and 120'
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// Form component with error handling and recovery
function UserForm() {
  const [formData, setFormData] = useState({ name: '', email: '', age: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitStatus('submitting')
    setSubmitError(null)
    
    // Client-side validation
    const validation = validateForm(formData)
    if (!validation.valid) {
      setErrors(validation.errors)
      setSubmitStatus('error')
      return
    }
    
    setErrors({})
    
    try {
      // Prepare data for LiveStore
      const submissionData = {
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        age: parseInt(formData.age, 10),
        submittedAt: Date.now()
      }
      
      // Schema validation (double-check)
      const validData = Schema.decodeUnknownSync(FormSchema)(submissionData)
      
      // Submit to LiveStore
      store.commit(events.formSubmitted(validData))
      
      setSubmitStatus('success')
      
      // Reset form after success
      setTimeout(() => {
        setFormData({ name: '', email: '', age: '' })
        setSubmitStatus('idle')
      }, 2000)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed'
      setSubmitError(errorMessage)
      setSubmitStatus('error')
      console.error('Form submission failed:', error)
    }
  }, [formData])
  
  const handleRetry = () => {
    setSubmitError(null)
    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-status">
        {submitStatus === 'submitting' && <span>Submitting...</span>}
        {submitStatus === 'success' && <span>✓ Form submitted successfully!</span>}
        {submitStatus === 'error' && submitError && (
          <div className="submit-error">
            <span>⚠ Submission failed: {submitError}</span>
            <button type="button" onClick={handleRetry}>Retry</button>
          </div>
        )}
      </div>
      
      <div className="form-field">
        <label>Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>
      
      <div className="form-field">
        <label>Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>
      
      <div className="form-field">
        <label>Age:</label>
        <input
          type="number"
          value={formData.age}
          onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
          className={errors.age ? 'error' : ''}
        />
        {errors.age && <span className="field-error">{errors.age}</span>}
      </div>
      
      <button 
        type="submit" 
        disabled={submitStatus === 'submitting'}
      >
        {submitStatus === 'submitting' ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}

// Feature detection and graceful degradation
function FeatureWithFallback() {
  const [hasAdvancedSupport, setHasAdvancedSupport] = useState(true)
  
  // Test for advanced features
  React.useEffect(() => {
    try {
      // Test if certain LiveStore features are available
      if (!('crypto' in window) || !crypto.randomUUID) {
        throw new Error('Advanced crypto features not available')
      }
      
      // Other feature detection could go here
      setHasAdvancedSupport(true)
    } catch (error) {
      console.warn('Some advanced features not available:', error)
      setHasAdvancedSupport(false)
    }
  }, [])
  
  if (!hasAdvancedSupport) {
    return (
      <div className="fallback-mode">
        <h3>Basic Mode</h3>
        <p>Some advanced features are not available in your browser.</p>
        <p>The app will function with reduced capabilities.</p>
      </div>
    )
  }
  
  return (
    <div className="advanced-mode">
      <h3>Full Feature Mode</h3>
      <p>All features are available!</p>
    </div>
  )
}
```

### Best Practices

1. **Always validate external data** before committing events
2. **Use try/catch around LiveStore operations** that might fail
3. **Provide meaningful error messages** to users
4. **Implement error boundaries** for React components
5. **Handle schema validation errors** gracefully
6. **Use fallback data or UI** when queries fail
7. **Log errors appropriately** for debugging

### Common Error Scenarios

- **Schema validation failures** when event data doesn't match schema
- **SQL query errors** from malformed queries or missing tables  
- **Type mismatches** between schemas and actual data
- **Missing required fields** in event payloads
- **Component rendering errors** when query data is unexpected

### Next Steps

- Learn about @11-performance.md to prevent errors through better code
- Read about @17-common-pitfalls.md to avoid typical mistakes