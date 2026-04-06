// FastLipa payment processing integration

import { FastLipaResponse } from '@/types';

const FASTLIPA_API_URL = process.env.FASTLIPA_API_URL;
const FASTLIPA_API_KEY = process.env.FASTLIPA_API_KEY;
const MOCK_PAYMENTS = process.env.MOCK_PAYMENTS === 'true';

// For development: if mock mode is enabled, skip credential check
if (!MOCK_PAYMENTS && (!FASTLIPA_API_URL || !FASTLIPA_API_KEY)) {
  throw new Error(
    'FastLipa configuration missing. Set FASTLIPA_API_URL and FASTLIPA_API_KEY, or enable MOCK_PAYMENTS=true for testing.'
  );
}

// ============================================================================
// PHONE VALIDATION
// ============================================================================

/**
 * Validate Tanzanian phone number
 * Accepts formats: 07xxxxxxxxx, 06xxxxxxxxx, +25577xxxxxxxxx, +25567xxxxxxxxx, 25577xxxxxxxxx, 25567xxxxxxxxx
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Normalize: remove all non-digits
  const normalized = phone.replace(/\D/g, '');

  // Must be 10 digits (07xxxxxxxxx or 06xxxxxxxxx format) - starts with 0
  if (normalized.length === 10) {
    return (normalized.startsWith('07') || normalized.startsWith('06')) || normalized.startsWith('7') || normalized.startsWith('6');
  }

  // or 12 digits (25577xxxxxxxxx or 25567xxxxxxxxx format) - starts with 255
  if (normalized.length === 12) {
    return normalized.startsWith('255') && (normalized[3] === '7' || normalized[3] === '6');
  }

  return false;
}

/**
 * Normalize phone to international format (25577xxxxxxxxx or 25567xxxxxxxxx)
 */
