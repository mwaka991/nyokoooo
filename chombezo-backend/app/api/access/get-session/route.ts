import { NextRequest, NextResponse } from 'next/server';
import { createPremiumSession } from '@/lib/access';
import { parseInput } from '@/lib/validation';
import { z } from 'zod';
import { createErrorResponse, ValidationError } from '@/lib/errors';
import { getAccessCookieHeader } from '@/lib/access';
import { HTTP_STATUS } from '@/lib/constants';

const GetSessionSchema = z.object({
  user_identifier: z.string().min(1, 'User identifier is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = parseInput(GetSessionSchema, body);
    if (!validation.success) {
      throw new ValidationError('Invalid request data', validation.errors);
    }

    // Create premium session
    const session = await createPremiumSession({
      user_identifier: validation.data.user_identifier,
    });

    if (!session) {
      throw new Error('Failed to create session');
    }

    const cookie = getAccessCookieHeader(session.session_token);

    const response = NextResponse.json(
      {
        success: true,
        data: {
          session_token: session.session_token,
          expires_at: session.access_expiry_time,
          message: 'Session created successfully',
        },
      },
      { status: HTTP_STATUS.CREATED }
    );

    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
