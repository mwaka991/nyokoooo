// Example API Route - Payment: POST /api/payment/verify

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentById, updatePaymentStatus } from '@/lib/db';
import { verifyFastLipaPayment } from '@/lib/payments';
import { createPremiumSession, getPremiumDurationMinutes } from '@/lib/access';
import { parseInput } from '@/lib/validation';
import { VerifyPaymentSchema, type VerifyPaymentInput } from '@/lib/validation';
import {
  createErrorResponse,
  logError,
  PaymentNotFoundError,
  PaymentPendingError,
  PaymentFailedError,
  ValidationError,
  InternalServerError,
} from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * POST /api/payment/verify
 * 
 * Verify payment status with FastLipa
 * Backend is the source of truth - verifies server-to-server
 * If payment is successful, creates premium access session
 * 
 * Request: { payment_id: "uuid", provider_reference: "order_..." }
 * Response (Success 200):
 * {
 *   success: true,
 *   data: {
 *     status: "paid",
 *     verified_at: "2026-03-31T...",
 *     access_session: {
 *       session_token: "sess_...",
 *       expires_at: "2026-03-31T..."
 *     }
 *   }
 * }
 * Response (Pending 202): Retry later
 * Response (Failed 400): Payment failed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = parseInput<VerifyPaymentInput>(VerifyPaymentSchema, body);
    if (!validation.success) {
      const error = new ValidationError('Invalid verification request', validation.errors);
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    const { payment_id, provider_reference } = validation.data;

    // Get payment from database
    const payment = await getPaymentById(payment_id);
    if (!payment) {
      const error = new PaymentNotFoundError();
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    // Verify with FastLipa (server-to-server, source of truth)
    const fastLipaStatus = await verifyFastLipaPayment(provider_reference);

    logError(new Error('Payment verified with FastLipa'), {
      level: 'INFO',
      paymentId: payment_id,
      reference: provider_reference,
      fastLipaStatus: fastLipaStatus.status,
    });

    // Update payment status in DB
    await updatePaymentStatus(
      payment_id,
      fastLipaStatus.status,
      fastLipaStatus.success
    );

    // If still pending, ask client to retry
    if (fastLipaStatus.status === 'pending') {
      const error = new PaymentPendingError();
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    // If payment failed
    if (fastLipaStatus.status === 'failed' || fastLipaStatus.status === 'expired') {
      logError(new Error('Payment failed or expired'), {
        level: 'WARN',
        paymentId: payment_id,
        status: fastLipaStatus.status,
      });

      const error = new PaymentFailedError(
        fastLipaStatus.message || 'Payment was not confirmed'
      );
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    // Payment succeeded - create premium access session
    if (fastLipaStatus.status === 'success') {
      const durationMinutes = await getPremiumDurationMinutes();
      const sessionData = await createPremiumSession(payment_id, durationMinutes);

      if (!sessionData) {
        logError(new Error('Failed to create access session'), {
          level: 'ERROR',
          paymentId: payment_id,
        });

        const error = new InternalServerError('Failed to grant access');
        return NextResponse.json(
          createErrorResponse(error),
          { status: error.statusCode }
        );
      }

      logError(new Error('Premium access session created'), {
        level: 'INFO',
        paymentId: payment_id,
        sessionId: sessionData.session_token,
        expiresAt: sessionData.expires_at,
      });

      // Return success with session token
      const response = NextResponse.json(
        {
          success: true,
          data: {
            status: 'paid',
            verified_at: new Date().toISOString(),
            access_session: {
              session_token: sessionData.session_token,
              expires_at: sessionData.expires_at,
            },
            message: `Premium access granted for ${durationMinutes} minutes`,
          },
        },
        { status: HTTP_STATUS.OK }
      );

      // Set httpOnly secure cookie
      response.cookies.set('access_token', sessionData.session_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: durationMinutes * 60,
        path: '/',
      });

      return response;
    }

    // Unknown status
    const error = new InternalServerError('Unknown payment status');
    return NextResponse.json(
      createErrorResponse(error),
      { status: error.statusCode }
    );
  } catch (error) {
    logError(error as Error, { endpoint: '/api/payment/verify' });

    const appError = new InternalServerError('Payment verification failed');
    return NextResponse.json(
      createErrorResponse(appError),
      { status: appError.statusCode }
    );
  }
}
