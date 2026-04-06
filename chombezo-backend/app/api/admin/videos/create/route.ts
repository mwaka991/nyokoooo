import { NextRequest, NextResponse } from 'next/server';
import { createVideo } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { parseInput, CreateVideoSchema } from '@/lib/validation';
import { createErrorResponse, ValidationError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    const body = await request.json();

    // Validate input
    const validation = parseInput(CreateVideoSchema, body);
    if (!validation.success) {
      throw new ValidationError('Invalid video data', validation.errors);
    }

    // Create video
    const video = await createVideo({
      category_id: validation.data.category_id,
      title: validation.data.title,
      description: validation.data.description || null,
      thumbnail_url: validation.data.thumbnail_url || null,
      video_url: validation.data.video_url,
      is_premium: validation.data.is_premium ?? false,
      sort_order: validation.data.sort_order ?? 0,
    });

    return NextResponse.json(
      {
        success: true,
        data: { video },
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    console.error('Create video error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
