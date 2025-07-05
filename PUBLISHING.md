# 🚀 RaptorState Publishing Guide

## 📋 Pre-Publishing Checklist ✅

All checks have passed:
- ✅ TypeScript compilation clean
- ✅ Linting passes with no issues  
- ✅ All tests pass successfully
- ✅ Package configuration ready
- ✅ Node.js compatibility ensured

## 📦 Ready for JSR Publishing

### Step 1: Install JSR CLI

```bash
# Install JSR CLI (choose one)
npm install -g @jsr/cli
# OR
deno install -Arf jsr:@jsr/cli
```

### Step 2: Authenticate with JSR

```bash
jsr auth login
```

### Step 3: Dry Run (Recommended)

```bash
jsr publish --dry-run
```

### Step 4: Publish to JSR

```bash
jsr publish
```

## 🔧 Node.js Installation Guide

After publishing, users can install in Node.js projects:

```bash
# For Node.js 18+ projects
npx jsr add @snrraptopack/raptor-state

# Install peer dependencies
npm install effector
# Optional: for React integration
npm install effector-react
```

## 📖 Usage Examples

### Basic Usage (Works in Both Deno & Node.js)

```typescript
import { State, computed, asyncState } from "@snrraptopack/raptor-state"

// Simple state
const counter = State(0)
counter.set(10)
console.log(counter.value) // 10

// Computed state
const doubled = computed([counter.$state], (count) => count * 2)
console.log(doubled.value) // 20

// Async state
const userApi = asyncState(async (id: number) => {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
})

await userApi.execute(123)
console.log(userApi.data.value) // User data
```

### React Integration

```typescript
import { useRaptorState } from "@snrraptopack/raptor-state/react"

function Counter() {
  const counter = State(0)
  const count = useRaptorState(counter)
  
  return (
    <button onClick={() => counter.set(count + 1)}>
      Count: {count}
    </button>
  )
}
```

## 🎯 Package Features

- **🦖 Simple API** - Intuitive state management
- **📘 TypeScript** - Full type safety
- **⚡ Performance** - Built on Effector
- **🔄 Reactive** - Automatic updates
- **🌐 Universal** - Works in Deno, Node.js, Browser
- **⚛️ React Ready** - Optional hooks included
- **📦 Zero Config** - Works out of the box

## 📄 File Structure

```
raptor-state/
├── src/           # Modular source files
├── mod.ts         # Main export file
├── README.md      # Documentation
├── jsr.json       # JSR configuration
├── package.json   # Node.js compatibility
└── test-clean.ts  # Test suite
```

Ready to publish! 🚀
