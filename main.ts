import {
  createEffect,
  createEvent,
  createStore,
  type Effect,
  sample,
  type Store,
} from "effector";

/**
 * RaptorState - A robust utility wrapper around Effector
 * Provides an idiomatic API for state management with TypeScript support
 */

export type StateValue<T> = T | null | undefined;

export interface StateInstance<T> {
  /** The underlying Effector store */
  readonly $state: Store<StateValue<T>>;
  /** Current state value */
  readonly value: StateValue<T>;
  /** Set new state value */
  readonly set: (value: StateValue<T>) => StateValue<T>;
  /** Update state with a function */
  readonly update: (
    updater: (prev: StateValue<T>) => StateValue<T>,
  ) => (prev: StateValue<T>) => StateValue<T>;
  /** Reset state to initial value */
  readonly reset: () => void;
  /** Clear state (set to null) */
  readonly clear: () => void;
  /** Check if state has a value (not null/undefined) */
  readonly hasValue: () => boolean;
  /** Get state value or throw if null/undefined */
  readonly getValue: () => T;
  /** Get state value or return default */
  readonly getValueOr: (defaultValue: T) => T;
  /** Subscribe to state changes */
  readonly subscribe: (fn: (value: StateValue<T>) => void) => () => void;
  /** Map state to derived value */
  readonly map: <U>(fn: (value: StateValue<T>) => U) => Store<U>;
  /** Create async effect bound to this state */
  readonly createEffect: <Params, Done = StateValue<T>, Fail = Error>(
    handler: (params: Params) => Promise<Done>,
  ) => Effect<Params, Done, Fail>;
}

/**
 * Create a new state instance with the given initial value
 * @param initialValue - The initial state value
 * @returns StateInstance with all utility methods
 */
export function State<T>(initialValue: StateValue<T> = null): StateInstance<T> {
  // Core store
  const $state = createStore<StateValue<T>>(initialValue);

  // Events
  const set = createEvent<StateValue<T>>("set");
  const update = createEvent<(prev: StateValue<T>) => StateValue<T>>("update");
  const reset = createEvent<void>("reset");
  const clear = createEvent<void>("clear");

  // Wire up events to store
  $state
    .on(set, (_, payload) => payload)
    .on(update, (state, updater) => updater(state))
    .reset(reset)
    .reset(clear);

  // Handle clear event
  clear.watch(() => set(null));

  return {
    $state,

    get value() {
      return $state.getState();
    },

    set,
    update,
    reset,
    clear,

    hasValue() {
      const current = $state.getState();
      return current !== null && current !== undefined;
    },

    getValue() {
      const current = $state.getState();
      if (current === null || current === undefined) {
        throw new Error("State value is null or undefined");
      }
      return current as T;
    },

    getValueOr(defaultValue: T) {
      const current = $state.getState();
      return (current !== null && current !== undefined)
        ? current as T
        : defaultValue;
    },

    subscribe(fn: (value: StateValue<T>) => void) {
      return $state.watch(fn);
    },

    map<U>(fn: (value: StateValue<T>) => U) {
      return $state.map(fn);
    },

    createEffect<Params, Done = StateValue<T>, Fail = Error>(
      handler: (params: Params) => Promise<Done>,
    ) {
      const fx = createEffect<Params, Done, Fail>(handler);

      // Auto-connect successful results to state if they match the type
      fx.doneData.watch((result) => {
        if (result !== undefined) {
          set(result as StateValue<T>);
        }
      });

      return fx;
    },
  };
}

/**
 * Create a computed state that derives its value from other states
 * @param stores - Array of stores or state instances to derive from
 * @param fn - Function to compute the derived value
 * @returns Readonly state instance
 */
