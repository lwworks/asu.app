# LiveStore Documentation

This is part of the LiveStore Ultimate Manual v2.

## Type Safety & Schema Design

LiveStore provides comprehensive type safety through its Schema API, ensuring data integrity at both compile-time and runtime.

### Keep It Simple

**Start with the basics.** Most applications only need:
- Simple `Schema.Struct` definitions for your data types
- Basic table definitions with `State.SQLite.table()`
- Standard column types: `text()`, `integer()`, `boolean()`
- The table's built-in `rowSchema` for queries

Only add complexity when you have a specific need. The advanced features exist for edge cases, not everyday use.

### Schema Definition Patterns

```tsx
import { State, Schema, Events, makeSchema, createStorePromise, queryDb, signal } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

// ============================================
// BASIC SCHEMA TYPES
// ============================================
// LiveStore provides these schema types for validation:
// - Schema.String: validates strings
// - Schema.Number: validates numbers (integers and floats)  
// - Schema.Boolean: validates true/false
// - Schema.Literal: validates exact values
// - Schema.Union: validates one of several types
// - Schema.Struct: validates objects with specific properties
// - Schema.Array: validates arrays of a specific type
// - Schema.Record: validates objects with dynamic keys
// - Schema.Unknown: for any type (avoid when possible)

// ============================================
// OPTIONAL VALUES
// ============================================
// Use Schema.optional for optional fields (can be undefined)
// Use nullable: true in table columns for NULL values in SQL

// ============================================
// DEFINING COMPLEX SCHEMAS
// ============================================

// User schema with various field types
const UserSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  age: Schema.Number,
  isActive: Schema.Boolean,
  role: Schema.Union(
    Schema.Literal('admin'),
    Schema.Literal('user'),
    Schema.Literal('guest')
  ),
  // Optional field - can be undefined
  bio: Schema.optional(Schema.String),
  // For nullable database fields, handle at table definition level
  deletedAt: Schema.optional(Schema.Number)
})

// Extract TypeScript type from schema
type User = Schema.Schema.Type<typeof UserSchema>
// Result: {
//   id: string
//   name: string  
//   email: string
//   age: number
//   isActive: boolean
//   role: 'admin' | 'user' | 'guest'
//   bio?: string
//   deletedAt?: number
// }

// ============================================
// NESTED AND ARRAY SCHEMAS
// ============================================
// When to use: Only when you need to store complex structured data
// Alternative: Consider separate tables with relations instead

// Define a schema for tags
const TagSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  color: Schema.String
})

// Post schema with nested objects and arrays
const PostSchema = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  content: Schema.String,
  authorId: Schema.String,
  // Array of tag objects
  tags: Schema.Array(TagSchema),
  // Nested object for metadata
  metadata: Schema.Struct({
    views: Schema.Number,
    likes: Schema.Number,
    readTime: Schema.Number,
    // Record type for dynamic key-value pairs
    customFields: Schema.Record({ key: Schema.String, value: Schema.Unknown })
  }),
  publishedAt: Schema.optional(Schema.Number),
  createdAt: Schema.Number,
  updatedAt: Schema.Number
})

type Post = Schema.Schema.Type<typeof PostSchema>

// ============================================
// TABLE DEFINITIONS WITH SCHEMAS
// ============================================

// Define tables that match our schemas
const users = State.SQLite.table({
  name: 'users',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ nullable: false }),
    email: State.SQLite.text({ nullable: false }),
    age: State.SQLite.integer({ nullable: false }),
    isActive: State.SQLite.boolean({ default: true }),
    role: State.SQLite.text({ nullable: false }),
    bio: State.SQLite.text({ nullable: true }),
    // nullable: true allows NULL in the database
    deletedAt: State.SQLite.integer({ nullable: true })
  }
})

const postsTable = State.SQLite.table({
  name: 'posts',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    title: State.SQLite.text({ nullable: false }),
    content: State.SQLite.text({ nullable: false }),
    authorId: State.SQLite.text({ nullable: false }),
    // JSON columns for complex data - stored as text in SQLite
    // When to use JSON: For truly dynamic/unstructured data
    // Alternative: Use separate tables with proper relations
    tags: State.SQLite.text({ nullable: false }), // Store as JSON
    metadata: State.SQLite.text({ nullable: false }), // Store as JSON
    publishedAt: State.SQLite.integer({ nullable: true }),
    createdAt: State.SQLite.integer({ nullable: false }),
    updatedAt: State.SQLite.integer({ nullable: false })
  }
})

// ============================================
// EVENTS WITH SCHEMA VALIDATION
// ============================================

const events = {
  // Reuse schemas for event validation
  userCreated: Events.synced({
    name: 'user.created',
    schema: UserSchema
  }),
  
  // Custom schema for specific event needs
  userRoleChanged: Events.synced({
    name: 'user.roleChanged',
    schema: Schema.Struct({
      userId: Schema.String,
      oldRole: Schema.Union(
        Schema.Literal('admin'),
        Schema.Literal('user'),
        Schema.Literal('guest')
      ),
      newRole: Schema.Union(
        Schema.Literal('admin'),
        Schema.Literal('user'),
        Schema.Literal('guest')
      ),
      changedBy: Schema.String,
      reason: Schema.optional(Schema.String)
    })
  }),
  
  postPublished: Events.synced({
    name: 'post.published',
    schema: Schema.Struct({
      postId: Schema.String,
      publishedAt: Schema.Number
    })
  })
}

// ============================================
// MATERIALIZERS WITH TYPE SAFETY
// ============================================

const materializers = State.SQLite.materializers(events, {
  'user.created': (user) => 
    // TypeScript knows 'user' matches UserSchema
    users.insert({
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      isActive: user.isActive,
      role: user.role,
      bio: user.bio ?? null, // Convert undefined to null for SQLite
      deletedAt: user.deletedAt ?? null
    }),
    
  'user.roleChanged': ({ userId, newRole }) =>
    users.update({ role: newRole }).where({ id: userId }),
    
  'post.published': ({ postId, publishedAt }) =>
    postsTable.update({ publishedAt }).where({ id: postId })
})

// ============================================
// QUERIES WITH SCHEMA VALIDATION
// ============================================

const state = State.SQLite.makeState({ 
  tables: { users, posts: postsTable }, 
  materializers 
})

const schema = makeSchema({ state, events })

const store = await createStorePromise({
  schema,
  adapter: makeInMemoryAdapter(),
  storeId: 'blog-app'
})

// Type-safe query with schema validation
const activeUsersQuery = queryDb(() => ({
  query: 'SELECT * FROM users WHERE isActive = 1 AND deletedAt IS NULL',
  bindValues: [] as const,
  schema: Schema.Array(UserSchema)
}))

// Query with JSON parsing for complex columns
// Note: We'll parse JSON in application code after retrieval
const postsQuery = queryDb(() => ({
  query: `
    SELECT 
      id, title, content, authorId,
      tags, metadata,
      publishedAt, createdAt, updatedAt
    FROM posts 
    WHERE publishedAt IS NOT NULL
    ORDER BY publishedAt DESC
  `,
  bindValues: [] as const,
  // Define schema for raw database results
  schema: Schema.Array(Schema.Struct({
    id: Schema.String,
    title: Schema.String,
    content: Schema.String,
    authorId: Schema.String,
    tags: Schema.String, // JSON string from DB
    metadata: Schema.String, // JSON string from DB
    publishedAt: Schema.Union(Schema.Number, Schema.Null),
    createdAt: Schema.Number,
    updatedAt: Schema.Number
  }))
}))

// Parse JSON after querying
const postsData = store.query(postsQuery).map(post => ({
  ...post,
  tags: JSON.parse(post.tags),
  metadata: JSON.parse(post.metadata)
}))

// ============================================
// RUNTIME VALIDATION EXAMPLES
// ============================================
// When to use: Validating data from external sources (user input, APIs)
// Don't use: For data already in LiveStore (it's already validated)

// Schema.decodeSync validates and returns typed data synchronously
function validateUserInput(input: unknown): User {
  try {
    // This will throw if validation fails
    return Schema.decodeUnknownSync(UserSchema)(input)
  } catch (error) {
    console.error('Invalid user data:', error)
    throw new Error('User validation failed')
  }
}

// Schema.is checks if data matches schema (returns boolean)
function isValidPost(data: unknown): data is Post {
  return Schema.is(PostSchema)(data)
}

// ============================================
// WORKING WITH DATES
// ============================================
// When to use: Storing timestamps as integers (milliseconds since epoch)
// This is the recommended approach for dates in SQLite

// LiveStore provides Schema.DateFromNumber for timestamp columns
const EventSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  // Use DateFromNumber for timestamps stored as integers
  scheduledAt: Schema.DateFromNumber,
  createdAt: Schema.DateFromNumber
})

const eventsTable = State.SQLite.table({
  name: 'events',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ nullable: false }),
    // Store dates as integer timestamps
    scheduledAt: State.SQLite.integer({ 
      nullable: false, 
      schema: Schema.DateFromNumber 
    }),
    createdAt: State.SQLite.integer({ 
      nullable: false,
      schema: Schema.DateFromNumber
    })
  }
})

// ============================================
// WORKING WITH SIGNALS AND REACTIVE QUERIES
// ============================================
// When to use: UI filters, search boxes, user preferences
// Don't use: For data that should be stored - use events instead

// Create reactive signals for filtering
const activeOnly = signal<boolean>(false)

// Simple reactive query that depends on a signal
const userListQuery = queryDb((get) => {
  const showActiveOnly = get(activeOnly) // Subscribe to signal
  
  if (showActiveOnly) {
    return {
      query: 'SELECT * FROM users WHERE isActive = 1 ORDER BY name',
      bindValues: [] as const,
      schema: Schema.Array(users.rowSchema)
    }
  }
  
  return {
    query: 'SELECT * FROM users ORDER BY name',
    bindValues: [] as const,
    schema: Schema.Array(users.rowSchema)
  }
})

// ============================================
// ADVANCED: SCHEMA TRANSFORMATIONS
// ============================================
// When to use: Custom data formats, normalization, legacy compatibility
// Most apps don't need this - stick with standard types

// Use Schema.transform for custom transformations
const NormalizedEmailSchema = Schema.transform(
  Schema.String,
  Schema.String,
  {
    decode: (email) => email.toLowerCase().trim(),
    encode: (email) => email
  }
)

// Boolean stored as integer in SQLite
const SqliteBooleanSchema = Schema.transform(
  Schema.Number,
  Schema.Boolean,
  {
    decode: (n) => n === 1,
    encode: (b) => b ? 1 : 0
  }
)

// ============================================
// USING TABLE ROW SCHEMAS
// ============================================

// Tables automatically have a rowSchema property
const todosTable = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false })
  }
})

// Use the table's rowSchema in queries
const todosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos',
  bindValues: [] as const,
  schema: Schema.Array(todosTable.rowSchema)
}))
```

