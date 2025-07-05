import { createEffect } from "effector";
import { State } from "./state.ts";
import type { AsyncStateInstance, StateValue } from "./types.ts";

/**
 * Create an async state that handles data fetching with loading/error states
 * @param handler - Async function to handle the operation
 * @param initialData - Initial data value
 * @returns AsyncStateInstance with data/loading/error states
 */
export function asyncState<Params, Data>(
  handler: (params: Params) => Promise<Data>,
  initialData: StateValue<Data> = null,
): AsyncStateInstance<Data> {
  const fx = createEffect<Params, Data, Error>(handler);
  
  const data = State<Data>(initialData);
  const loading = State<boolean>(false);
  const error = State<Error | null>(null);
  
  // Wire up the effect to states
  fx.pending.watch((isLoading) => {
    loading.set(isLoading);
  });
  
  fx.doneData.watch((result) => {
    data.set(result);
    error.set(null);
  });
  
  fx.failData.watch((err) => {
    error.set(err);
  });
  
  return {
    data,
    loading,
    error,
    
    execute: fx as (params?: unknown) => Promise<Data>,
    
    get isLoading() {
      return loading.value === true;
    },
    
    get hasError() {
      return error.value !== null;
    },
    
    get hasData() {
      return data.value !== null && data.value !== undefined;
    },
    
    reset() {
      data.set(initialData);
      loading.set(false);
      error.set(null);
    },
  };
}

/**
 * Create a fetch state for HTTP requests - replaces useEffect for data fetching
 * @param url - URL to fetch from
 * @param options - Fetch options
 * @returns AsyncStateInstance for the fetch operation
 */
export function fetchState<T = unknown>(
  url: string,
  options: RequestInit = {},
): AsyncStateInstance<T> {
  return asyncState(async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json() as T;
  });
}

/**
 * Create a mutation state for POST/PUT/DELETE operations
 * @param handler - Async mutation function
 * @returns AsyncStateInstance for the mutation
 */
export function mutationState<Params, Data>(
  handler: (params: Params) => Promise<Data>,
): AsyncStateInstance<Data> {
  return asyncState(handler);
}
