# RaptorState 🦖

A clean, focused state management library built on Effector. No over-engineering, just the APIs you actually need.

## Core Philosophy

- **Simple API**: `State(value)`, `computed()`, `asyncState()` - that's it
- **No useEffect**: Built-in async handling replaces useEffect patterns
- **Type Safe**: Full TypeScript support with proper inference
- **React Ready**: Optional React hooks with `effector-react`

## Installation

### Deno (JSR)
```typescript
import { State, computed, asyncState } from "jsr:@yourusername/raptor-state"
```

### Node.js (NPM)
```bash
npm install raptor-state effector
# For React: npm install effector-react
```

## Core APIs

### 1. Basic State

```typescript
import { State } from "raptor-state"

// Simple state
const count = State(0)
count.set(5)
count.update(prev => prev + 1)
console.log(count.value) // 6

// Complex state
const user = State({ name: "John", email: "john@example.com" })
user.update(prev => ({ ...prev, age: 30 }))
```

### 2. Computed State

```typescript
import { computed } from "raptor-state"

const firstName = State("John")
const lastName = State("Doe")

const fullName = computed(
  [firstName.$state, lastName.$state],
  (first, last) => `${first} ${last}`
)

console.log(fullName.value) // "John Doe"
```

### 3. Async State (Replaces useEffect!)

```typescript
import { asyncState, fetchState, mutationState } from "raptor-state"

// Generic async operation
const userApi = asyncState(async (id: number) => {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
})

// Built-in fetch (most common case)
const postsApi = fetchState("/api/posts")

// Mutations (POST/PUT/DELETE)
const createUser = mutationState(async (userData) => {
  const response = await fetch("/api/users", {
    method: "POST",
    body: JSON.stringify(userData)
  })
  return response.json()
})

// Execute operations
userApi.execute(123)
postsApi.execute()
createUser.execute({ name: "Jane" })

// Check states
console.log(userApi.isLoading) // true/false
console.log(userApi.data.value) // API response
console.log(userApi.hasError) // true/false
```

## React Integration

```bash
npm install effector-react
```

```typescript
import { useRaptorState, useAsyncState } from "raptor-state"

function UserProfile() {
  // Basic state
  const user = State({ name: "", email: "" })
  const userValue = useRaptorState(user)

  // Async state (no useEffect needed!)
  const userApi = asyncState(fetchUser)
  const { data, isLoading, hasError, execute } = useAsyncState(userApi)

  return (
    <div>
      <input 
        value={userValue?.name || ""} 
        onChange={(e) => user.update(prev => ({ ...prev, name: e.target.value }))}
      />
      
      <button onClick={() => execute(123)} disabled={isLoading}>
        {isLoading ? "Loading..." : "Fetch User"}
      </button>
      
      {data && <div>Welcome {data.name}!</div>}
      {hasError && <div>Error occurred</div>}
    </div>
  )
}
```

## Why This API?

### ❌ Before (with useEffect)
```typescript
function UserProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchUser(123)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  // More boilerplate...
}
```

### ✅ After (with RaptorState)
```typescript
const userApi = asyncState(fetchUser)

function UserProfile() {
  const { data, isLoading, hasError, execute } = useAsyncState(userApi)
  
  return (
    <button onClick={() => execute(123)}>
      {isLoading ? "Loading..." : "Fetch User"}
    </button>
  )
}
```

## Project Structure

```
src/
├── types.ts      # TypeScript interfaces
├── state.ts      # Core State() function
├── computed.ts   # Computed state
├── async.ts      # Async operations
└── react.ts      # React integration
mod.ts            # Main exports
```

## Real-World Examples

### Data Fetching
```typescript
// Replace useEffect patterns
const todos = fetchState<Todo[]>("/api/todos")
const user = fetchState<User>("/api/user/123")

todos.execute()
user.execute()
```

### Form Handling
```typescript
const form = State({ email: "", password: "" })
const submitForm = mutationState(async (data) => {
  return fetch("/api/login", { method: "POST", body: JSON.stringify(data) })
})

// In component
form.update(prev => ({ ...prev, email: "user@example.com" }))
submitForm.execute(form.value)
```

### Global State
```typescript
// Global user state
export const currentUser = State<User | null>(null)
export const isAuthenticated = computed(
  [currentUser.$state], 
  (user) => user !== null
)

// Use anywhere
import { currentUser } from "./store"
currentUser.set(userData)
```

This gives you everything you need for state management without the complexity!
