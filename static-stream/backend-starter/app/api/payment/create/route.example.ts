// Example API Route - Payment: POST /api/payment/create

import { NextRequest, NextResponse } from 'next/server';
import { createPayment, getSetting } from '@/lib/db';
import { createFastLipaPayment, validatePhoneNumber, normalizePhoneNumber } from '@/lib/payments';
import { parseInput } from '@/lib/validation';
import { CreatePaymentSchema, type CreatePaymentInput } from '@/lib/validation';
import {
  createErrorResponse,
  logError,
  InvalidPhoneError,
  PaymentInitiationError,
  ValidationError,
} from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * POST /api/payment/create
 * 
 * Initiate a payment request with FastLipa
 * Creates a payment record in the database for tracking
 * 
 * Request: { phone_number: "07xxxxxxxxx", amount_tsh: 1000 }
 * Response: {
 *   success: true,
 *   data: {
 *     payment_id: "uuid",
 *     provider_reference: "order_...",
 *     amount_tsh: 1000,
 *     status: "pending",
 *     poll_interval_ms: 2000
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validation = parseInput<CreatePaymentInput>(CreatePaymentSchema, body);
    if (!validation.success) {
      const error = new ValidationError('Invalid payment details', validation.errors);
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    const { phone_number, amount_tsh } = validation.data;

    // Validate phone number
    if (!validatePhoneNumber(phone_number)) {
      const error = new InvalidPhoneError();
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    // Get premium price from settings
    const premiumPrice = await getSetting('PREMIUM_PRICE_TSH');
    const expectedAmount = parseInt(premiumPrice || '1000', 10);

    // Verify amount matches premium price
    if (amount_tsh !== expectedAmount) {
      const error = new ValidationError(
        `Amount must match premium price: ${expectedAmount} TSH`
      );
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone_number);

    // Call FastLipa to initiate payment
    const fastLipaResponse = await createFastLipaPayment({
      phone_number: normalizedPhone,
      amount_tsh: amount_tsh,
    });

    if (!fastLipaResponse.success) {
      logError(new Error('FastLipa payment creation failed'), {
        phone: normalizedPhone,
        amount: amount_tsh,
        response: fastLipaResponse,
      });

      const error = new PaymentInitiationError();
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    // Create payment record in database
    const payment = await createPayment({
      provider: 'fastlipa',
      provider_reference: fastLipaResponse.reference,
      amount_tsh: amount_tsh,
      phone_number: normalizedPhone,
      status: 'pending',
      metadata: {
        initiated_at: new Date().toISOString(),
        fastlipa_response: fastLipaResponse,
      },
    });

    logError(new Error('Payment created'), {
      level: 'INFO',
      paymentId: payment.id,
      reference: fastLipaResponse.reference,
      phone: normalizedPhone,
      amount: amount_tsh,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          payment_id: payment.id,
          provider_reference: fastLipaResponse.reference,
          amount_tsh: amount_tsh,
          phone_number: normalizedPhone,
          status: 'pending',
          poll_interval_ms: 2000,
          message: 'Payment initiated. Please confirm on your phone.',
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    logError(error as Error, { endpoint: '/api/payment/create' });

    const appError = new (require('@/lib/errors').InternalServerError)(
      'Failed to initiate payment'
    );
    return NextResponse.json(
      createErrorResponse(appError),
      { status: appError.statusCode }
    );
  }
}
