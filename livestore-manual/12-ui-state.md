# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## UI State Management with LiveStore Tables

Instead of using React's `useState` or LiveStore's `signal()` for UI state, LiveStore provides a powerful pattern of storing UI state in database tables. This approach offers persistence, debuggability, and a consistent event-sourced architecture for user interface state.

### Why Use UI State Tables?

Traditional UI state management with React state has several limitations:

```tsx
import React from 'react'

// ❌ Traditional approach - state lost on refresh
const [sidebarOpen, setSidebarOpen] = React.useState(false)
const [currentFilter, setCurrentFilter] = React.useState('all')
const [splitPanelSize, setSplitPanelSize] = React.useState(300)
```

**Problems with traditional approach:**
- State is lost on page refresh
- No persistence across browser sessions
- Difficult to debug and replay
- Inconsistent with the rest of your data architecture
- No way to track UI state changes over time

**Benefits of UI state tables:**
- **Persistence**: UI state survives page refreshes and app restarts
- **Synchronous**: No async state management complexity
- **Debuggable**: Can inspect, replay, and debug UI state changes
- **Consistent**: Same event-sourced patterns as business data
- **Local-only**: Can be marked as non-synced so it stays local
- **User Experience**: Users return exactly where they left off

### Basic UI State Table Pattern

Here's a complete example showing how to implement UI state management with LiveStore:

