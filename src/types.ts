import type { Store } from "effector";

export type StateValue<T> = T | null | undefined;

export interface StateInstance<T> {
  /** The underlying Effector store */
  readonly $state: Store<StateValue<T>>;
  /** Current state value */
  readonly value: StateValue<T>;
  /** Set new state value */
  readonly set: (value: StateValue<T>) => StateValue<T>;
  /** Update state with a function */
  readonly update: (updater: (prev: StateValue<T>) => StateValue<T>) => void;
  /** Reset state to initial value */
  readonly reset: () => void;
  /** Subscribe to state changes */
  readonly subscribe: (fn: (value: StateValue<T>) => void) => () => void;
}

export interface AsyncStateInstance<Data> {
  /** Data state */
  readonly data: StateInstance<Data>;
  /** Loading state */
  readonly loading: StateInstance<boolean>;
  /** Error state */
  readonly error: StateInstance<Error | null>;
  /** Execute the async operation */
  readonly execute: (params?: unknown) => Promise<Data>;
  /** Check if currently loading */
  readonly isLoading: boolean;
  /** Check if has error */
  readonly hasError: boolean;
  /** Check if has data */
  readonly hasData: boolean;
  /** Reset all states */
  readonly reset: () => void;
}

export interface ComputedInstance<T> {
  /** The computed store */
  readonly $state: Store<T>;
  /** Current computed value */
  readonly value: T;
  /** Subscribe to computed changes */
  readonly subscribe: (fn: (value: T) => void) => () => void;
}
