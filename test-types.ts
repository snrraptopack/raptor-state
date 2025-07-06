import { State } from "./main.ts";

// Test 1: Non-null state (should not allow null/undefined)
console.log("=== Test 1: Non-null State ===");
const todoInput = State(""); // This should be NonNullStateInstance<string>
const todos = State<Array<{ id: number; text: string; completed: boolean }>>([]);

// This should work without TypeScript errors
function addTodo() {
  const text = todoInput.value.trim(); // No more TypeScript error!
  if (text) {
    todos.update((prev) => [
      ...prev,
      { id: Date.now(), text, completed: false }
    ]);
    todoInput.set("");
  }
}

console.log("Initial todoInput:", todoInput.value);
console.log("Initial todos:", todos.value);

todoInput.set("Learn RaptorState");
addTodo();
console.log("After adding todo:", todos.value);

// Test 2: Nullable state
console.log("\n=== Test 2: Nullable State ===");
const optionalUser = State<{ name: string; age: number } | null>(null);

console.log("Optional user (initial):", optionalUser.value);

// This should require null check
if (optionalUser.value !== null) {
  console.log("User name:", optionalUser.value.name);
}

optionalUser.set({ name: "John", age: 30 });
console.log("Optional user (after set):", optionalUser.value);

// Test 3: Type inference
console.log("\n=== Test 3: Type Inference ===");
const count = State(0); // Should infer NonNullStateInstance<number>
const message = State("hello"); // Should infer NonNullStateInstance<string>
const flag = State(true); // Should infer NonNullStateInstance<boolean>

console.log("Count:", count.value); // No TypeScript error
console.log("Message:", message.value.toUpperCase()); // No TypeScript error
console.log("Flag:", flag.value); // No TypeScript error

count.update(prev => prev + 1);
message.update(prev => prev + " world");
flag.update(prev => !prev);

console.log("Updated count:", count.value);
console.log("Updated message:", message.value);
console.log("Updated flag:", flag.value);

// Test 4: Explicitly nullable state
console.log("\n=== Test 4: Explicitly Nullable State ===");
const maybeString = State<string | null>();
console.log("Maybe string (initial):", maybeString.value);

// This should require null check
if (maybeString.value !== null && maybeString.value !== undefined) {
  console.log("String length:", maybeString.value.length);
}

maybeString.set("test");
console.log("Maybe string (after set):", maybeString.value);

console.log("\n=== All tests completed successfully! ===");
