import { NextRequest, NextResponse } from 'next/server';
import { getCategoryBySlug } from '@/lib/db';
import { createErrorResponse } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';
import { CategoryNotFoundError } from '@/lib/errors';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      throw new Error('Category ID is required');
    }

    const category = await getCategoryBySlug(id);

    if (!category) {
      throw new CategoryNotFoundError('Category not found');
    }

    return NextResponse.json(
      {
        success: true,
        data: { category },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