```tsx
import { State, Events, Schema, makeSchema, queryDb } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { LiveStoreProvider, useStore } from '@livestore/react'
import React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'

// Define UI state interface
interface UIState {
  sessionId: string
  sidebarOpen: boolean
  currentFilter: string
  splitPanelSize: number
  splitPanelPosition: 'bottom' | 'side'
  darkMode: boolean
  createdAt: number
  updatedAt: number
}

// Define UI state table
const uiState = State.SQLite.table({
  name: 'ui_state',
  columns: {
    sessionId: State.SQLite.text({ primaryKey: true }),
    sidebarOpen: State.SQLite.boolean({ default: true }),
    currentFilter: State.SQLite.text({ default: 'all' }),
    splitPanelSize: State.SQLite.integer({ default: 300 }),
    splitPanelPosition: State.SQLite.text({ default: 'bottom' }),
    darkMode: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer({ nullable: false }),
    updatedAt: State.SQLite.integer({ nullable: false })
  },
  indexes: [
    { name: 'ui_state_session', columns: ['sessionId'] },
    { name: 'ui_state_updated', columns: ['updatedAt'] }
  ]
})

// Define client-only events for UI state changes
const events = {
  uiStateInitialized: Events.clientOnly({
    name: 'v1.UIStateInitialized',
    schema: Schema.Struct({
      sessionId: Schema.String,
      createdAt: Schema.Number,
      updatedAt: Schema.Number
    })
  }),
  
  sidebarToggled: Events.clientOnly({
    name: 'v1.SidebarToggled',
    schema: Schema.Struct({
      sessionId: Schema.String,
      sidebarOpen: Schema.Boolean,
      updatedAt: Schema.Number
    })
  }),
  
  filterChanged: Events.clientOnly({
    name: 'v1.FilterChanged',
    schema: Schema.Struct({
      sessionId: Schema.String,
      currentFilter: Schema.String,
      updatedAt: Schema.Number
    })
  }),
  
  splitPanelResized: Events.clientOnly({
    name: 'v1.SplitPanelResized',
    schema: Schema.Struct({
      sessionId: Schema.String,
      splitPanelSize: Schema.Number,
      updatedAt: Schema.Number
    })
  }),
  
  splitPanelPositionChanged: Events.clientOnly({
    name: 'v1.SplitPanelPositionChanged',
    schema: Schema.Struct({
      sessionId: Schema.String,
      splitPanelPosition: Schema.String,
      updatedAt: Schema.Number
    })
  }),
  
  darkModeToggled: Events.clientOnly({
    name: 'v1.DarkModeToggled',
    schema: Schema.Struct({
      sessionId: Schema.String,
      darkMode: Schema.Boolean,
      updatedAt: Schema.Number
    })
  })
}

// Define materializers for UI state updates
const materializers = State.SQLite.materializers(events, {
  'v1.UIStateInitialized': (data) =>
    uiState.insert({
      sessionId: data.sessionId,
      sidebarOpen: true,
      currentFilter: 'all',
      splitPanelSize: 300,
      splitPanelPosition: 'bottom',
      darkMode: false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    }),
    
  'v1.SidebarToggled': (data) =>
    uiState.update({
      sidebarOpen: data.sidebarOpen,
      updatedAt: data.updatedAt
    }).where({ sessionId: data.sessionId }),
    
  'v1.FilterChanged': (data) =>
    uiState.update({
      currentFilter: data.currentFilter,
      updatedAt: data.updatedAt
    }).where({ sessionId: data.sessionId }),
    
  'v1.SplitPanelResized': (data) =>
    uiState.update({
      splitPanelSize: data.splitPanelSize,
      updatedAt: data.updatedAt
    }).where({ sessionId: data.sessionId }),
    
  'v1.SplitPanelPositionChanged': (data) =>
    uiState.update({
      splitPanelPosition: data.splitPanelPosition,
      updatedAt: data.updatedAt
    }).where({ sessionId: data.sessionId }),
    
  'v1.DarkModeToggled': (data) =>
    uiState.update({
      darkMode: data.darkMode,
      updatedAt: data.updatedAt
    }).where({ sessionId: data.sessionId })
})

// Create schema
const state = State.SQLite.makeState({ 
  tables: { uiState }, 
  materializers 
})
const schema = makeSchema({ state, events })

// Query for UI state
const createUIStateQuery = (sessionId: string) => queryDb(() => ({
  query: 'SELECT * FROM ui_state WHERE sessionId = ? LIMIT 1',
  bindValues: [sessionId] as const,
  schema: Schema.Array(Schema.Struct({
    sessionId: Schema.String,
    sidebarOpen: Schema.Boolean,
    currentFilter: Schema.String,
    splitPanelSize: Schema.Number,
    splitPanelPosition: Schema.String,
    darkMode: Schema.Boolean,
    createdAt: Schema.Number,
    updatedAt: Schema.Number
  }))
}), { label: `ui-state-${sessionId}`, deps: [sessionId] })

// Custom hook for UI state management
function useUIState(sessionId: string) {
  const { store } = useStore()
  const uiStateResults = store.useQuery(createUIStateQuery(sessionId))
  const currentUIState = uiStateResults[0]
  
  // Initialize UI state if it doesn't exist
  React.useEffect(() => {
    if (!currentUIState) {
      const now = Date.now()
      store.commit(events.uiStateInitialized({
        sessionId,
        createdAt: now,
        updatedAt: now
      }))
    }
  }, [sessionId, currentUIState, store])
  
  // Helper functions for updating UI state
  const toggleSidebar = React.useCallback(() => {
    if (currentUIState) {
      store.commit(events.sidebarToggled({
        sessionId,
        sidebarOpen: !currentUIState.sidebarOpen,
        updatedAt: Date.now()
      }))
    }
  }, [sessionId, currentUIState, store])
  
  const changeFilter = React.useCallback((filter: string) => {
    store.commit(events.filterChanged({
      sessionId,
      currentFilter: filter,
      updatedAt: Date.now()
    }))
  }, [sessionId, store])
  
  const resizeSplitPanel = React.useCallback((size: number) => {
    store.commit(events.splitPanelResized({
      sessionId,
      splitPanelSize: size,
      updatedAt: Date.now()
    }))
  }, [sessionId, store])
  
  const changeSplitPanelPosition = React.useCallback((position: 'bottom' | 'side') => {
    store.commit(events.splitPanelPositionChanged({
      sessionId,
      splitPanelPosition: position,
      updatedAt: Date.now()
    }))
  }, [sessionId, store])
  
  const toggleDarkMode = React.useCallback(() => {
    if (currentUIState) {
      store.commit(events.darkModeToggled({
        sessionId,
        darkMode: !currentUIState.darkMode,
        updatedAt: Date.now()
      }))
    }
  }, [sessionId, currentUIState, store])
  
  // Return current state and update functions
  return {
    uiState: currentUIState,
    toggleSidebar,
    changeFilter,
    resizeSplitPanel,
    changeSplitPanelPosition,
    toggleDarkMode
  }
}

// Main application component
function App() {
  const sessionId = React.useMemo(() => {
    // In a real app, this might be a user ID, session ID, or device ID
    return crypto.randomUUID()
  }, [])
  
  const {
    uiState,
    toggleSidebar,
    changeFilter,
    resizeSplitPanel,
    changeSplitPanelPosition,
    toggleDarkMode
  } = useUIState(sessionId)
  
  // Show loading state while UI state is being initialized
  if (!uiState) {
    return <div>Loading...</div>
  }
  
  return (
    <div className={`app ${uiState.darkMode ? 'dark' : 'light'}`}>
      <header className="app-header">
        <h1>LiveStore UI State Demo</h1>
        <div className="header-controls">
          <button onClick={toggleSidebar}>
            {uiState.sidebarOpen ? 'Hide' : 'Show'} Sidebar
          </button>
          <button onClick={toggleDarkMode}>
            {uiState.darkMode ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </header>
      
      <div className="app-layout">
        {uiState.sidebarOpen && (
          <aside className="sidebar">
            <h3>Filters</h3>
            <div className="filter-controls">
              {['all', 'active', 'completed', 'archived'].map(filter => (
                <button
                  key={filter}
                  onClick={() => changeFilter(filter)}
                  className={uiState.currentFilter === filter ? 'active' : ''}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            <h3>Split Panel</h3>
            <div className="panel-controls">
              <label>
                Position:
                <select
                  value={uiState.splitPanelPosition}
                  onChange={(e) => changeSplitPanelPosition(e.target.value as 'bottom' | 'side')}
                >
                  <option value="bottom">Bottom</option>
                  <option value="side">Side</option>
                </select>
              </label>
              
              <label>
                Size: {uiState.splitPanelSize}px
                <input
                  type="range"
                  min="200"
                  max="600"
                  value={uiState.splitPanelSize}
                  onChange={(e) => resizeSplitPanel(Number(e.target.value))}
                />
              </label>
            </div>
          </aside>
        )}
        
        <main className="main-content">
          <div className="content-header">
            <h2>Current Filter: {uiState.currentFilter}</h2>
            <p>All UI state is persisted in LiveStore and will survive page refreshes!</p>
          </div>
          
          <div className="content-body">
            <p>This is the main content area.</p>
            <p>Sidebar is {uiState.sidebarOpen ? 'open' : 'closed'}</p>
            <p>Dark mode is {uiState.darkMode ? 'enabled' : 'disabled'}</p>
          </div>
        </main>
        
        <div 
          className={`split-panel ${uiState.splitPanelPosition}`}
          style={{ 
            [uiState.splitPanelPosition === 'bottom' ? 'height' : 'width']: 
            `${uiState.splitPanelSize}px` 
          }}
        >
          <h3>Split Panel ({uiState.splitPanelPosition})</h3>
          <p>This panel size and position are persisted in LiveStore</p>
          <p>Current size: {uiState.splitPanelSize}px</p>
        </div>
      </div>
    </div>
  )
}

// Provider setup
function AppWithProvider() {
  const adapter = makeInMemoryAdapter()
  
  return (
    <LiveStoreProvider
      schema={schema}
      storeId="ui-state-demo"
      adapter={adapter}
      batchUpdates={batchUpdates}
    >
      <App />
    </LiveStoreProvider>
  )
}

// Export for module completeness
export { AppWithProvider as UIStateDemo }
```

