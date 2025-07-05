import { createEvent, createStore } from "effector";
import type { StateInstance, StateValue } from "./types.ts";

/**
 * Create a new state instance with the given initial value
 * @param initialValue - The initial state value
 * @returns StateInstance with core utilities
 */
export function State<T>(initialValue: StateValue<T> = null): StateInstance<T> {
  const $state = createStore<StateValue<T>>(initialValue);
  
  const set = createEvent<StateValue<T>>("set");
  const update = createEvent<(prev: StateValue<T>) => StateValue<T>>("update");
  const reset = createEvent<void>("reset");
  
  // Wire up events to store
  $state
    .on(set, (_, payload) => payload)
    .on(update, (state, updater) => updater(state))
    .reset(reset);
  
  return {
    $state,
    
    get value() {
      return $state.getState();
    },
    
    set,
    update,
    reset,
    
    subscribe(fn: (value: StateValue<T>) => void) {
      return $state.watch(fn);
    },
  };
}
