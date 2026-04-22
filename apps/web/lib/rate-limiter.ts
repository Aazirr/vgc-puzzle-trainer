/**
 * Rate limiter with exponential backoff
 * Useful for API calls
 */

export class AdaptiveRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private maxAttempts: number;
  private initialWindow: number;
  private backoffMultiplier: number;

  constructor(
    maxAttempts: number = 5,
    initialWindow: number = 60000,
    backoffMultiplier: number = 2
  ) {
    this.maxAttempts = maxAttempts;
    this.initialWindow = initialWindow;
    this.backoffMultiplier = backoffMultiplier;
  }

  isAllowed(key: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      // First attempt
      this.attempts.set(key, {
        count: 1,
        resetTime: now + this.initialWindow,
      });
      return { allowed: true };
    }

    if (now > record.resetTime) {
      // Reset window expired
      this.attempts.set(key, {
        count: 1,
        resetTime: now + this.initialWindow,
      });
      return { allowed: true };
    }

    if (record.count < this.maxAttempts) {
      record.count++;
      return { allowed: true };
    }

    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Request deduplication for API calls
 */
export class RequestDeduplicator {
  private pending: Map<string, Promise<unknown>> = new Map();

  async deduplicate<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // Return existing pending request if available
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    // Create new request
    const promise = fn()
      .finally(() => {
        // Remove from pending after completion
        this.pending.delete(key);
      });

    this.pending.set(key, promise);
    return promise;
  }
}