export function computed<T, Sources extends readonly Store<unknown>[]>(
  stores: Sources,
  fn: (
    ...values: {
      [K in keyof Sources]: Sources[K] extends Store<infer U> ? U : never;
    }
  ) => T,
): Pick<StateInstance<T>, "$state" | "value" | "subscribe" | "map"> {
  const $computed = sample({
    source: [...stores] as Store<unknown>[],
    fn: (values: unknown[]) =>
      fn(
        ...(values as {
          [K in keyof Sources]: Sources[K] extends Store<infer U> ? U
            : never;
        }),
      ),
  });

  return {
    $state: $computed,

    get value() {
      return $computed.getState();
    },

    subscribe(fn: (value: T) => void) {
      return $computed.watch(fn);
    },

    map<U>(mapFn: (value: T) => U) {
      return $computed.map(mapFn);
    },
  };
}

/**
 * Create an async state that handles loading, data, and error states
 * @param effect - Effector effect or async function
 * @param initialData - Initial data value
 * @returns StateInstance with async utilities
 */
export function asyncState<Params, Data, Fail = Error>(
  effect: Effect<Params, Data, Fail> | ((params: Params) => Promise<Data>),
  initialData: Data | null = null,
): {
  data: StateInstance<Data>;
  loading: StateInstance<boolean>;
  error: StateInstance<Fail | null>;
  effect: Effect<Params, Data, Fail>;
  execute: Effect<Params, Data, Fail>;
  readonly isLoading: boolean;
  readonly hasError: boolean;
  readonly hasData: boolean;
  reset(): void;
} {
  const fx = typeof effect === "function" ? createEffect<Params, Data, Fail>(effect) : effect;

  const data = State<Data>(initialData);
  const loading = State<boolean>(false);
  const error = State<Fail | null>(null);

  // Wire up the effect
  const setLoadingTrue = createEvent();
  const setLoadingFalse = createEvent();

  setLoadingTrue.watch(() => loading.set(true));
  setLoadingFalse.watch(() => loading.set(false));

  fx.finally.watch(() => setLoadingFalse());

  fx.doneData.watch((result) => {
    setLoadingTrue();
    data.set(result);
    error.set(null);
  });

  fx.failData.watch((err) => {
    error.set(err as StateValue<Fail | null>);
  });

  return {
    data,
    loading,
    error,
    effect: fx,

    /** Execute the async operation */
    execute: fx,

    /** Check if currently loading */
    get isLoading() {
      return loading.value === true;
    },

    /** Check if has error */
    get hasError() {
      return error.hasValue();
    },

    /** Check if has data */
    get hasData() {
      return data.hasValue();
    },

    /** Reset all states */
    reset() {
      data.set(initialData);
      loading.set(false);
      error.set(null);
    },
  };
}

/**
 * Create a collection state that manages arrays with utility methods
 * @param initialItems - Initial array items
 * @returns StateInstance with array utilities
 */
