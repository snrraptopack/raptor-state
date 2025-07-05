import {
  asyncState,
  collection,
  computed,
  counter,
  form,
  State,
  toggle,
} from "./main.ts";

// Test basic State functionality
console.log("=== Testing Basic State ===");
const basicState = State(0);
console.log("Initial value:", basicState.value); // Should be 0

basicState.set(5);
console.log("After set(5):", basicState.value); // Should be 5

basicState.update((prev) => (prev || 0) + 1);
console.log("After update(+1):", basicState.value); // Should be 6

console.log("hasValue:", basicState.hasValue()); // Should be true
console.log("getValue:", basicState.getValue()); // Should be 6
console.log("getValueOr(10):", basicState.getValueOr(10)); // Should be 6

// Test TypeScript types
console.log("\n=== Testing TypeScript Types ===");
const user = State<{ name: string; age: number }>({ name: "John", age: 30 });
console.log("User:", user.value);

user.update((prev) => prev ? { ...prev, age: prev.age + 1 } : null);
console.log("After age update:", user.value);

// Test computed state
console.log("\n=== Testing Computed State ===");
const doubled = computed([basicState.$state], (count) => (count || 0) * 2);
console.log("Doubled value:", doubled.value); // Should be 12

basicState.set(10);
console.log("After counter set to 10, doubled:", doubled.value); // Should be 20

// Test async state
console.log("\n=== Testing Async State ===");
const userApi = asyncState(async (id: number) => {
  console.log(`Fetching user ${id}...`);
  await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate API call
  return { id, name: `User ${id}`, email: `user${id}@example.com` };
});

console.log("Initial loading state:", userApi.isLoading);
console.log("Initial data:", userApi.data.value);
console.log("Initial error:", userApi.error.value);

// Test collection state
console.log("\n=== Testing Collection State ===");
const todos = collection([
  { id: 1, text: "Learn RaptorState", done: false },
  { id: 2, text: "Build awesome app", done: false },
]);

console.log("Initial todos:", todos.value);
console.log("Initial length:", todos.length);
console.log("Is empty:", todos.isEmpty);

todos.push({ id: 3, text: "Deploy to production", done: false });
console.log("After push:", todos.value);

todos.updateAt(0, (todo) => ({ ...todo, done: true }));
console.log("After marking first todo as done:", todos.value);

const doneTodos = todos.filter((todo) => todo.done);
console.log("Done todos:", doneTodos);

const todoTexts = todos.mapItems((todo) => todo.text);
console.log("Todo texts:", todoTexts);

const firstUndoneTodo = todos.find((todo) => !todo.done);
console.log("First undone todo:", firstUndoneTodo);

todos.removeAt(1);
console.log("After removing second todo:", todos.value);

// Test toggle state
console.log("\n=== Testing Toggle State ===");
const isVisible = toggle(false);
console.log("Initial toggle:", isVisible.value);

isVisible.toggle();
console.log("After toggle:", isVisible.value);

isVisible.setTrue();
console.log("After setTrue:", isVisible.value);

isVisible.setFalse();
console.log("After setFalse:", isVisible.value);

// Test counter state
console.log("\n=== Testing Counter State ===");
const score = counter(0);
console.log("Initial counter:", score.value);

score.increment();
console.log("After increment:", score.value);

score.incrementBy(10);
console.log("After incrementBy(10):", score.value);

score.decrement();
console.log("After decrement:", score.value);

score.decrementBy(5);
console.log("After decrementBy(5):", score.value);

// Test form state
console.log("\n=== Testing Form State ===");
const loginForm = form({
  email: "",
  password: "",
});

console.log("Initial form values:", loginForm.values.value);
console.log("Initial form errors:", loginForm.errors.value);
console.log("Initial isValid:", loginForm.isValid);

loginForm.setField("email", "user@example.com");
loginForm.setField("password", "123");

console.log("After setting fields:", loginForm.values.value);

// Test validation
const isValid = loginForm.validate((values) => {
  const errors: Record<string, string> = {};
  if (!values.email.includes("@")) errors.email = "Invalid email";
  if (values.password.length < 6) errors.password = "Password too short";
  return errors;
});

console.log("Validation result:", isValid);
console.log("Form errors:", loginForm.errors.value);
console.log("Form isValid:", loginForm.isValid);

// Fix password and validate again
loginForm.setField("password", "secretpassword");
const isValidNow = loginForm.validate((values) => {
  const errors: Record<string, string> = {};
  if (!values.email.includes("@")) errors.email = "Invalid email";
  if (values.password.length < 6) errors.password = "Password too short";
  return errors;
});

console.log("After fixing password - isValid:", isValidNow);
console.log("Form errors:", loginForm.errors.value);

// Test subscription
console.log("\n=== Testing Subscription ===");
const unsubscribe = basicState.subscribe((value) => {
  console.log("State changed to:", value);
});

basicState.set(15);
basicState.set(20);

// Clean up
unsubscribe();

// Test null/undefined handling
console.log("\n=== Testing Null/Undefined Handling ===");
const nullable = State<string>(null);
console.log("Nullable hasValue:", nullable.hasValue()); // Should be false
console.log("Nullable getValueOr('default'):", nullable.getValueOr("default")); // Should be 'default'

try {
  nullable.getValue();
} catch (error) {
  console.log("Expected error when getting null value:", error.message);
}

nullable.set("not null");
console.log("After setting value:", nullable.getValue()); // Should be "not null"

nullable.clear();
console.log("After clear:", nullable.value); // Should be null

// Execute async operation
userApi.execute(123).then(() => {
  console.log("\n=== Async State Results ===");
  console.log("Loading:", userApi.isLoading);
  console.log("Data:", userApi.data.value);
  console.log("Has data:", userApi.hasData);
  console.log("Has error:", userApi.hasError);
});

console.log("\n=== All tests completed! ===");
