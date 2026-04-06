import { NextRequest, NextResponse } from 'next/server';
import { deleteVideo, getVideoById } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { createErrorResponse, VideoNotFoundError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    const { id } = params;

    if (!id) {
      throw new Error('Video ID is required');
    }

    // Check if video exists
    const existing = await getVideoById(id);
    if (!existing) {
      throw new VideoNotFoundError('Video not found');
    }

    // Delete video
    await deleteVideo(id);

    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'Video deleted successfully',
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
