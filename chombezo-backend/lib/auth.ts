// Admin authentication - JWT tokens and password handling

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { JWTPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET must be set and at least 32 characters long. Check your environment variables.'
  );
}

// ============================================================================
// PASSWORD FUNCTIONS
// ============================================================================

/**
 * Hash a password for storage
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against its hash
 * @param password Plain text password to check
 * @param hash Stored hash
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// JWT FUNCTIONS
// ============================================================================

/**
 * Generate a JWT token for an admin
 * @param adminId Admin UUID
 * @param email Admin email
 * @returns JWT token valid for 24 hours
 */
export function generateJWT(adminId: string, email: string): string {
  const payload = {
    sub: adminId,
    email: email,
    type: 'admin',
  };

  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

/**
 * Verify and decode a JWT token
 * @param token JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!, {
      algorithms: ['HS256'],
    });

    return decoded as JWTPayload;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

// ============================================================================
// TOKEN EXTRACTION
// ============================================================================

/**
 * Extract JWT token from Authorization header
 * Expected format: "Bearer <token>"
 * @param authHeader Authorization header value
 * @returns Token or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7); // Remove "Bearer " prefix
}

// ============================================================================
// LOGIN/LOGOUT HELPERS
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  adminId: string;
  email: string;
  expiresIn: string;
}

/**
 * Validate login credentials format
 */
export function validateLoginInput(input: unknown): LoginCredentials | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  const { email, password } = input as any;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return null;
  }

  if (email.length < 5 || email.length > 255) {
    return null;
  }

  if (password.length < 8) {
    return null;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return null;
  }

  return { email: email.toLowerCase().trim(), password };
}

/**
 * Get token expiration time in hours
 */
export function getTokenExpirationHours(): number {
  return 24;
}
