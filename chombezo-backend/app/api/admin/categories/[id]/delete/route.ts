import { NextRequest, NextResponse } from 'next/server';
import { deleteCategory, getCategoryById } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { createErrorResponse, CategoryNotFoundError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    const { id } = params;

    if (!id) {
      throw new Error('Category ID is required');
    }

    // Check if category exists
    const existing = await getCategoryById(id);
    if (!existing) {
      throw new CategoryNotFoundError('Category not found');
    }

    // Delete category
    await deleteCategory(id);

    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'Category deleted successfully',
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
