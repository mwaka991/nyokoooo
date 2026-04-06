/**
 * Client-Side Payment Polling Utility
 * Handles verification requests with optimized exponential backoff strategy
 * 
 * Usage:
 * const pollFn = createPaymentPoller('http://api.example.com');
 * const result = await pollFn(paymentReference);
 */

export interface PollingOptions {
  apiUrl: string;
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitterFactor?: number;
  timeoutSeconds?: number;
  onProgress?: (attempt: number, delayMs: number) => void;
  onRetry?: (status: string, nextDelayMs: number) => void;
}

export interface PaymentVerificationResult {
  success: boolean;
  status?: string;
  isSettled: boolean;
  accessToken?: string;
  expiresAt?: string;
  minutesRemaining?: number;
  message: string;
}

/**
 * Create a payment polling function with configured parameters
 */
export function createPaymentPoller(options: PollingOptions) {
  const config = {
    maxAttempts: options.maxAttempts || 20,
    initialDelayMs: options.initialDelayMs || 1000,
    maxDelayMs: options.maxDelayMs || 8000,
    backoffMultiplier: options.backoffMultiplier || 1.5,
    jitterFactor: options.jitterFactor || 0.2,
    timeoutSeconds: options.timeoutSeconds || 60,
  };

  /**
   * Calculate next retry delay with exponential backoff and jitter
   */
  function calculateDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
      config.maxDelayMs
    );

    const jitterAmount = exponentialDelay * config.jitterFactor;
    const jitter = Math.random() * jitterAmount * 2 - jitterAmount;

    return Math.max(exponentialDelay + jitter, 100);
  }

  /**
   * Poll the payment verification endpoint
   */
  async function poll(reference: string): Promise<PaymentVerificationResult> {
    if (!reference || typeof
 reference !== 'string') {
      throw new Error('Invalid payment reference');
    }

    const startTime = Date.now();
    let attempt = 0;

    while (attempt < config.maxAttempts) {
      try {
        // Check if timeout exceeded
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        if (elapsedSeconds > config.timeoutSeconds) {
          return {
            success: false,
            isSettled: true,
            message: `Polling timeout after ${config.timeoutSeconds}s. Payment status unknown.`,
          };
        }

        // Call the verification endpoint
        const response = await fetch(
          `${options.apiUrl}/api/payment/verify/${reference}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const data = await response.json();

        // Call progress callback
        options.onProgress?.(attempt, 0);

        // Payment settled - stop polling
        if (data.isSettled) {
          return {
            success: data.success,
            status: data.status,
            isSettled: true,
            accessToken: data.data?.access?.session_token,
            expiresAt: data.data?.access?.expires_at,
            minutesRemaining: data.data?.access?.minutes_remaining,
            message: data.message,
          };
        }

        // Still pending - calculate backoff and retry
        if (data.shouldRetry) {
          const nextDelay = calculateDelay(attempt);
          options.onRetry?.(data.status || 'pending', nextDelay);

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, nextDelay));
          attempt++;
          continue;
        }

        // Unexpected response structure
        return {
          success: false,
          isSettled: true,
          message: 'Unexpected response from server',
        };
      } catch (error) {
        // Network error - implement exponential backoff retry
        const nextDelay = calculateDelay(attempt);

        if (attempt < config.maxAttempts - 1) {
          console.warn(`Polling error (attempt ${attempt + 1}): ${error}`);
          await new Promise(resolve => setTimeout(resolve, nextDelay));
          attempt++;
          continue;
        }

        return {
          success: false,
          isSettled: true,
          message: `Network error after ${config.maxAttempts} attempts: ${error}`,
        };
      }
    }

    // Max attempts exceeded
    return {
      success: false,
      isSettled: true,
      message: `Max polling attempts (${config.maxAttempts}) exceeded`,
    };
  }

  return poll;
}

/**
 * Convenience wrapper for one-off verification
 */
export async function verifyPayment(
  apiUrl: string,
  reference: string,
  options?: Partial<PollingOptions>
): Promise<PaymentVerificationResult> {
  const poller = createPaymentPoller({
    apiUrl,
    ...options,
  });

  return poller(reference);
}

/**
 * Advanced polling with real-time feedback (for UI updates)
 */
export async function pollPaymentWithFeedback(
  apiUrl: string,
  reference: string,
  callbacks: {
    onAttempt?: (attempt: number) => void;
    onWaiting?: (delayMs: number, nextAttemptMs: number) => void;
    onSuccess?: (result: PaymentVerificationResult) => void;
    onError?: (error: Error) => void;
  } = {}
): Promise<PaymentVerificationResult> {
  const poller = createPaymentPoller({
    apiUrl,
    onProgress: callbacks.onAttempt,
    onRetry: (status, delayMs) => {
      const nextAttemptTime = Date.now() + delayMs;
      callbacks.onWaiting?.(delayMs, nextAttemptTime);
    },
  });

  try {
    const result = await poller(reference);
    callbacks.onSuccess?.(result);
    return result;
  } catch (error) {
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
