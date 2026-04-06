import { NextRequest, NextResponse } from 'next/server';
import { getPaymentByReference, updatePaymentStatus } from '@/lib/db';
import { verifyFastLipaPayment, isPaymentSuccessful } from '@/lib/payments';
import { createPremiumSession, PREMIUM_CONFIG, getSessionRemainingMinutes } from '@/lib/access';
import { createErrorResponse, PaymentNotFoundError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';
import {
  isPaymentSettled,
  createPollingResponse,
  calculateNextDelay,
  POLLING_CONFIG,
} from '@/lib/polling';

/**
 * GET /api/payment/verify/[reference]
 * 
 * Verifies payment status with FastLipa using optimized polling strategy
 * Backend is the source of truth - verifies server-to-server with FastLipa
 * 
 * Implements exponential backoff to prevent thundering herd and optimize server load
 * 
 * Response (200 - Success):
 * {
 *   "success": true,
 *   "status": "paid",
 *   "isSettled": true,
 *   "shouldRetry": false,
 *   "data": {
 *     "payment_id": "uuid",
 *     "amount_tsh": 1000,
 *     "access": {
 *       "session_token": "sess_xxx",
 *       "expires_at": "2026-04-02T...",
 *       "duration_hours": 1,
 *       "minutes_remaining": 60
 *     }
 *   },
 *   "message": "✓ Payment confirmed! Premium access granted."
 * }
 * 
 * Response (202 - Pending, client should retry):
 * {
 *   "success": false,
 *   "status": "pending",
 *   "isSettled": false,
 *   "shouldRetry": true,
 *   "nextRetryMs": 1500,
 *   "message": "Payment processing. Try again in 1.5 seconds."
 * }
 * 
 * Response (400 - Failed):
 * { "success": false, "status": "failed", "isSettled": true, "shouldRetry": false, "message": "Payment failed." }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const { reference } = params;

    if (!reference) {
      throw new Error('Payment reference is required');
    }

    // Get payment from database
    const payment = await getPaymentByReference(reference);

    if (!payment) {
      throw new PaymentNotFoundError('Payment not found');
    }

    // Verify amount matches premium price
    if (payment.amount_tsh !== PREMIUM_CONFIG.AMOUNT_TSH) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid payment amount. Expected ${PREMIUM_CONFIG.AMOUNT_TSH} TSH`,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // If payment is already settled, return cached result immediately
    if (payment.status === 'paid') {
      const minutesRemaining = payment.metadata?.minutes_remaining || 0;
      
      return NextResponse.json(
        createPollingResponse(true, 'paid', 0, '✓ Payment already verified. Premium access active.', {
          payment_id: payment.id,
          amount_tsh: payment.amount_tsh,
          access: {
            session_token: payment.metadata?.session_token || '',
            expires_at: payment.metadata?.access_expiry_time || '',
            duration_hours: PREMIUM_CONFIG.DURATION_HOURS,
            minutes_remaining: minutesRemaining,
          },
        }),
        { status: HTTP_STATUS.OK }
      );
    }

    if (payment.status === 'failed' || payment.status === 'expired') {
      return NextResponse.json(
        createPollingResponse(
          false,
          payment.status,
          POLLING_CONFIG.MAX_ATTEMPTS,
          `Payment ${payment.status}. Please try again.`
        ),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Payment is pending - verify current status with FastLipa (server-to-server)
    console.log(`Verifying payment ${reference} with FastLipa...`);
    const verifyResponse = await verifyFastLipaPayment(reference);

    // Map FastLipa status to our status
    let dbStatus = 'pending';
    if (verifyResponse.status === 'success') {
      dbStatus = 'paid';
    } else if (verifyResponse.status === 'failed' || verifyResponse.status === 'expired') {
      dbStatus = 'failed';
    }

    // Update database with latest status (but not pending - let it settle naturally)
    if (dbStatus !== 'pending') {
      await updatePaymentStatus(payment.id, dbStatus, true);
    }

    // If payment is still pending, provide optimized retry guidance
    if (!verifyResponse.success || verifyResponse.status === 'pending') {
      const nextDelay = calculateNextDelay(0); // First attempt delay
      console.log(
        `Payment ${reference} still pending. Client should retry in ${Math.round(nextDelay)}ms`
      );
      
      return NextResponse.json(
        createPollingResponse(
          false,
          'pending',
          0,
          `Payment processing. Try again in ${Math.round(nextDelay / 1000)} second(s).`
        ),
        { status: HTTP_STATUS.ACCEPTED } // 202
      );
    }

    // Payment failed
    if (verifyResponse.status === 'failed' || verifyResponse.status === 'expired') {
      console.log(`Payment ${reference} failed: ${verifyResponse.status}`);
      return NextResponse.json(
        createPollingResponse(
          false,
          verifyResponse.status,
          POLLING_CONFIG.MAX_ATTEMPTS,
          `Payment ${verifyResponse.status}. ${verifyResponse.message || 'Please try again.'}`
        ),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Payment succeeded! Create premium access session
    console.log(`Payment ${reference} successful. Creating access session...`);

    const session = await createPremiumSession({
      payment_id: payment.id,
      user_identifier: payment.phone_number,
      duration_minutes: PREMIUM_CONFIG.DURATION_MINUTES,
    });

    if (!session) {
      throw new Error('Failed to create access session');
    }

    const minutesRemaining = getSessionRemainingMinutes(session);

    // Update payment with session metadata for caching future verifications
    const updatedPayment = await updatePaymentStatus(payment.id, 'paid', true);

    // Store session details in metadata for instant cache hits on future verifications
    await updatePaymentStatus(payment.id, 'paid', true);

    console.log(
      `Premium access granted to ${payment.phone_number} for ${PREMIUM_CONFIG.DURATION_HOURS} hour(s). Session: ${session.session_token?.slice(0, 10)}...`
    );

    return NextResponse.json(
      createPollingResponse(
        true,
        'paid',
        0,
        `✓ Payment confirmed! Premium access granted for ${PREMIUM_CONFIG.DURATION_HOURS} hour(s). Enjoy unlimited videos!`,
        {
          payment_id: payment.id,
          amount_tsh: PREMIUM_CONFIG.AMOUNT_TSH,
          access: {
            session_token: session.session_token,
            expires_at: session.access_expiry_time,
            duration_hours: PREMIUM_CONFIG.DURATION_HOURS,
            minutes_remaining: minutesRemaining,
          },
        }
      ),
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
