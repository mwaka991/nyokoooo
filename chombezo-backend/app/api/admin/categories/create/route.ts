import { NextRequest, NextResponse } from 'next/server';
import { createCategory } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { parseInput, CreateCategorySchema } from '@/lib/validation';
import { createErrorResponse, ValidationError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    const body = await request.json();

    // Validate input
    const validation = parseInput(CreateCategorySchema, body);
    if (!validation.success) {
      throw new ValidationError('Invalid category data', validation.errors);
    }

    // Create category
    const category = await createCategory({
      name: validation.data.name,
      slug: validation.data.slug,
      description: validation.data.description || null,
      is_premium: validation.data.is_premium ?? false,
      is_active: true,
      sort_order: validation.data.sort_order ?? 0,
    });

    return NextResponse.json(
      {
        success: true,
        data: { category },
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