export function collection<T>(initialItems: T[] = []): StateInstance<T[]> & {
  /** Add item to the end of the array */
  readonly push: (item: T) => void;
  /** Add item to the beginning of the array */
  readonly unshift: (item: T) => void;
  /** Remove and return the last item */
  readonly pop: () => T | undefined;
  /** Remove and return the first item */
  readonly shift: () => T | undefined;
  /** Remove item at index */
  readonly removeAt: (index: number) => void;
  /** Remove item by value */
  readonly remove: (item: T) => void;
  /** Update item at index */
  readonly updateAt: (index: number, updater: (item: T) => T) => void;
  /** Find item by predicate */
  readonly find: (predicate: (item: T) => boolean) => T | undefined;
  /** Filter items */
  readonly filter: (predicate: (item: T) => boolean) => T[];
  /** Map items */
  readonly mapItems: <U>(mapper: (item: T) => U) => U[];
  /** Get array length */
  readonly length: number;
  /** Check if array is empty */
  readonly isEmpty: boolean;
} {
  const state = State<T[]>(initialItems);

  return {
    // Expose all state properties and methods
    $state: state.$state,
    get value() {
      return state.value;
    },
    set: state.set,
    update: state.update,
    reset: state.reset,
    clear: state.clear,
    hasValue: state.hasValue,
    getValue: state.getValue,
    getValueOr: state.getValueOr,
    subscribe: state.subscribe,
    map: state.map,
    createEffect: state.createEffect,

    // Add collection-specific methods
    push(item: T) {
      state.update((prev) => [...(prev || []), item]);
    },

    unshift(item: T) {
      state.update((prev) => [item, ...(prev || [])]);
    },

    pop() {
      const current = state.value || [];
      if (current.length === 0) return undefined;

      const last = current[current.length - 1];
      state.update((prev) => (prev || []).slice(0, -1));
      return last;
    },

    shift() {
      const current = state.value || [];
      if (current.length === 0) return undefined;

      const first = current[0];
      state.update((prev) => (prev || []).slice(1));
      return first;
    },

    removeAt(index: number) {
      state.update((prev) => {
        const arr = prev || [];
        return arr.filter((_, i) => i !== index);
      });
    },

    remove(item: T) {
      state.update((prev) => {
        const arr = prev || [];
        return arr.filter((x) => x !== item);
      });
    },

    updateAt(index: number, updater: (item: T) => T) {
      state.update((prev) => {
        const arr = [...(prev || [])];
        if (index >= 0 && index < arr.length) {
          arr[index] = updater(arr[index]);
        }
        return arr;
      });
    },

    find(predicate: (item: T) => boolean) {
      const current = state.value || [];
      return current.find(predicate);
    },

    filter(predicate: (item: T) => boolean) {
      const current = state.value || [];
      return current.filter(predicate);
    },

    mapItems<U>(mapper: (item: T) => U) {
      const current = state.value || [];
      return current.map(mapper);
    },

    get length() {
      return (state.value || []).length;
    },

    get isEmpty() {
      return this.length === 0;
    },
  };
}

/**
 * Create a boolean toggle state with utility methods
 * @param initialValue - Initial boolean value
 * @returns StateInstance with toggle utilities
 */
export function toggle(initialValue = false): StateInstance<boolean> & {
  /** Toggle the boolean value */
  readonly toggle: () => void;
  /** Set to true */
  readonly setTrue: () => void;
  /** Set to false */
  readonly setFalse: () => void;
} {
  const state = State<boolean>(initialValue);

  return {
    // Expose all state properties and methods
    $state: state.$state,
    get value() {
      return state.value;
    },
    set: state.set,
    update: state.update,
    reset: state.reset,
    clear: state.clear,
    hasValue: state.hasValue,
    getValue: state.getValue,
    getValueOr: state.getValueOr,
    subscribe: state.subscribe,
    map: state.map,
    createEffect: state.createEffect,

    // Add toggle-specific methods
    toggle() {
      state.update((prev) => !prev);
    },

    setTrue() {
      state.set(true);
    },

    setFalse() {
      state.set(false);
    },
  };
}

/**
 * Create a counter state with increment/decrement utilities
 * @param initialValue - Initial counter value
 * @returns StateInstance with counter utilities
 */
export function counter(initialValue = 0): StateInstance<number> & {
  /** Increment by 1 */
  readonly increment: () => void;
  /** Decrement by 1 */
  readonly decrement: () => void;
  /** Increment by amount */
  readonly incrementBy: (amount: number) => void;
  /** Decrement by amount */
  readonly decrementBy: (amount: number) => void;
} {
  const state = State<number>(initialValue);

  return {
    // Expose all state properties and methods
    $state: state.$state,
    get value() {
      return state.value;
    },
    set: state.set,
    update: state.update,
    reset: state.reset,
    clear: state.clear,
    hasValue: state.hasValue,
    getValue: state.getValue,
    getValueOr: state.getValueOr,
    subscribe: state.subscribe,
    map: state.map,
    createEffect: state.createEffect,

    // Add counter-specific methods
    increment() {
      state.update((prev) => (prev || 0) + 1);
    },

    decrement() {
      state.update((prev) => (prev || 0) - 1);
    },

    incrementBy(amount: number) {
      state.update((prev) => (prev || 0) + amount);
    },

    decrementBy(amount: number) {
      state.update((prev) => (prev || 0) - amount);
    },
  };
}

/**
 * Create a form state that manages form fields and validation
 * @param initialValues - Initial form values
 * @returns Form state instance with validation utilities
 */
