import { NextRequest, NextResponse } from 'next/server';
import { countVideos, countCategories, countPayments, countAccessSessions } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { createErrorResponse } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    // Get stats
    const videoCount = await countVideos();
    const categoryCount = await countCategories();
    const paymentCount = await countPayments();
    const accessSessionCount = await countAccessSessions();

    // Calculate revenue (sum of successful payments)
    const successfulPayments = await countPayments('success');

    return NextResponse.json(
      {
        success: true,
        data: {
          statistics: {
            total_videos: videoCount,
            total_categories: categoryCount,
            total_payments: paymentCount,
            successful_payments: successfulPayments,
            active_sessions: accessSessionCount,
            dashboard: {
              videos: videoCount,
              categories: categoryCount,
              payments: paymentCount,
              sessions: accessSessionCount,
            },
          },
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
