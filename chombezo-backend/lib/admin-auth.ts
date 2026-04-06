// Admin authentication middleware
import { NextRequest } from 'next/server';
import { verifyJWT, extractTokenFromHeader } from '@/lib/auth';
import { UnauthorizedError, TokenExpiredError, TokenInvalidError } from '@/lib/errors';

export async function requireAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    throw new UnauthorizedError('Authorization header required');
  }

  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    throw new UnauthorizedError('Bearer token required');
  }

  try {
    const payload = verifyJWT(token);

    if (!payload) {
      throw new TokenInvalidError('Invalid token');
    }

    return payload;
  } catch (error) {
    if ((error as any).name === 'TokenExpiredError') {
      throw new TokenExpiredError('Token has expired');
    }
    throw new TokenInvalidError('Invalid token');
  }
}