### Advanced UI State Patterns

#### 1. Multi-User UI State

For applications with multiple users, you can include user identification:

```typescript
import { State } from '@livestore/livestore'

const uiState = State.SQLite.table({
  name: 'ui_state',
  columns: {
    userId: State.SQLite.text({ nullable: false }),
    sessionId: State.SQLite.text({ nullable: false }),
    workspaceId: State.SQLite.text({ nullable: true }),
    // ... other UI state columns
  },
  indexes: [
    { name: 'ui_state_user_session', columns: ['userId', 'sessionId'] },
    { name: 'ui_state_workspace', columns: ['workspaceId'] }
  ]
})
```

#### 2. Form Draft State

Store form drafts that persist across sessions:

```typescript
import { State, Events, Schema } from '@livestore/livestore'

const formDrafts = State.SQLite.table({
  name: 'form_drafts',
  columns: {
    formId: State.SQLite.text({ primaryKey: true }),
    userId: State.SQLite.text({ nullable: false }),
    draftData: State.SQLite.text({ nullable: false }), // JSON string
    lastSavedAt: State.SQLite.integer({ nullable: false }),
    expiresAt: State.SQLite.integer({ nullable: true })
  }
})

// Event for saving draft
const formDraftSaved = Events.clientOnly({
  name: 'v1.FormDraftSaved',
  schema: Schema.Struct({
    formId: Schema.String,
    userId: Schema.String,
    draftData: Schema.String,
    lastSavedAt: Schema.Number,
    expiresAt: Schema.Union(Schema.Number, Schema.Null)
  })
})
```

#### 3. Navigation State

Track navigation history and current location:

```typescript
import { State } from '@livestore/livestore'

const navigationState = State.SQLite.table({
  name: 'navigation_state',
  columns: {
    sessionId: State.SQLite.text({ primaryKey: true }),
    currentRoute: State.SQLite.text({ nullable: false }),
    routeParams: State.SQLite.text({ nullable: true }), // JSON string
    breadcrumbs: State.SQLite.text({ nullable: true }), // JSON array
    lastNavigatedAt: State.SQLite.integer({ nullable: false })
  }
})
```

