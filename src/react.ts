/**
 * React integration hooks for RaptorState
 * 
 * Installation:
 * npm install effector-react
 * 
 * Usage:
 * import { useUnit } from "effector-react"
 * import { useRaptorState } from "raptor-state"
 * 
 * const MyComponent = () => {
 *   const myState = State(0)
 *   const value = useRaptorState(myState)
 *   return <div>{value}</div>
 * }
 */

import type { StateInstance, AsyncStateInstance, ComputedInstance } from "./types.ts";

/**
 * React hook for basic state
 * Note: Requires useUnit from effector-react to be available
 * @param state - State instance from State()
 * @returns Current state value that triggers re-renders
 */
export function useRaptorState<T>(state: StateInstance<T>): T | null | undefined {
  // @ts-ignore - useUnit should be imported by user from effector-react
  return globalThis.useUnit ? globalThis.useUnit(state.$state) : state.value;
}

/**
 * React hook for computed state
 * @param computed - Computed instance from computed()
 * @returns Current computed value that triggers re-renders
 */
export function useComputed<T>(computed: ComputedInstance<T>): T {
  // @ts-ignore - useUnit should be imported by user from effector-react
  return globalThis.useUnit ? globalThis.useUnit(computed.$state) : computed.value;
}

/**
 * React hook for async state
 * @param asyncStateInstance - Async state instance from asyncState()
 * @returns Object with data, loading, error values
 */
export function useAsyncState<T>(asyncStateInstance: AsyncStateInstance<T>): {
  data: T | null;
  loading: boolean;
  error: unknown;
  isLoading: boolean;
  hasError: boolean;
  hasData: boolean;
  execute: AsyncStateInstance<T>['execute'];
  reset: AsyncStateInstance<T>['reset'];
} {
  // @ts-ignore - useUnit should be imported by user from effector-react
  const useUnitFn = globalThis.useUnit || ((store: { getState: () => unknown }) => store.getState());
  
  const data = useUnitFn(asyncStateInstance.data.$state);
  const loading = useUnitFn(asyncStateInstance.loading.$state);
  const error = useUnitFn(asyncStateInstance.error.$state);
  
  return {
    data,
    loading,
    error,
    execute: asyncStateInstance.execute,
    isLoading: asyncStateInstance.isLoading,
    hasError: asyncStateInstance.hasError,
    hasData: asyncStateInstance.hasData,
    reset: asyncStateInstance.reset,
  };
}

/**
 * Helper to create a React-compatible hook
 * Usage in your app:
 * 
 * import { useUnit } from "effector-react"
 * setupReactIntegration(useUnit)
 */
export function setupReactIntegration(useUnitHook: (store: unknown) => unknown) {
  // @ts-ignore: Setting up global hook for React integration
  globalThis.useUnit = useUnitHook;
}
