import { sample } from "effector";
import type { Store } from "effector";
import type { ComputedInstance } from "./types.ts";

/**
 * Create a computed state that derives its value from other states
 * @param dependencies - Array of stores to derive from
 * @param fn - Function to compute the derived value
 * @returns Computed state instance
 */
export function computed<T>(
  dependencies: Store<unknown>[],
  fn: (...values: unknown[]) => T,
): ComputedInstance<T> {
  const $computed = sample({
    source: dependencies,
    fn: (values: unknown[]) => fn(...values),
  });
  
  return {
    $state: $computed,
    
    get value() {
      return $computed.getState();
    },
    
    subscribe(fn: (value: T) => void) {
      return $computed.watch(fn);
    },
  };
}
