import { NextRequest, NextResponse } from 'next/server';
import { canAccessVideo } from '@/lib/access';
import { extractSessionTokenFromCookie } from '@/lib/access';
import { parseInput } from '@/lib/validation';
import { z } from 'zod';
import { createErrorResponse, ValidationError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

const CheckAccessSchema = z.object({
  video_id: z.string().min(1, 'Video ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = parseInput(CheckAccessSchema, body);
    if (!validation.success) {
      throw new ValidationError('Invalid request data', validation.errors);
    }

    // Extract session token from cookie
    const cookieHeader = request.headers.get('cookie');
    const sessionToken = extractSessionTokenFromCookie(cookieHeader || undefined);

    // Check if user can access video
    const canAccess = await canAccessVideo(validation.data.video_id, sessionToken || undefined);

    return NextResponse.json(
      {
        success: true,
        data: {
          can_access: canAccess,
          video_id: validation.data.video_id,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Check access error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
