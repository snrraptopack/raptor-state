import { State, computed, asyncState, fetchState, mutationState } from "./mod.ts";

// === Core State Tests ===
console.log("🦖 RaptorState - Clean API Tests\n");

// Basic state
console.log("=== Basic State ===");
const count = State(0);
console.log("Initial:", count.value); // 0

count.set(5);
console.log("After set(5):", count.value); // 5

count.update((prev) => (prev || 0) + 1);
console.log("After update:", count.value); // 6

// Complex state
const user = State<{ name: string; age: number }>({ name: "John", age: 30 });
user.update((prev) => prev ? { ...prev, age: prev.age + 1 } : null);
console.log("User after age update:", user.value);

// === Computed State ===
console.log("\n=== Computed State ===");
const doubled = computed([count.$state], (value) => {
  const num = value as number | undefined;
  return (num ?? 0) * 2;
});
console.log("Doubled value:", doubled.value); // 12

count.set(10);
console.log("After count=10, doubled:", doubled.value); // 20

// === Async State ===
console.log("\n=== Async State ===");
const userApi = asyncState(async (id: number) => {
  console.log(`Fetching user ${id}...`);
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { id, name: `User ${id}`, email: `user${id}@example.com` };
});

console.log("Initial loading:", userApi.isLoading);
console.log("Initial data:", userApi.data.value);

// === Fetch State (replaces useEffect) ===
console.log("\n=== Fetch State ===");
const postsApi = fetchState<{ id: number; title: string }[]>(
  "https://jsonplaceholder.typicode.com/posts?_limit=3"
);

console.log("Posts initial loading:", postsApi.isLoading);

// === Mutation State ===
console.log("\n=== Mutation State ===");
const createPost = mutationState(async (data: { title: string; body: string }) => {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
});

// === Subscriptions ===
console.log("\n=== Subscriptions ===");
const unsubscribe = count.subscribe((value) => {
  console.log("Count changed to:", value);
});

count.set(15);
count.set(20);
unsubscribe();

// === Execute Async Operations ===
console.log("\n=== Async Execution ===");

// Execute user fetch
userApi.execute(123).then(() => {
  console.log("User fetch completed:");
  console.log("- Loading:", userApi.isLoading);
  console.log("- Data:", userApi.data.value);
  console.log("- Has data:", userApi.hasData);
});

// Execute posts fetch
postsApi.execute().then(() => {
  console.log("Posts fetch completed:");
  console.log("- Loading:", postsApi.isLoading);
  console.log("- Data count:", postsApi.data.value?.length || 0);
  console.log("- Has error:", postsApi.hasError);
});

// Execute mutation
createPost.execute({ title: "Test Post", body: "Test content" }).then(() => {
  console.log("Post creation completed:");
  console.log("- Loading:", createPost.isLoading);
  console.log("- Created post:", createPost.data.value);
});

console.log("\n✨ All tests completed!");
