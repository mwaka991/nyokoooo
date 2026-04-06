import { NextRequest, NextResponse } from 'next/server';
import { updateCategory, deleteCategory, getCategoryById } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { parseInput, UpdateCategorySchema } from '@/lib/validation';
import { createErrorResponse, ValidationError, CategoryNotFoundError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

export async function PUT(
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

    const body = await request.json();

    // Validate input (partial update)
    const validation = parseInput(UpdateCategorySchema, body);
    if (!validation.success) {
      throw new ValidationError('Invalid category data', validation.errors);
    }

    // Update category
    const category = await updateCategory(id, validation.data);

    return NextResponse.json(
      {
        success: true,
        data: { category },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}

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