export function form<T extends Record<string, unknown>>(
  initialValues: T,
): {
  /** Form field values */
  readonly values: StateInstance<T>;
  /** Form field errors */
  readonly errors: StateInstance<Partial<Record<keyof T, string>>>;
  /** Form submission state */
  readonly isSubmitting: StateInstance<boolean>;
  /** Update a single field */
  readonly setField: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Set field error */
  readonly setFieldError: (field: keyof T, error: string | null) => void;
  /** Clear all errors */
  readonly clearErrors: () => void;
  /** Validate form with custom validator */
  readonly validate: (
    validator: (values: T) => Partial<Record<keyof T, string>>,
  ) => boolean;
  /** Reset form to initial values */
  readonly reset: () => void;
  /** Check if form is valid */
  readonly isValid: boolean;
} {
  const values = State<T>(initialValues);
  const errors = State<Partial<Record<keyof T, string>>>({});
  const isSubmitting = State<boolean>(false);

  return {
    values,
    errors,
    isSubmitting,

    setField<K extends keyof T>(field: K, value: T[K]) {
      values.update((prev) => ({ ...(prev || {} as T), [field]: value }));
    },

    setFieldError(field: keyof T, error: string | null) {
      errors.update((prev) => {
        const prevErrors = prev || {};
        const newErrors = { ...prevErrors } as Partial<Record<keyof T, string>>;
        if (error === null) {
          delete newErrors[field];
        } else {
          newErrors[field] = error;
        }
        return newErrors;
      });
    },

    clearErrors() {
      errors.set({});
    },

    validate(validator: (values: T) => Partial<Record<keyof T, string>>) {
      const currentValues = values.getValue();
      const validationErrors = validator(currentValues);
      errors.set(validationErrors);
      return Object.keys(validationErrors).length === 0;
    },

    reset() {
      values.set(initialValues);
      errors.set({});
      isSubmitting.set(false);
    },

    get isValid() {
      const currentErrors = errors.value || {};
      return Object.keys(currentErrors).length === 0;
    },
  };
}

/**
 * Create a persisted state that saves to localStorage/sessionStorage
 * @param key - Storage key
 * @param initialValue - Initial value if not found in storage
 * @param storage - Storage type ('local' or 'session')
 * @returns StateInstance that syncs with storage
 */
export function persistedState<T>(
  key: string,
  initialValue: StateValue<T> = null,
  storage: "local" | "session" = "local",
): StateInstance<T> {
  // Try to get value from storage
  let storedValue: StateValue<T> = initialValue;

  if (typeof window !== "undefined") {
    try {
      const storageObj = storage === "local" ? localStorage : sessionStorage;
      const stored = storageObj.getItem(key);
      if (stored !== null) {
        storedValue = JSON.parse(stored);
      }
    } catch {
      // Ignore storage errors
    }
  }

  const state = State<T>(storedValue);

  // Subscribe to changes and save to storage
  if (typeof window !== "undefined") {
    state.subscribe((value) => {
      try {
        const storageObj = storage === "local" ? localStorage : sessionStorage;
        if (value === null || value === undefined) {
          storageObj.removeItem(key);
        } else {
          storageObj.setItem(key, JSON.stringify(value));
        }
      } catch {
        // Ignore storage errors
      }
    });
  }

  return state;
}

/**
 * Create a debounced state that delays updates
 * @param initialValue - Initial state value
 * @param delay - Debounce delay in milliseconds
 * @returns StateInstance with debounced updates
 */
