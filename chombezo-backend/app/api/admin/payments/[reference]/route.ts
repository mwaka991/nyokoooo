import { NextRequest, NextResponse } from 'next/server';
import { getPaymentByReference } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { createErrorResponse, PaymentNotFoundError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    const { reference } = params;

    if (!reference) {
      throw new Error('Payment reference is required');
    }

    const payment = await getPaymentByReference(reference);

    if (!payment) {
      throw new PaymentNotFoundError('Payment not found');
    }

    return NextResponse.json(
      {
        success: true,
        data: { payment },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Get payment error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
