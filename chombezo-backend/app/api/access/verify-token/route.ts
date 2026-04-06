import { NextRequest, NextResponse } from 'next/server';
import { checkAccessSession, getSessionRemainingMinutes, PREMIUM_CONFIG } from '@/lib/access';
import { createErrorResponse, ValidationError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';
import { z } from 'zod';

/**
 * POST /api/access/verify-token
 * 
 * Verifies a premium access session token (1-hour expiry enforcement)
 * 
 * Request:
 * {
 *   "session_token": "sess_xxx"
 * }
 * 
 * Response (200 - Valid):
 * {
 *   "success": true,
 *   "data": {
 *     "has_access": true,
 *     "expires_at": "2026-04-02T12:00:00Z",
 *     "minutes_remaining": 45,
 *     "duration_hours": 1,
 *     "message": "Premium access active"
 *   }
 * }
 * 
 * Response (401 - Invalid/Expired):
 * {
 *   "success": false,
 *   "data": {
 *     "has_access": false,
 *     "message": "Session expired. Purchase access again."
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const schema = z.object({
      session_token: z.string().min(1, 'Session token is required'),
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      // Format ZodIssues as Record<string, string>
      const errors: Record<string, string> = {};
      for (const error of result.error.errors) {
        const path = error.path.join('.');
        const message = error.message;
        errors[path] = message;
      }
      throw new ValidationError('Invalid request', errors);
    }

    const { session_token } = result.data;

    // Check if session is valid and not expired
    const session = await checkAccessSession(session_token);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          data: {
            has_access: false,
            message: 'Session expired or invalid. Purchase premium access for 1 hour.',
          },
        },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Calculate remaining time
    const minutesRemaining = getSessionRemainingMinutes(session);

    return NextResponse.json(
      {
        success: true,
        data: {
          has_access: true,
          expires_at: session.access_expiry_time,
          minutes_remaining: minutesRemaining,
          duration_hours: PREMIUM_CONFIG.DURATION_HOURS,
          message: `Premium access active. Expires in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
