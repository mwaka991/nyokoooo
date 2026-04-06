import { NextRequest, NextResponse } from 'next/server';
import { getAdminByEmail } from '@/lib/db';
import { verifyPassword, generateJWT, validateLoginInput } from '@/lib/auth';
import { parseInput, LoginSchema } from '@/lib/validation';
import { createErrorResponse, ValidationError, InvalidCredentialsError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = parseInput(LoginSchema, body);
    if (!validation.success) {
      throw new ValidationError('Invalid login credentials', validation.errors);
    }

    // Find admin by email
    const admin = await getAdminByEmail(validation.data.email);

    if (!admin) {
      throw new InvalidCredentialsError('Invalid email or password');
    }

    // Check if admin is active
    if (!admin.is_active) {
      throw new InvalidCredentialsError('Account is inactive');
    }

    // Verify password
    const passwordValid = await verifyPassword(validation.data.password, admin.password_hash);

    if (!passwordValid) {
      throw new InvalidCredentialsError('Invalid email or password');
    }

    // Generate JWT token
    const token = generateJWT(admin.id, admin.email);

    return NextResponse.json(
      {
        success: true,
        data: {
          token,
          admin: {
            id: admin.id,
            email: admin.email,
          },
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
