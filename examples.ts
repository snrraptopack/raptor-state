/**
 * RaptorState Examples
 * 
 * This file demonstrates the main features of RaptorState
 */

import { State, computed, asyncState, collection, toggle, counter, form } from "./main.ts";

// === Basic State ===
console.log("🦖 RaptorState Examples\n");

// Simple state
const count = State(0);
console.log("Initial count:", count.value); // 0

count.set(5);
console.log("After set(5):", count.value); // 5

count.update(prev => (prev || 0) + 1);
console.log("After increment:", count.value); // 6

// === Computed State ===
const doubled = computed([count.$state], (value) => (value || 0) * 2);
console.log("Doubled value:", doubled.value); // 12

// === Async State ===
const api = asyncState(async (id: number) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return { id, name: `User ${id}` };
});

api.execute(123);
console.log("Loading:", api.isLoading); // true

// === Collection State ===
const todos = collection([
  { id: 1, text: "Learn RaptorState", done: false }
]);

todos.push({ id: 2, text: "Build something awesome", done: false });
console.log("Todos count:", todos.length); // 2

todos.updateAt(0, todo => ({ ...todo, done: true }));
console.log("First todo done:", todos.value?.[0].done); // true

// === Toggle State ===
const isVisible = toggle(false);
isVisible.toggle();
console.log("Is visible:", isVisible.value); // true

// === Counter State ===
const score = counter(0);
score.increment();
score.incrementBy(10);
console.log("Score:", score.value); // 11

// === Form State ===
const loginForm = form({
  email: "",
  password: ""
});

loginForm.setField("email", "user@example.com");
loginForm.setField("password", "secret123");

const isValid = loginForm.validate(values => {
  const errors: Record<string, string> = {};
  if (!values.email.includes("@")) errors.email = "Invalid email";
  if (values.password.length < 6) errors.password = "Password too short";
  return errors;
});

console.log("Form is valid:", isValid); // true
console.log("Form values:", loginForm.values.value);

console.log("\n✨ All examples completed!");
