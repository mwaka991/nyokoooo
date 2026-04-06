import { NextRequest, NextResponse } from 'next/server';
import { updateSetting } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { parseInput } from '@/lib/validation';
import { z } from 'zod';
import { createErrorResponse, ValidationError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';
export const dynamic = 'force-dynamic';

const UpdateSettingsSchema = z.object({
  premium_price: z
    .number()
    .int()
    .min(100, 'Premium price must be at least 100 TSH')
    .optional(),
  premium_duration_minutes: z
    .number()
    .int()
    .min(1, 'Premium duration must be at least 1 minute')
    .optional(),
});

export async function PUT(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    const body = await request.json();

    // Validate input
    const validation = parseInput(UpdateSettingsSchema, body);
    if (!validation.success) {
      throw new ValidationError('Invalid settings data', validation.errors);
    }

    const updates: Record<string, any> = {};

    if (validation.data.premium_price !== undefined) {
      updates.premium_price = validation.data.premium_price;
      await updateSetting('PREMIUM_PRICE_TSH', String(validation.data.premium_price));
    }

    if (validation.data.premium_duration_minutes !== undefined) {
      updates.premium_duration_minutes = validation.data.premium_duration_minutes;
      await updateSetting(
        'PREMIUM_DURATION_MINUTES',
        String(validation.data.premium_duration_minutes)
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          settings: updates,
          message: 'Settings updated successfully',
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