export function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/\D/g, '');

  // Handle 07xxxxxxxxx format (10 digits starting with 07)
  if (normalized.length === 10 && normalized.startsWith('07')) {
    normalized = '255' + normalized.substring(1);
  }
  // Handle 06xxxxxxxxx format (10 digits starting with 06)
  else if (normalized.length === 10 && normalized.startsWith('06')) {
    normalized = '255' + normalized.substring(1);
  }
  // Handle 7xxxxxxxxx format (9 digits starting with 7)
  else if (normalized.length === 9 && normalized.startsWith('7')) {
    normalized = '255' + normalized;
  }
  // Handle 6xxxxxxxxx format (9 digits starting with 6)
  else if (normalized.length === 9 && normalized.startsWith('6')) {
    normalized = '255' + normalized;
  }
  // Already in international format (25577xxxxxxxxx or 25567xxxxxxxxx)
  else if (normalized.length === 12 && normalized.startsWith('255')) {
    // Already correct
  }
  else {
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
 * Initiate payment with FastLipa (or mock for development)
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

    // DEVELOPMENT: Use mock payment for testing
    if (MOCK_PAYMENTS) {
      console.log('🎭 MOCK MODE: Payment simulation', {
        phone,
        amount: input.amount_tsh,
        reference,
        mockStatus: 'success',
      });
      
      // Simulate successful payment initiation
      return {
        success: true,
        reference: reference,
        status: 'pending',
        message: 'Payment initiated successfully (MOCK MODE)',
      };
    }

    // PRODUCTION: Call real FastLipa API
    const endpoint = `${FASTLIPA_API_URL}/api/create-transaction`;
    const payload = {
      number: phone,
      amount: input.amount_tsh,
      name: 'Uzima Premium Customer', // FastLipa requires a name field
    };
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔵 FastLipa CREATE Transaction Request');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('URL:', endpoint);
    console.log('Method: POST');
    console.log('Auth Header: Bearer', FASTLIPA_API_KEY?.substring(0, 10) + '***');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('═══════════════════════════════════════════════════════════\n');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FASTLIPA_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    const contentType = response.headers.get('content-type');
    const isHTML = contentType?.includes('text/html');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔵 FastLipa CREATE Transaction Response');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Status Code:', response.status, response.statusText);
    console.log('Content-Type:', contentType);
    console.log('Is HTML (indicates wrong endpoint):', isHTML);
    console.log('Raw Body Preview:', responseText.substring(0, 500));
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (isHTML) {
      throw new Error(`Wrong FastLipa endpoint or wrong request format. Got HTML response instead of JSON. Check FASTLIPA_API_URL: ${FASTLIPA_API_URL}`);
    }

    if (!response.ok) {
      console.error('❌ FastLipa API error:', {
        status: response.status,
        endpoint,
        response: responseText.substring(0, 1000),
      });
      return {
        success: false,
        reference: '',
        status: 'failed',
        error: `FastLipa error: ${response.status} ${response.statusText}`,
      };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ FastLipa response is not JSON:', responseText.substring(0, 500));
      throw new Error(`FastLipa returned invalid JSON response: ${responseText.substring(0, 200)}`);
    }

    // FastLipa returns tranID (not reference)
    const fastLipaTransactionId = data.data?.tranID;
    if (!fastLipaTransactionId) {
      throw new Error(`FastLipa response missing tranID: ${responseText}`);
    }

    return {
      success: true,
      reference: fastLipaTransactionId, // Store FastLipa's tranID as our reference
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

    // DEVELOPMENT: Use mock response for testing
    if (MOCK_PAYMENTS) {
      console.log('🎭 MOCK MODE: Payment verification', {
        reference,
        mockStatus: 'success',
      });
      
      // Simulate successful payment verification
      // In mock mode, all payments are treated as successful
      return {
        success: true,
        status: 'success',
        reference: reference,
        message: 'Payment verified successfully (MOCK MODE)',
      };
    }

    // PRODUCTION: Call real FastLipa API
    const endpoint = `${FASTLIPA_API_URL}/api/status-transaction?tranid=${encodeURIComponent(reference)}`;
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🟢 FastLipa CHECK Transaction Status Request');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('URL:', endpoint);
    console.log('Method: GET');
    console.log('Auth Header: Bearer', FASTLIPA_API_KEY?.substring(0, 10) + '***');
    console.log('Query Param tranid:', reference);
    console.log('═══════════════════════════════════════════════════════════\n');

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FASTLIPA_API_KEY}`,
      },
    });

    const responseText = await response.text();
    const contentType = response.headers.get('content-type');
    const isHTML = contentType?.includes('text/html');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🟢 FastLipa CHECK Transaction Status Response');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Status Code:', response.status, response.statusText);
    console.log('Content-Type:', contentType);
    console.log('Is HTML (indicates wrong endpoint):', isHTML);
    console.log('Raw Body Preview:', responseText.substring(0, 500));
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // If we got HTML (404 page), throw error instead of silently retrying
    if (isHTML) {
      const error = new Error(
        `Wrong FastLipa endpoint or wrong request format. Got HTML ${response.status} instead of JSON. ` +
        `Check FASTLIPA_API_URL: ${FASTLIPA_API_URL}/status-transaction . ` +
        `Response preview: ${responseText.substring(0, 200)}`
      );
      console.error('❌', error.message);
      throw error;
    }

    if (!response.ok) {
      const error = new Error(
        `FastLipa status check failed with status ${response.status}: ${responseText}`
      );
      console.error('❌', error.message);
      throw error;
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      const error = new Error(
        `FastLipa returned non-JSON response:\n${responseText.substring(0, 500)}`
      );
      console.error('❌', error.message);
      throw error;
    }

    // FastLipa uses 'payment_status' field with values: PENDING, COMPLETED, CANCELLED
    const fastLipaStatus = data.data?.payment_status;
    if (!fastLipaStatus) {
      throw new Error(`FastLipa response missing payment_status field: ${responseText}`);
    }

    // Map FastLipa status to our status
    const statusMap: Record<string, string> = {
      COMPLETED: 'success',
      PENDING: 'pending',
      CANCELLED: 'failed',
      // For backwards compatibility
      success: 'success',
      pending: 'pending',
      failed: 'failed',
      expired: 'expired',
      cancelled: 'failed',
      processing: 'pending',
      completed: 'success',
      paid: 'success',
    };

    const status = statusMap[fastLipaStatus] || 'pending';

    return {
      success: status === 'success',
      status: status as any,
      reference: reference,
      message: data.message,
    };
  } catch (error) {
    // Re-throw errors related to wrong endpoint or configuration
    // These should NOT be silently caught
    if (error instanceof Error) {
      if (
        error.message.includes('Wrong FastLipa endpoint') ||
        error.message.includes('returned non-JSON') ||
        error.message.includes('HTTP')
      ) {
        console.error('❌ Critical FastLipa error - throwing to caller:', error.message);
        throw error;
      }
    }
    
    // For other unexpected errors, log and throw
    console.error('❌ Payment verification unexpected error:', error);
    throw error instanceof Error ? error : new Error(String(error));
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
