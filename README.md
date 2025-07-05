# RaptorState 🦖

A clean, focused state management library built on Effector. **No over-engineering, just the APIs you actually need.**

## Why RaptorState?

### ❌ The Problem with Current Solutions

```typescript
// Traditional React state management
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

### ✅ The RaptorState Solution

```typescript
// Clean, declarative state management
const userApi = fetchState("/api/users/123")

function UserProfile() {
  const { data, isLoading, hasError, execute } = useAsyncState(userApi)
  
  useEffect(() => execute(), []) // One line for initial load
  
  if (isLoading) return <Loading />
  if (hasError) return <Error />
  return <UserCard user={data} />
}
```

## Core Philosophy

1. **Simple API** - Only 5 functions: `State()`, `computed()`, `asyncState()`, `fetchState()`, `mutationState()`
2. **No useEffect Hell** - Built-in async handling with loading/error states
3. **Type Safe** - Full TypeScript support with proper inference
4. **React Ready** - Optional hooks that work seamlessly

---

## Installation

### Deno (JSR)
```typescript
import { State, computed, asyncState, fetchState } from "jsr:@yourusername/raptor-state"
```

### Node.js (NPM)
```bash
npm install raptor-state effector

# For React projects
npm install effector-react
```

---

## 📚 Complete Guide

### 🟢 Beginner: Basic State Management

#### Your First State

```typescript
import { State } from "raptor-state"

// Create a simple counter
const count = State(0)

// Read the current value
console.log(count.value) // 0

// Update the value
count.set(5)
console.log(count.value) // 5

// Update with a function
count.update(prev => prev + 1)
console.log(count.value) // 6
```

#### Working with Objects

```typescript
// User state
const user = State({ 
  name: "John", 
  age: 30, 
  email: "john@example.com" 
})

// Update specific fields
user.update(prev => ({ 
  ...prev, 
  age: prev.age + 1 
}))

console.log(user.value) // { name: "John", age: 31, email: "john@example.com" }
```

#### Listening to Changes

```typescript
const message = State("Hello")

// Subscribe to changes
const unsubscribe = message.subscribe(value => {
  console.log("Message changed:", value)
})

message.set("World") // Logs: "Message changed: World"
message.set("RaptorState") // Logs: "Message changed: RaptorState"

// Clean up when done
unsubscribe()
```

#### Null and Undefined Handling

```typescript
const optional = State<string | null>(null)

console.log(optional.value) // null

// Safe checking
if (optional.value !== null) {
  console.log(optional.value.toUpperCase())
}

// Set a value
optional.set("hello")
console.log(optional.value) // "hello"

// Clear it
optional.reset() // Back to initial value (null)
```

### 🟡 Intermediate: Computed States and Data Fetching

#### Computed States (Derived Values)

```typescript
import { computed } from "raptor-state"

const firstName = State("John")
const lastName = State("Doe")

// Automatically updates when dependencies change
const fullName = computed(
  [firstName.$state, lastName.$state],
  (first, last) => `${first} ${last}`
)

console.log(fullName.value) // "John Doe"

firstName.set("Jane")
console.log(fullName.value) // "Jane Doe" - automatically updated!
```

#### Multiple Dependencies

```typescript
const price = State(100)
const quantity = State(2)
const taxRate = State(0.1)

const total = computed(
  [price.$state, quantity.$state, taxRate.$state],
  (p, q, tax) => (p * q) * (1 + tax)
)

console.log(total.value) // 220

quantity.set(3)
console.log(total.value) // 330 - automatically recalculated!
```

#### Your First API Call

```typescript
import { asyncState } from "raptor-state"

// Define an async operation
const userApi = asyncState(async (userId: number) => {
  const response = await fetch(`/api/users/${userId}`)
  if (!response.ok) throw new Error('Failed to fetch user')
  return response.json()
})

// Execute it
userApi.execute(123)

