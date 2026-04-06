import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { createErrorResponse } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    const settingsMap = await getAllSettings();

    return NextResponse.json(
      {
        success: true,
        data: { settings: settingsMap },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
