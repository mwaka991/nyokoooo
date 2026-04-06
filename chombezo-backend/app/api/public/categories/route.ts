import { NextRequest, NextResponse } from 'next/server';
import { getCategoriesPublic } from '@/lib/db';
import { createErrorResponse } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    // Include premium categories by default
    const categories = await getCategoriesPublic(true);

    return NextResponse.json(
      {
        success: true,
        data: { categories },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