// Check the results
console.log(userApi.isLoading) // true initially, then false
console.log(userApi.data.value) // null initially, then user data
console.log(userApi.hasError) // false if successful
```

#### Built-in Fetch (Most Common Case)

```typescript
import { fetchState } from "raptor-state"

// Simple GET request
const posts = fetchState<Post[]>("/api/posts")
const user = fetchState<User>("/api/users/123")

// Execute the requests
posts.execute()
user.execute()

// Access the data
console.log(posts.data.value) // Array of posts
console.log(posts.isLoading) // Loading state
console.log(posts.hasError) // Error state
```

### 🔴 Advanced: Complex Patterns and React Integration

#### Form Handling with Validation

```typescript
const loginForm = State({
  email: "",
  password: ""
})

const loginApi = mutationState(async (credentials) => {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  })
  return response.json()
})

// Validation
const isFormValid = computed(
  [loginForm.$state],
  (form) => form?.email.includes("@") && form?.password.length >= 6
)

// Usage
loginForm.update(prev => ({ ...prev, email: "user@example.com" }))
loginForm.update(prev => ({ ...prev, password: "secret123" }))

if (isFormValid.value) {
  loginApi.execute(loginForm.value)
}
```

#### Global State Management

```typescript
// store/auth.ts
export const currentUser = State<User | null>(null)
export const isAuthenticated = computed(
  [currentUser.$state],
  (user) => user !== null
)

export const logout = () => {
  currentUser.set(null)
}

// store/todos.ts
export const todos = State<Todo[]>([])
export const completedTodos = computed(
  [todos.$state],
  (todoList) => todoList?.filter(todo => todo.completed) || []
)

export const addTodo = (text: string) => {
  todos.update(prev => [
    ...(prev || []),
    { id: Date.now(), text, completed: false }
  ])
}
```

#### Advanced Async Patterns

```typescript
// Dependent API calls
const userId = State(123)
const userApi = asyncState(async (id: number) => {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
})

const userPostsApi = asyncState(async (userId: number) => {
  const response = await fetch(`/api/users/${userId}/posts`)
  return response.json()
})

// Execute in sequence
userId.subscribe(async (id) => {
  if (id) {
    await userApi.execute(id)
    await userPostsApi.execute(id)
  }
})

// Pagination
const currentPage = State(1)
const postsApi = asyncState(async (page: number) => {
  const response = await fetch(`/api/posts?page=${page}&limit=10`)
  return response.json()
})

currentPage.subscribe(page => {
  postsApi.execute(page)
})

// Load more pattern
const allPosts = State<Post[]>([])
postsApi.data.subscribe(newPosts => {
  if (newPosts) {
    allPosts.update(prev => [...(prev || []), ...newPosts])
  }
})
```

---

## ⚛️ React Integration

### Setup

```bash
npm install effector-react
```

```typescript
// App.tsx or index.tsx
import { useUnit } from "effector-react"
import { setupReactIntegration } from "raptor-state"

// One-time setup
setupReactIntegration(useUnit)
```

### Basic Usage

```typescript
import { useRaptorState, useAsyncState } from "raptor-state"

function Counter() {
  const count = State(0)
  const value = useRaptorState(count)
  
  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={() => count.set(value + 1)}>
        Increment
      </button>
    </div>
  )
}
```

### Data Fetching Components

```typescript
function UserProfile({ userId }: { userId: number }) {
  const userApi = fetchState<User>(`/api/users/${userId}`)
  const { data: user, isLoading, hasError, execute } = useAsyncState(userApi)
  
  useEffect(() => {
    execute()
  }, [userId])
  
  if (isLoading) return <div>Loading user...</div>
  if (hasError) return <div>Failed to load user</div>
  if (!user) return <div>User not found</div>
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  )
}
```

### Form Components

```typescript
function LoginForm() {
  const form = State({ email: "", password: "" })
  const loginApi = mutationState(loginUser)
  
  const formData = useRaptorState(form)
  const { isLoading, hasError, execute } = useAsyncState(loginApi)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    execute(formData)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData?.email || ""}
        onChange={(e) => 
          form.update(prev => ({ ...prev, email: e.target.value }))
        }
        placeholder="Email"
      />
      <input
        type="password"
        value={formData?.password || ""}
        onChange={(e) => 
          form.update(prev => ({ ...prev, password: e.target.value }))
        }
        placeholder="Password"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
      {hasError && <div>Login failed. Please try again.</div>}
    </form>
  )
}
```

### Global State in Components

```typescript
// store.ts
export const cartItems = State<CartItem[]>([])
export const cartTotal = computed(
  [cartItems.$state],
  (items) => items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
)

