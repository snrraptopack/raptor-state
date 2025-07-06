import { State } from "./main.ts";

// Simple test: Non-null state
console.log("=== Basic Test ===");
const todoInput = State(""); // Should be StateInstance<string>
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

console.log("=== Basic test completed successfully! ===");