export function debouncedState<T>(
  initialValue: StateValue<T> = null,
  delay = 300,
): StateInstance<T> & {
  /** Set value immediately without debouncing */
  readonly setImmediate: (value: StateValue<T>) => StateValue<T>;
} {
  const state = State<T>(initialValue);
  const immediateState = State<T>(initialValue);
  let timeoutId: number | null = null;

  // Create debounced set function
  const debouncedSet = (value: StateValue<T>) => {
    immediateState.set(value);

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      state.set(value);
      timeoutId = null;
    }, delay);

    return value;
  };

  // Create debounced update function
  const debouncedUpdate = (updater: (prev: StateValue<T>) => StateValue<T>) => {
    const newValue = updater(immediateState.value);
    debouncedSet(newValue);
    return updater;
  };

  return {
    $state: state.$state,
    get value() {
      return state.value;
    },
    set: debouncedSet,
    update: debouncedUpdate,
    reset: state.reset,
    clear: state.clear,
    hasValue: state.hasValue,
    getValue: state.getValue,
    getValueOr: state.getValueOr,
    subscribe: state.subscribe,
    map: state.map,
    createEffect: state.createEffect,

    setImmediate: state.set,
  };
}

/**
 * Create a state with validation
 * @param initialValue - Initial state value
 * @param validator - Validation function
 * @returns StateInstance with validation
 */
export function validatedState<T>(
  initialValue: StateValue<T> = null,
  validator: (value: StateValue<T>) => boolean,
): StateInstance<T> & {
  /** Check if current value is valid */
  readonly isValid: boolean;
  /** Get validation error if any */
  readonly validationError: string | null;
} {
  const state = State<T>(initialValue);
  const isValid = State<boolean>(validator(initialValue));
  const validationError = State<string | null>(null);

  // Override set to include validation
  const validatedSet = (value: StateValue<T>) => {
    try {
      const valid = validator(value);
      if (valid) {
        state.set(value);
        isValid.set(true);
        validationError.set(null);
      } else {
        isValid.set(false);
        validationError.set("Validation failed");
      }
    } catch (error) {
      isValid.set(false);
      validationError.set(
        error instanceof Error ? error.message : "Unknown validation error",
      );
    }
    return value;
  };

  // Override update to include validation
  const validatedUpdate = (updater: (prev: StateValue<T>) => StateValue<T>) => {
    const newValue = updater(state.value);
    validatedSet(newValue);
    return updater;
  };

  return {
    $state: state.$state,
    get value() {
      return state.value;
    },
    set: validatedSet,
    update: validatedUpdate,
    reset: state.reset,
    clear: state.clear,
    hasValue: state.hasValue,
    getValue: state.getValue,
    getValueOr: state.getValueOr,
    subscribe: state.subscribe,
    map: state.map,
    createEffect: state.createEffect,

    get isValid() {
      return isValid.value === true;
    },
    get validationError() {
      const error = validationError.value;
      return error;
    },
  };
}

// Re-export useful Effector utilities
export { combine, merge, sample } from "effector";

// Usage examples:
/*
// Basic usage
const counter = State(0)
counter.set(5)
counter.update(prev => (prev || 0) + 1)
console.log(counter.value) // 6

// With TypeScript
const user = State<{ name: string; age: number }>({ name: "John", age: 30 })
user.update(prev => prev ? { ...prev, age: prev.age + 1 } : null)

// Computed state
const doubled = computed([counter.$state], (count) => (count || 0) * 2)

// Async state
const userApi = asyncState(async (id: number) => {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
})

userApi.execute(123)
console.log(userApi.isLoading) // true

// Collection state
const todoList = collection<{ id: number; text: string }>()
todoList.push({ id: 1, text: "Learn Effector" })
todoList.unshift({ id: 2, text: "Learn TypeScript" })
todoList.removeAt(0)
console.log(todoList.length) // 1

// Toggle state
const menuOpen = toggle()
menuOpen.toggle()
menuOpen.setTrue()
menuOpen.setFalse()

// Counter state
const pageVisits = counter(1)
pageVisits.increment()
pageVisits.decrementBy(0.5)

// Form state
const loginForm = form<{ username: string; password: string }>({
  username: "",
  password: ""
})
loginForm.setField("username", "JohnDoe")
loginForm.setFieldError("password", "Password is required")
const isValid = loginForm.validate(values => {
  const errors: Partial<Record<keyof typeof values, string>> = {}
  if (!values.username) {
    errors.username = "Username is required"
  }
  if (!values.password) {
    errors.password = "Password is required"
  }
  return errors
})
loginForm.reset()
*/