// CartSummary.tsx
function CartSummary() {
  const items = useRaptorState(cartItems)
  const total = useComputed(cartTotal)
  
  return (
    <div>
      <p>{items?.length || 0} items in cart</p>
      <p>Total: ${total.toFixed(2)}</p>
    </div>
  )
}

// ProductCard.tsx
function ProductCard({ product }: { product: Product }) {
  const addToCart = () => {
    cartItems.update(prev => [
      ...(prev || []),
      { id: product.id, name: product.name, price: product.price, quantity: 1 }
    ])
  }
  
  return (
    <div>
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={addToCart}>Add to Cart</button>
    </div>
  )
}
```

### Real-World App Example

```typescript
// App.tsx
function App() {
  const user = useRaptorState(currentUser)
  const isAuth = useComputed(isAuthenticated)
  
  if (!isAuth) {
    return <LoginPage />
  }
  
  return (
    <div>
      <Header user={user} />
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  )
}

// Dashboard.tsx
function Dashboard() {
  const stats = fetchState<DashboardStats>("/api/dashboard")
  const { data, isLoading, execute } = useAsyncState(stats)
  
  useEffect(() => execute(), [])
  
  return (
    <div>
      <h1>Dashboard</h1>
      {isLoading ? (
        <Skeleton />
      ) : (
        <StatsGrid stats={data} />
      )}
    </div>
  )
}
```

---

## 🚀 Benefits Over Other Solutions

### vs Redux/Redux Toolkit

```typescript
// ❌ Redux - Too much boilerplate
const userSlice = createSlice({
  name: 'user',
  initialState: { data: null, loading: false, error: null },
  reducers: {
    fetchUserStart: (state) => { state.loading = true },
    fetchUserSuccess: (state, action) => { 
      state.loading = false
      state.data = action.payload 
    },
    fetchUserFailure: (state, action) => { 
      state.loading = false
      state.error = action.payload 
    }
  }
})

// ✅ RaptorState - One line
const userApi = fetchState("/api/users/123")
```

### vs Zustand

```typescript
// ❌ Zustand - Manual state management
const useUserStore = create((set) => ({
  user: null,
  loading: false,
  error: null,
  fetchUser: async (id) => {
    set({ loading: true })
    try {
      const user = await fetchUser(id)
      set({ user, loading: false })
    } catch (error) {
      set({ error, loading: false })
    }
  }
}))

// ✅ RaptorState - Automatic state management
const userApi = fetchState("/api/users/123")
// Loading, error, and data states handled automatically
```

### vs Raw useEffect

```typescript
// ❌ useEffect - Lots of boilerplate and pitfalls
function UserComponent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    
    fetchUser(123)
      .then(userData => {
        if (!cancelled) {
          setUser(userData)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      })
    
    return () => { cancelled = true }
  }, [])
  
  // Component code...
}

// ✅ RaptorState - Clean and safe
const userApi = fetchState("/api/users/123")

function UserComponent() {
  const { data, isLoading, hasError, execute } = useAsyncState(userApi)
  
  useEffect(() => execute(), [])
  
  // Component code...
}
```

## 📋 Complete API Reference

### Core Functions

#### `State<T>(initialValue?: T | null)`
```typescript
const state = State(initialValue)

// Properties
state.value          // Current value
state.$state         // Effector store (for computed)

