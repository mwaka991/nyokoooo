/**
 * Payment Polling Configuration & Utilities
 * Optimized for FastLipa payment verification with exponential backoff
 */

// ============================================================================
// POLLING CONFIGURATION
// ============================================================================

export const POLLING_CONFIG = {
  // Initial delay before first retry (milliseconds)
  INITIAL_DELAY_MS: 1000,

  // Maximum delay between retries (milliseconds)  
  MAX_DELAY_MS: 8000,

  // Exponential backoff multiplier (1.5 = 50% increase per retry)
  BACKOFF_MULTIPLIER: 1.5,

  // Add random jitter ±20% to prevent thundering herd
  JITTER_FACTOR: 0.2,

  // Maximum number of polling attempts before giving up
  MAX_ATTEMPTS: 20,

  // Total timeout for entire polling session (seconds)
  POLLING_TIMEOUT_SECONDS: 60,

  // Stop polling after payment settled (paid, failed, expired)
  STOP_CONDITIONS: ['paid', 'success', 'failed', 'expired', 'cancelled'],
};

// ============================================================================
// POLLING UTILITIES
// ============================================================================

/**
 * Calculate next polling delay with exponential backoff and jitter
 * Prevents thundering herd problem when many clients poll simultaneously
 */
export function calculateNextDelay(
  attempt: number,
  initialDelay: number = POLLING_CONFIG.INITIAL_DELAY_MS
): number {
  // Calculate exponential backoff: initial * (multiplier ^ attempt)
  const exponentialDelay = Math.min(
    initialDelay * Math.pow(POLLING_CONFIG.BACKOFF_MULTIPLIER, attempt),
    POLLING_CONFIG.MAX_DELAY_MS
  );

  // Add random jitter: ±20% of the delay
  const jitterAmount = exponentialDelay * POLLING_CONFIG.JITTER_FACTOR;
  const jitter = Math.random() * jitterAmount * 2 - jitterAmount;

  return Math.max(exponentialDelay + jitter, 100); // minimum 100ms
}

/**
 * Check if payment has reached a settled state (no more polling needed)
 */
export function isPaymentSettled(
  status: string | undefined
): boolean {
  return status ? POLLING_CONFIG.STOP_CONDITIONS.includes(status.toLowerCase()) : false;
}

/**
 * Format polling strategy info for client debugging
 */
export function getPollingInfo(attempt: number): {
  attempt: number;
  nextDelayMs: number;
  maxAttempts: number;
  timeoutSeconds: number;
  estimatedTimeRemaining: number;
} {
  const nextDelay = calculateNextDelay(attempt);
  const estimatedTime = nextDelay + calculateNextDelay(attempt + 1);

  return {
    attempt,
    nextDelayMs: Math.round(nextDelay),
    maxAttempts: POLLING_CONFIG.MAX_ATTEMPTS,
    timeoutSeconds: POLLING_CONFIG.POLLING_TIMEOUT_SECONDS,
    estimatedTimeRemaining: Math.round(estimatedTime / 1000),
  };
}

/**
 * Generate retry guidance message for client
 */
export function getRetryMessage(attempt: number): string {
  const { nextDelayMs, maxAttempts } = getPollingInfo(attempt);
  const seconds = Math.round(nextDelayMs / 1000);

  if (attempt >= maxAttempts) {
    return `Payment verification timeout. Please check your payment status.`;
  }

  return `Payment processing. Try again in ${seconds} second${seconds !== 1 ? 's' : ''}.`;
}

/**
 * Validate polling parameters before starting
 */
export function validatePollingParams(reference: string): {
  valid: boolean;
  error?: string;
} {
  if (!reference || typeof reference !== 'string') {
    return { valid: false, error: 'Invalid payment reference' };
  }

  if (reference.length < 5 || reference.length > 100) {
    return { valid: false, error: 'Payment reference length invalid' };
  }

  return { valid: true };
}

// ============================================================================
// POLLING RESPONSE TYPE
// ============================================================================

export interface PaymentPollingResponse {
  success: boolean;
  status?: string; // 'pending', 'paid', 'success', 'failed', 'expired'
  isSettled: boolean; // true if payment reached final state
  shouldRetry: boolean; // true if client should keep polling
  nextRetryMs?: number; // milliseconds to wait before next retry
  message: string;
  data?: {
    payment_id: string;
    amount_tsh: number;
    access?: {
      session_token: string;
      expires_at: string;
      duration_hours: number;
      minutes_remaining: number;
    };
  };
}

/**
 * Create a polling response for the client
 */
export function createPollingResponse(
  success: boolean,
  status: string,
  attempt: number,
  message: string,
  data?: any
): PaymentPollingResponse {
  const isSettled = isPaymentSettled(status);

  return {
    success,
    status,
    isSettled,
    shouldRetry: !isSettled && attempt < POLLING_CONFIG.MAX_ATTEMPTS,
    nextRetryMs: !isSettled ? Math.round(calculateNextDelay(attempt)) : undefined,
    message,
    data,
  };
}
