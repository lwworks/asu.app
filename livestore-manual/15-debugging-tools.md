# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Debugging & Development Tools

LiveStore provides powerful built-in DevTools for debugging and inspecting your application's state, queries, and sync status.

### Overview

LiveStore DevTools is a comprehensive debugging interface that gives you real-time insights into:
- Database state and queries
- Event log and sync status
- Reactivity graph and performance
- SQL playground for testing queries

The DevTools are available as:
- A web interface accessible at `/_livestore/web`
- A Chrome extension for enhanced debugging
- Built-in support across all LiveStore adapters

### Installation & Configuration

#### Web Applications (Vite)

Install and configure the DevTools Vite plugin:

```bash
npm install @livestore/devtools-vite --save-dev
```

```tsx
// vite.config.ts
// Note: This shows the configuration pattern
// import { defineConfig } from 'vite'
// import { livestoreDevtoolsPlugin } from '@livestore/devtools-vite'

// export default defineConfig({
//   plugins: [
//     livestoreDevtoolsPlugin({ 
//       schemaPath: './src/livestore/schema.ts' 
//     })
//   ]
// })

// Example configuration structure
const viteConfig = {
  plugins: [
    {
      name: '@livestore/devtools-vite',
      configureServer(server: any) {
        // DevTools plugin configuration
      }
    }
  ]
}
```

The DevTools will be available at `http://localhost:3000/_livestore/web`.

#### Chrome Extension

For the best debugging experience, install the LiveStore DevTools Chrome extension:

1. Download the extension matching your LiveStore version from [GitHub releases](https://github.com/livestorejs/livestore/releases)
2. Unpack the ZIP file (e.g., `livestore-devtools-chrome-0.3.0.zip`)
3. Navigate to `chrome://extensions/` and enable Developer mode
4. Click "Load unpacked" and select the unpacked folder

#### Expo/React Native

Install and configure for Expo apps:

```bash
npm install @livestore/devtools-expo --save-dev
```

```tsx
// metro.config.js
// Note: This shows the configuration pattern
// const { getDefaultConfig } = require('expo/metro-config')
// const { addLiveStoreDevtoolsMiddleware } = require('@livestore/devtools-expo')

// const config = getDefaultConfig(__dirname)
// addLiveStoreDevtoolsMiddleware(config, { 
//   schemaPath: './src/livestore/schema.ts' 
// })

// module.exports = config

// Example configuration structure
const metroConfig = {
  server: {
    enhanceMiddleware: (middleware: any) => {
      // DevTools middleware configuration
      return middleware
    }
  }
}
```

Open DevTools by pressing `Shift+m` in the Expo CLI and selecting `@livestore/devtools-expo`.

#### Node.js Applications

DevTools are automatically configured for persisted adapters:

```tsx
// Node.js adapter configuration
// Note: DevTools are automatically configured for persisted adapters

// Example usage pattern:
// import { makeAdapter } from '@livestore/adapter-node'
// const adapter = makeAdapter({
//   filename: './data/store.db'
// })

// DevTools URL will be logged when the app starts
const nodeConfig = {
  filename: './data/store.db',
  devtools: true // Enabled by default for persisted adapters
}
```

### Core Features

#### Real-time Data Browser

Browse and edit your database tables with live updates:
- View all tables and their data
- Edit values directly in the UI
- Changes sync immediately to your app
- Export data as JSON

#### Query Inspector

Monitor and analyze queries in real-time:
- See all active queries and their performance
- Identify slow queries and bottlenecks
- View query execution plans
- Track reactivity dependencies

#### Event Log Browser

Inspect the event-sourcing log:
- View all events in chronological order
- Filter by event type or time range
- See event metadata and payloads
- Track sync operations

#### Sync Status Monitor

Monitor real-time sync operations:
- Connection status and latency
- Pending events queue
- Sync conflicts and resolution
- Network activity

#### SQLite Playground

Test and experiment with SQL queries:
- Execute arbitrary SQL against your database
- View results in table format
- Save frequently used queries
- Export query results

### Basic Usage

#### Opening DevTools from Your App

Create a DevTools button in your React app:

```tsx
import { useStore } from '@livestore/react'
import React from 'react'

export function DevToolsButton() {
  const { store } = useStore()
  
  const devtoolsUrl = React.useMemo(() => {
    const params = new URLSearchParams({
      storeId: store.storeId,
      sessionId: store.sessionId,
      clientId: store.clientId
    })
    return `${location.origin}/_livestore?${params}`
  }, [store.storeId, store.sessionId, store.clientId])
  
  return (
    <a 
      href={devtoolsUrl} 
      target="_blank"
      rel="noopener noreferrer"
    >
      Open DevTools
    </a>
  )
}
```

#### Using DevTools in Development

Add conditional DevTools access:

```tsx
import { State, Events, Schema, makeSchema } from '@livestore/livestore'

// Your schema setup
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false })
  }
})

// Enable DevTools logging in development
const isDev = process.env.NODE_ENV === 'development'
if (isDev && typeof window !== 'undefined') {
  console.log('LiveStore DevTools available at:', 
    `${location.origin}/_livestore/web`)
}
```

### Debugging Tips

#### 1. Performance Issues

Use the Query Inspector to:
- Identify queries running frequently
- Find queries with high execution time
- Check for missing indexes
- Monitor reactivity update cascades

#### 2. Sync Problems

Check the Sync Status panel for:
- Connection state and errors
- Event queue backlog
- Conflict resolution logs
- Network latency metrics

#### 3. Data Inconsistencies

Use the Data Browser to:
- Compare local vs synced state
- Verify materializer outputs
- Check event application order
- Export data for analysis

#### 4. Reactivity Issues

The Reactivity Graph shows:
- Active query subscriptions
- Signal dependencies
- Update propagation paths
- Unnecessary re-renders

### Common Debugging Patterns

#### Monitoring Store Health

```tsx
// Log DevTools URL on store creation
import type { Store } from '@livestore/livestore'

// Define minimal Store interface for DevTools info
interface DevToolsStore {
  storeId: string
  sessionId: string
  clientId: string
}

export function logDevToolsInfo(store: DevToolsStore) {
  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev && typeof window !== 'undefined') {
    console.log('🔧 LiveStore DevTools:', {
      url: `${location.origin}/_livestore/web`,
      storeId: store.storeId,
      sessionId: store.sessionId,
      clientId: store.clientId
    })
  }
}

// Usage after store creation:
// const store = await createStore(...)
// logDevToolsInfo(store)
```

#### Export for Testing

Use DevTools export feature or programmatically:

```tsx
// Quick export function for debugging
export function exportStoreData(store: any) {
  // This would typically be done through DevTools UI
  // Shown here for reference
  const tables = ['todos', 'users', 'projects']
  const data: Record<string, any[]> = {}
  
  // Note: In practice, use DevTools export feature
  console.log('Use DevTools Export at:', 
    `${location.origin}/_livestore/web`)
}
```

### Next Steps

- Explore @16-tanstack-router-integration.md
- Learn about @17-common-pitfalls.md

> **Note**: LiveStore DevTools is a sponsor-only benefit once LiveStore becomes open source. Early access is currently available for GitHub sponsors.