#### 4. View Preferences

Store user preferences for different views:

```typescript
import { State } from '@livestore/livestore'

const viewPreferences = State.SQLite.table({
  name: 'view_preferences',
  columns: {
    viewId: State.SQLite.text({ primaryKey: true }),
    userId: State.SQLite.text({ nullable: false }),
    displayMode: State.SQLite.text({ default: 'list' }), // 'list', 'grid', 'card'
    sortBy: State.SQLite.text({ default: 'createdAt' }),
    sortOrder: State.SQLite.text({ default: 'desc' }),
    pageSize: State.SQLite.integer({ default: 20 }),
    columns: State.SQLite.text({ nullable: true }), // JSON array of visible columns
    updatedAt: State.SQLite.integer({ nullable: false })
  }
})
```

### Best Practices

#### 1. Session Management

Always use a consistent session identifier:

```typescript
import React from 'react'

// Generate session ID once and reuse
const sessionId = React.useMemo(() => {
  return localStorage.getItem('sessionId') || 
         (() => {
           const id = crypto.randomUUID()
           localStorage.setItem('sessionId', id)
           return id
         })()
}, [])
```

#### 2. Initialization Pattern

Always check if UI state exists before using it:

```typescript
import React from 'react'

interface UIState {
  sidebarOpen: boolean
}

function Component() {
  const sessionId = 'test-session'
  // In a real app, you would get this from your useUIState hook
  const uiState: UIState | null = { sidebarOpen: true }

  if (!uiState) {
    return React.createElement('div', null, 'Loading...')
  }

  // Safe to use uiState here
  return React.createElement('div', null, uiState.sidebarOpen ? 'Open' : 'Closed')
}
```

#### 3. Batching Updates

For related UI state changes, batch them together:

Use `store.commit()` with multiple events to batch related UI state changes. This ensures consistency and reduces the number of database writes.

#### 4. Cleanup Old UI State

Implement cleanup for old UI state:

```typescript
import { Events, Schema } from '@livestore/livestore'

const cleanupOldUIState = Events.clientOnly({
  name: 'v1.CleanupOldUIState',
  schema: Schema.Struct({
    cutoffTime: Schema.Number
  })
})

// Materializer to clean up old state
const materializer = {
  'v1.CleanupOldUIState': (data: { cutoffTime: number }) => ({
    query: 'DELETE FROM ui_state WHERE updatedAt < ?',
    bindValues: [data.cutoffTime]
  })
}
```

### Common Anti-Patterns to Avoid

#### ❌ Using React State for Persistent UI State

Don't use React's `useState` for UI state that should persist across page refreshes. This state will be lost when the user reloads the page.

#### ❌ Not Initializing UI State

Always check if UI state exists before using it. Trying to access undefined UI state will cause runtime errors.

#### ❌ Syncing UI State Across Clients

UI state should be local to each client. Don't use `Events.synced()` for UI state - use `Events.clientOnly()` instead.

#### ❌ Not Using Proper Session Management

Don't generate a new session ID on every render. Use a consistent session identifier that persists across component re-renders.

### Debugging UI State

UI state stored in LiveStore tables can be easily debugged:

- **Inspect current state**: Query the ui_state table directly to see current values
- **View state history**: If you track changes, you can see the full history of UI state modifications
- **Debug with browser tools**: Use browser DevTools to inspect the LiveStore database
- **Replay state changes**: Since UI state uses events, you can replay state changes for debugging

### Performance Considerations

1. **Index your UI state tables** properly for fast lookups
2. **Use session-based cleanup** to prevent unlimited growth
3. **Batch related updates** to reduce database writes
4. **Cache frequently accessed UI state** in memory if needed

### Integration with Testing

UI state in LiveStore tables makes testing easier:

- **Deterministic state**: UI state is stored in the database, making it easy to set up test scenarios
- **Event-based testing**: Test UI state changes by dispatching events and verifying the resulting state
- **Isolated testing**: Each test can use its own session ID to avoid interference
- **Snapshot testing**: You can easily capture and compare UI state snapshots

### Summary

The UI state table pattern in LiveStore provides a robust, persistent, and debuggable way to manage user interface state. By treating UI state as data and using the same event-sourced patterns as your business logic, you create a consistent and maintainable approach to state management that survives page refreshes and provides an excellent user experience.

Key benefits:
- **Persistence** across sessions and page refreshes
- **Debuggability** with full event history
- **Consistency** with your data architecture
- **Synchronous** state management
- **Local-only** with `Events.clientOnly`

This pattern is particularly valuable for complex applications where users expect to return to exactly where they left off, and for applications that need to maintain extensive UI state across multiple views and sessions.