#!/usr/bin/env -S deno run --allow-net
/**
 * Pre-publishing verification script for RaptorState
 * Runs all necessary checks before publishing
 */

console.log("🦖 RaptorState - Pre-Publishing Verification\n");

// Step 1: Type checking
console.log("📘 Checking TypeScript...");
const typeCheck = new Deno.Command("deno", {
  args: ["check", "mod.ts"],
  stdout: "piped",
  stderr: "piped",
});

const typeResult = await typeCheck.output();
if (!typeResult.success) {
  console.error("❌ TypeScript check failed");
  console.error(new TextDecoder().decode(typeResult.stderr));
  Deno.exit(1);
}
console.log("✅ TypeScript check passed");

// Step 2: Linting
console.log("\n🔍 Running linter...");
const lint = new Deno.Command("deno", {
  args: ["lint", "mod.ts", "src/"],
  stdout: "piped",
  stderr: "piped",
});

const lintResult = await lint.output();
if (!lintResult.success) {
  console.error("❌ Linting failed");
  console.error(new TextDecoder().decode(lintResult.stderr));
  Deno.exit(1);
}
console.log("✅ Linting passed");

// Step 3: Test execution
console.log("\n🧪 Running tests...");
const test = new Deno.Command("deno", {
  args: ["run", "--allow-net", "test-clean.ts"],
  stdout: "piped",
  stderr: "piped",
});

const testResult = await test.output();
if (!testResult.success) {
  console.error("❌ Tests failed");
  console.error(new TextDecoder().decode(testResult.stderr));
  Deno.exit(1);
}
console.log("✅ All tests passed");

// Step 4: Package validation
console.log("\n📦 Validating package structure...");
const requiredFiles = [
  "mod.ts",
  "jsr.json", 
  "package.json",
  "README.md",
  "LICENSE",
  "src/state.ts",
  "src/computed.ts", 
  "src/async.ts",
  "src/types.ts",
  "src/react.ts"
];

for (const file of requiredFiles) {
  try {
    await Deno.stat(file);
    console.log(`  ✅ ${file}`);
  } catch {
    console.error(`  ❌ Missing: ${file}`);
    Deno.exit(1);
  }
}

console.log("\n🎉 All pre-publishing checks passed!");
console.log("\n📋 Ready to publish:");
console.log("   1. jsr auth login");
console.log("   2. jsr publish --dry-run");
console.log("   3. jsr publish");
console.log("\n🚀 Happy publishing!");