### Best Practices

1. **Start Simple**: Use basic types and table.rowSchema. That's enough for 90% of use cases.

2. **Add Complexity Only When Needed**:
   - Optional fields? Only if data can actually be missing
   - JSON columns? Only for truly dynamic data
   - Custom transformations? Only for special formats
   - Schema validation? Only for external/untrusted data

3. **Prefer Separate Tables**: Instead of complex nested schemas, use proper relational design.

4. **Use Built-in Features**: 
   - `table.rowSchema` for queries (don't redefine schemas)
   - `Schema.DateFromNumber` for timestamps
   - Standard column types for everything else

5. **Keep Schemas Close to Tables**: Define them together so they stay in sync.

### Common Patterns - Start Here

```tsx
import { Schema, State, queryDb } from '@livestore/livestore'

// The basics - this is all most apps need:

// 1. Define a simple schema
const TodoSchema = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean
})

// 2. Create a matching table
const todos = State.SQLite.table({
  name: 'todos',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    text: State.SQLite.text({ nullable: false }),
    completed: State.SQLite.boolean({ default: false })
  }
})

// 3. Query using the table's built-in rowSchema
const todosQuery = queryDb(() => ({
  query: 'SELECT * FROM todos ORDER BY id',
  bindValues: [] as const,
  schema: Schema.Array(todos.rowSchema) // This is the key pattern!
}))

// That's it! Only add more complexity when you actually need it.
```

### Advanced Patterns - Only When Needed

```tsx
import { Schema } from '@livestore/livestore'

// Optional fields (when data might be missing)
const UserSchema = Schema.Struct({
  name: Schema.String,
  bio: Schema.optional(Schema.String) // Can be undefined
})

// Enums (when you have a fixed set of values)
const StatusSchema = Schema.Union(
  Schema.Literal('pending'),
  Schema.Literal('active'),
  Schema.Literal('completed')
)

// External data validation (when accepting user input)
function validateUserInput(data: unknown) {
  return Schema.decodeUnknownSync(UserSchema)(data)
}

// Dates (when storing timestamps)
const EventSchema = Schema.Struct({
  id: Schema.String,
  createdAt: Schema.DateFromNumber // Stored as integer, used as Date
})
```

### Next Steps

- Learn about @05-core-apis.md for working with stores and queries
- Explore @07-query-patterns.md for complex data fetching
- Read about @13-migrations.md for evolving your schema over time