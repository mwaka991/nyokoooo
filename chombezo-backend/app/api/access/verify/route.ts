import { NextRequest, NextResponse } from 'next/server';
import { checkAccessSession, updateSessionLastAccessed, getSessionRemainingMinutes } from '@/lib/access';
import { extractSessionTokenFromCookie } from '@/lib/access';
import { createErrorResponse } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // Extract session token from cookie
    const cookieHeader = request.headers.get('cookie');
    const sessionToken = extractSessionTokenFromCookie(cookieHeader || undefined);

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          data: {
            valid: false,
            message: 'No session token provided',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Check if session is valid
    const session = await checkAccessSession(sessionToken);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          data: {
            valid: false,
            message: 'Invalid or expired session',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Update last accessed timestamp
    await updateSessionLastAccessed(sessionToken);

    // Get remaining time
    const remainingMinutes = getSessionRemainingMinutes(session);

    return NextResponse.json(
      {
        success: true,
        data: {
          valid: true,
          session_token: sessionToken,
          expires_at: session.access_expiry_time,
          remaining_minutes: remainingMinutes,
          user_identifier: session.phone_number,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Verify session error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
