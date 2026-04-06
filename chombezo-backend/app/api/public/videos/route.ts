import { NextRequest, NextResponse } from 'next/server';
import { getVideosPublic } from '@/lib/db';
import { parseInput, PaginationSchema } from '@/lib/validation';
import { createErrorResponse, ValidationError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const validation = parseInput(PaginationSchema, { page, limit });
    if (!validation.success) {
      throw new ValidationError('Invalid pagination parameters', validation.errors);
    }

    const offset = ((validation.data.page ?? 1) - 1) * (validation.data.limit ?? 20);
    const { videos, total } = await getVideosPublic(validation.data.limit ?? 20, offset);

    return NextResponse.json(
      {
        success: true,
        data: {
          videos,
          pagination: {
            page: validation.data.page ?? 1,
            limit: validation.data.limit ?? 20,
            total,
            totalPages: Math.ceil(total / (validation.data.limit ?? 20)),
          },
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Get videos error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
