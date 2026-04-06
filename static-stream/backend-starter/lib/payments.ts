// FastLipa payment processing integration

import { FastLipaResponse } from '@/types';

const FASTLIPA_API_URL = process.env.FASTLIPA_API_URL;
const FASTLIPA_API_KEY = process.env.FASTLIPA_API_KEY;

if (!FASTLIPA_API_URL || !FASTLIPA_API_KEY) {
  throw new Error(
    'FastLipa configuration missing. Set FASTLIPA_API_URL and FASTLIPA_API_KEY.'
  );
}

// ============================================================================
// PHONE VALIDATION
// ============================================================================

/**
 * Validate Tanzanian phone number
 * Accepts formats: 07xxxxxxxxx, +25577xxxxxxxxx, 25577xxxxxxxxx
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Normalize: remove all non-digits
  const normalized = phone.replace(/\D/g, '');

  // Must be 10 digits (07xxxxxxxxx format)
  // or 12 digits (25577xxxxxxxxx format)
  if (normalized.length === 10) {
    return normalized.startsWith('7');
  }

  if (normalized.length === 12) {
    return normalized.startsWith('255') && normalized[3] === '7';
  }

  return false;
}

/**
 * Normalize phone to international format (25577xxxxxxxxx)
 */
export function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/\D/g, '');

  // Handle 07xxxxxxxxx format
  if (normalized.length === 10 && normalized.startsWith('7')) {
    normalized = '255' + normalized;
  }

  // Ensure it starts with 255
  if (!normalized.startsWith('255')) {
    throw new Error('Invalid phone number format');
  }

  return normalized;
}

// ============================================================================
// PAYMENT CREATION
// ============================================================================

export interface CreatePaymentInput {
  phone_number: string;
  amount_tsh: number;
}

export interface CreatePaymentResponse {
  success: boolean;
  reference: string;
  status: string;
  message?: string;
  error?: string;
}

/**
 * Initiate payment with FastLipa
 * @param input Phone number and amount
 * @returns FastLipa response with payment reference
 */
export async function createFastLipaPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResponse> {
  try {
    // Validate inputs
    if (!validatePhoneNumber(input.phone_number)) {
      return {
        success: false,
        reference: '',
        status: 'failed',
        error: 'Invalid phone number format. Use 07xxxxxxxxx',
      };
    }

    if (input.amount_tsh < 100 || input.amount_tsh > 5000000) {
      return {
        success: false,
        reference: '',
        status: 'failed',
        error: 'Amount must be between 100 and 5,000,000 TSH',
      };
    }

    // Normalize phone
    const phone = normalizePhoneNumber(input.phone_number);

    // Generate unique reference
    const reference = generatePaymentReference();

    // Call FastLipa API
    const response = await fetch(`${FASTLIPA_API_URL}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FASTLIPA_API_KEY}`,
      },
      body: JSON.stringify({
        phone: phone,
        amount: input.amount_tsh,
        reference: reference,
      }),
    });

    if (!response.ok) {
      console.error(
        'FastLipa API error:',
        response.status,
        await response.text()
      );
      return {
        success: false,
        reference: '',
        status: 'failed',
        error: 'FastLipa service error. Please try again.',
      };
    }

    const data = await response.json();

    return {
      success: true,
      reference: data.reference || reference,
      status: 'pending',
      message: 'Payment initiated successfully',
    };
  } catch (error) {
    console.error('Payment creation error:', error);
    return {
      success: false,
      reference: '',
      status: 'failed',
      error: 'Unable to create payment. Please try again.',
    };
  }
}

// ============================================================================
// PAYMENT VERIFICATION
// ============================================================================

export interface VerifyPaymentResponse {
  success: boolean;
  status: 'pending' | 'success' | 'failed' | 'expired';
  reference: string;
  message?: string;
}

/**
 * Verify payment status with FastLipa (server-to-server)
 * This is the source of truth for payment status
 * @param reference Payment reference from FastLipa
 * @returns Current payment status
 */
export async function verifyFastLipaPayment(
  reference: string
): Promise<VerifyPaymentResponse> {
  try {
    if (!reference || typeof reference !== 'string') {
      return {
        success: false,
        status: 'failed',
        reference: '',
        message: 'Invalid reference',
      };
    }

    const response = await fetch(
      `${FASTLIPA_API_URL}/payment/verify?reference=${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${FASTLIPA_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        'FastLipa verification error:',
        response.status,
        await response.text()
      );
      // If we can't verify, mark as pending for retry
      return {
        success: false,
        status: 'pending',
        reference: reference,
        message: 'Unable to verify payment status',
      };
    }

    const data = await response.json();

    // Map FastLipa status to our status
    const statusMap: Record<string, string> = {
      success: 'success',
      pending: 'pending',
      failed: 'failed',
      expired: 'expired',
      cancelled: 'failed',
      processing: 'pending',
    };

    const status = statusMap[data.status] || 'pending';

    return {
      success: status === 'success',
      status: status as any,
      reference: reference,
      message: data.message,
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    // Default to pending if we encounter errors
    return {
      success: false,
      status: 'pending',
      reference: reference,
      message: 'Verification in progress',
    };
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate unique payment reference
 * Format: order_TIMESTAMP_RANDOM
 */
export function generatePaymentReference(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `order_${timestamp}_${random}`;
}

/**
 * Check if a payment status indicates completion
 */
export function isPaymentComplete(status: string): boolean {
  return status === 'success' || status === 'failed' || status === 'expired';
}

/**
 * Check if a payment status indicates success
 */
export function isPaymentSuccessful(status: string): boolean {
  return status === 'success';
}

/**
 * Get retry advice for payment verification
 */
export function getRetryAdvice(status: string): {
  should_retry: boolean;
  wait_ms: number;
  max_attempts: number;
} {
  return {
    should_retry: status === 'pending',
    wait_ms: 2000, // Poll every 2 seconds
    max_attempts: 30, // Give up after 60 seconds
  };
}
