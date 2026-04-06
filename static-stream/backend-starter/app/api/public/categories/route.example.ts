// Example API Route - Public: GET /api/public/categories

import { NextRequest, NextResponse } from 'next/server';
import { getCategoriesPublic } from '@/lib/db';
import { createErrorResponse, logError, InternalServerError } from '@/lib/errors';

/**
 * GET /api/public/categories
 * 
 * Fetch all active public categories
 * Optional: includePremium=true to include premium categories
 * 
 * Response: { success, data: { categories } }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePremium = searchParams.get('includePremium') === 'true';

    const categories = await getCategoriesPublic(includePremium);

    return NextResponse.json({
      success: true,
      data: {
        categories: categories || [],
      },
    });
  } catch (error) {
    logError(error as Error, { endpoint: '/api/public/categories' });

    const appError = new InternalServerError('Failed to fetch categories');
    return NextResponse.json(
      createErrorResponse(appError),
      { status: appError.statusCode }
    );
  }
}
