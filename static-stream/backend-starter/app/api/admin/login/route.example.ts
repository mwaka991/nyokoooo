// Example API Route - Admin: POST /api/admin/login

import { NextRequest, NextResponse } from 'next/server';
import { getAdminByEmail } from '@/lib/db';
import { verifyPassword, generateJWT, getTokenExpirationHours, validateLoginInput } from '@/lib/auth';
import { createErrorResponse, logError, InvalidCredentialsError, InvalidInputError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * POST /api/admin/login
 * 
 * Authenticate admin with email and password
 * Returns JWT token valid for 24 hours
 * 
 * Request: { email, password }
 * Response: { success, data: { admin, token, expires_in_hours } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const credentials = validateLoginInput(body);
    if (!credentials) {
      const error = new InvalidInputError('Email and password are required');
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    // Find admin by email
    const admin = await getAdminByEmail(credentials.email);
    if (!admin) {
      logError(new Error('Login attempt: admin not found'), {
        email: credentials.email,
      });

      const error = new InvalidCredentialsError();
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(
      credentials.password,
      admin.password_hash
    );

    if (!passwordValid) {
      logError(new Error('Login attempt: invalid password'), {
        adminId: admin.id,
        email: admin.email,
      });

      const error = new InvalidCredentialsError();
      return NextResponse.json(
        createErrorResponse(error),
        { status: error.statusCode }
      );
    }

    // Generate JWT token
    const token = generateJWT(admin.id, admin.email);
    const expiresInHours = getTokenExpirationHours();

    logError(new Error('Admin login successful'), {
      level: 'INFO',
      adminId: admin.id,
      email: admin.email,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          admin: {
            id: admin.id,
            email: admin.email,
          },
          token: token,
          expires_in_hours: expiresInHours,
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    logError(error as Error, { endpoint: '/api/admin/login' });

    const appError = new (require('@/lib/errors').InternalServerError)(
      'Login failed'
    );
    return NextResponse.json(
      createErrorResponse(appError),
      { status: appError.statusCode }
    );
  }
}
