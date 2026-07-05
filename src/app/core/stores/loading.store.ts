import { computed, Service, signal } from '@angular/core';

/**
 * Signal store that tracks the number of in-flight HTTP requests.
 * Consumed by the loadingInterceptor (increment/decrement) and
 * by LoadingBarComponent (isLoading).
 */
@Service()
export class LoadingStore {
  readonly #pending = signal(0);

  /** True when at least one HTTP request is in flight. */
  readonly isLoading = computed(() => this.#pending() > 0);

  increment(): void {
    this.#pending.update(n => n + 1);
  }

  decrement(): void {
    this.#pending.update(n => Math.max(0, n - 1));
  }
}