// Methods  
state.set(newValue)  // Set new value
state.update(fn)     // Update with function
state.reset()        // Reset to initial
state.subscribe(fn)  // Listen to changes
```

#### `computed<T>(dependencies, computeFn)`
```typescript
const computed = computed(
  [state1.$state, state2.$state],
  (val1, val2) => val1 + val2
)

// Properties
computed.value       // Current computed value
computed.$state      // Effector store
computed.subscribe(fn) // Listen to changes
```

#### `asyncState<Params, Data>(handler, initialData?)`
```typescript
const api = asyncState(async (params) => {
  // Async operation
  return data
}, initialData)

// States
api.data            // StateInstance<Data>
api.loading         // StateInstance<boolean>  
api.error           // StateInstance<Error | null>

// Methods
api.execute(params) // Execute the operation
api.reset()         // Reset all states

// Computed properties
api.isLoading       // boolean
api.hasError        // boolean
api.hasData         // boolean
```

#### `fetchState<T>(url, options?)`
```typescript
const api = fetchState<ResponseType>("/api/endpoint", {
  method: "GET",
  headers: { "Authorization": "Bearer token" }
})

// Same interface as asyncState
api.execute()       // Execute the fetch
```

#### `mutationState<Params, Data>(handler)`
```typescript
const mutation = mutationState(async (data) => {
  // POST/PUT/DELETE operation
  return response
})

// Same interface as asyncState
mutation.execute(data)
```

### React Hooks

#### `useRaptorState<T>(state)`
```typescript
const value = useRaptorState(myState)
// Returns current value, triggers re-render on change
```

#### `useAsyncState<T>(asyncState)`
```typescript
const { 
  data, 
  loading, 
  error, 
  execute, 
  isLoading, 
  hasError, 
  hasData, 
  reset 
} = useAsyncState(myAsyncState)
```

#### `useComputed<T>(computed)`
```typescript
const value = useComputed(myComputed)
// Returns current computed value, triggers re-render on change
```

## 🎯 Best Practices

### 1. Organize Your State
```typescript
// store/auth.ts
export const currentUser = State<User | null>(null)
export const isAuthenticated = computed([currentUser.$state], user => !!user)

// store/cart.ts  
export const cartItems = State<CartItem[]>([])
export const cartTotal = computed([cartItems.$state], calculateTotal)

// store/api.ts
export const productsApi = fetchState<Product[]>("/api/products")
export const createProductApi = mutationState(createProduct)
```

### 2. Error Handling
```typescript
const api = fetchState("/api/data")

function MyComponent() {
  const { data, isLoading, hasError, error, execute } = useAsyncState(api)
  
  if (hasError) {
    return <ErrorBoundary error={error.value} onRetry={() => execute()} />
  }
  
  // Rest of component...
}
```

### 3. Loading States
```typescript
function DataList() {
  const { data, isLoading } = useAsyncState(listApi)
  
  return (
    <div>
      {isLoading && <Spinner />}
      {data?.map(item => <Item key={item.id} data={item} />)}
    </div>
  )
}
```

### 4. Form Patterns
```typescript
const form = State({ name: "", email: "" })
const submitApi = mutationState(submitForm)

const isFormValid = computed(
  [form.$state],
  (formData) => formData?.name && formData?.email?.includes("@")
)

function FormComponent() {
  const formData = useRaptorState(form)
  const isValid = useComputed(isFormValid)
  const { isLoading, execute } = useAsyncState(submitApi)
  
  return (
    <form onSubmit={() => execute(formData)}>
      {/* form fields */}
      <button disabled={!isValid || isLoading}>
        Submit
      </button>
    </form>
  )
}
```

---

## 🏆 Why Choose RaptorState?

### ✅ **Simple**: Only 5 functions to learn
### ✅ **Powerful**: Handles 95% of real-world state needs  
### ✅ **Type Safe**: Full TypeScript support
### ✅ **React Ready**: No useEffect dependency hell
### ✅ **Performant**: Built on Effector's proven architecture
### ✅ **Focused**: No over-engineering, just what you need

**RaptorState gets out of your way and lets you build great apps.** 🦖
