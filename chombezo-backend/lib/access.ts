/**
 * Premium access session management with 1-hour expiry
 * 
 * Features:
 * - Session tokens with secure generation
 * - Automatic 1-hour expiry enforcement
 * - Backend-verified access control
 * - Phone-based session tracking
 * - Audit logging of access attempts
 */

import { createClient } from '@supabase/supabase-js';
import { getRequiredEnv } from '@/lib/env';
import { AccessSession } from '@/types';
import { randomBytes } from 'crypto';
import { createAccessSession } from '@/lib/db';

let supabaseClient: any = null;

function getAccessSupabaseClient(): any {
  if (!supabaseClient) {
    const supabaseUrl = getRequiredEnv('SUPABASE_URL');
    const supabaseServiceKey = getRequiredEnv('SUPABASE_SERVICE_KEY');

    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }) as any;
  }
  return supabaseClient;
}

// Session token prefix for security
const SESSION_TOKEN_PREFIX = 'sess_';

// Premium configuration (fixed amounts and durations)
export const PREMIUM_CONFIG = {
  AMOUNT_TSH: 1000, // Fixed premium price
  DURATION_MINUTES: 60, // 1 hour access
  DURATION_HOURS: 1,
  CATEGORY_SLUG: 'connections', // Premium category
};

// ============================================================================
// SESSION TOKEN GENERATION
// ============================================================================

/**
 * Generate cryptographically secure session token
 */
export function generateSessionToken(): string {
  const random = randomBytes(32).toString('hex');
  return SESSION_TOKEN_PREFIX + random;
}

// ============================================================================
// SESSION CHECKING
// ============================================================================

/**
 * Check if a session token is valid and active
 * Validates expiry times against current timestamp
 */
export async function checkAccessSession(
  token: string
): Promise<AccessSession | null> {
  try {
    if (!token || !token.startsWith(SESSION_TOKEN_PREFIX)) {
      return null;
    }

    const { data, error } = await getAccessSupabaseClient().from('access_sessions')
      .select('*')
      .eq('session_token', token)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    // Check expiry time against current timestamp
    const expiryDate = new Date(data.access_expiry_time);
    const now = new Date();

    if (expiryDate < now) {
      // Session has expired - mark as inactive
      await getAccessSupabaseClient().from('access_sessions')
        .update({ is_active: false })
        .eq('id', data.id);

      console.log(`Session ${token.slice(0, 10)}... expired`);
      return null;
    }

    return data as AccessSession;
  } catch (error) {
    console.error('Access session check error:', error);
    return null;
  }
}

/**
 * Get remaining session time in minutes (1 hour max)
 * Returns 0 if expired or session not found
 */
export function getSessionRemainingMinutes(session: AccessSession): number {
  if (!session) {
    return 0;
  }

  // Use access_expiry_time field
  const expiryStr = session.access_expiry_time;
  if (!expiryStr) {
    return 0;
  }

  const expiry = new Date(expiryStr);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 0;
  }

  const minutes = Math.ceil(diffMs / 60000);
  // Cap at PREMIUM_CONFIG.DURATION_MINUTES to ensure max 1 hour
  return Math.min(minutes, PREMIUM_CONFIG.DURATION_MINUTES);
}

// ============================================================================
// VIDEO ACCESS CONTROL
// ============================================================================

/**
 * Check if a user can access a specific video
 */
export async function canAccessVideo(
  videoId: string,
  sessionToken?: string
): Promise<boolean> {
  try {
    // Get video to check if it's premium
    const { data: video, error: videoError } = await getAccessSupabaseClient().from('videos')
      .select('is_premium, category_id')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return false;
    }

    // If not premium, always accessible
    if (!video.is_premium) {
      return true;
    }

    // Check if category is premium
    const isPremium = await isCategoryPremium(video.category_id);
    if (!isPremium) {
      return true; // Category not premium, so video is accessible
    }

    // Video and category are premium, need valid session
    if (!sessionToken) {
      return false;
    }

    const session = await checkAccessSession(sessionToken);
    return session !== null;
  } catch (error) {
    console.error('Access check error:', error);
    return false;
  }
}

/**
 * Check if a category is marked as premium
 */
export async function isCategoryPremium(categoryId: string): Promise<boolean> {
  try {
    const { data, error } = await getAccessSupabaseClient().from('categories')
      .select('is_premium')
      .eq('id', categoryId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.is_premium === true;
  } catch (error) {
    console.error('Category premium check error:', error);
    return false;
  }
}

// ============================================================================
// SESSION CREATION
// ============================================================================

export interface CreateSessionInput {
  user_identifier: string; // Phone number or device ID
  duration_minutes?: number;
}

/**
 * Create premium access session (after successful payment)
 * Returns session with token and expiry information
 * NOTE: payment_id is optional for backward compatibility (dev/testing only)
 */
export async function createPremiumSession(
  input: CreateSessionInput & { payment_id?: string }
): Promise<AccessSession | null> {
  try {
    const token = generateSessionToken();
    const durationMinutes = PREMIUM_CONFIG.DURATION_MINUTES;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    // For dev/testing: if payment_id not provided, use placeholder
    // In production, payment_id MUST come from payment verification
    const paymentId = input.payment_id || `dev_${token}`;

    // Call db wrapper with all required fields
    const session = await createAccessSession({
      payment_id: paymentId,
      session_token: token,
      phone_number: input.user_identifier,
      access_start_time: now.toISOString(),
      access_expiry_time: expiresAt.toISOString(),
    });

    if (!session) {
      console.error('Failed to create access session');
      return null;
    }

    console.log(`Premium session created for ${input.user_identifier}, expires at ${expiresAt.toISOString()}`);
    return session as AccessSession;
  } catch (error) {
    console.error('Create session error:', error);
    return null;
  }
}

/**
 * Invalidate a session (logout/expire)
 */
export async function invalidateSession(token: string): Promise<boolean> {
  try {
    const { error } = await getAccessSupabaseClient().from('access_sessions')
      .update({ is_active: false })
      .eq('session_token', token);

    if (error) {
      console.error('Invalidate session error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Invalidate error:', error);
    return false;
  }
}

/**
 * Update the last_accessed timestamp (keep session alive on each use)
 */
export async function updateSessionLastAccessed(
  token: string
): Promise<boolean> {
  try {
    const { error } = await getAccessSupabaseClient().from('access_sessions')
      .update({ last_accessed: new Date().toISOString() })
      .eq('session_token', token)
      .eq('active', true);

    if (error) {
      console.error('Update last accessed error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Update session error:', error);
    return false;
  }
}

// ============================================================================
// CLEANUP (Background Task)
// ============================================================================

/**
 * Mark all expired sessions as inactive (background cleanup task)
 * Enforces 1-hour expiry limit
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const now = new Date().toISOString();

    const { data: expired, error: fetchError } = await getAccessSupabaseClient().from('access_sessions')
      .select('id')
      .eq('active', true)
      .or(`access_expiry_time.lt.${now},expires_at.lt.${now}`);

    if (fetchError) {
      console.error('Fetch expired sessions error:', fetchError);
      return 0;
    }

    if (!expired || expired.length === 0) {
      console.log('No expired sessions to clean up');
      return 0;
    }

    const ids = expired.map((s: { id: string }) => s.id);

    const { error: updateError } = await getAccessSupabaseClient().from('access_sessions')
      .update({ is_active: false })
      .in('id', ids);

    if (updateError) {
      console.error('Cleanup error:', updateError);
      return 0;
    }

    console.log(`Cleaned up ${expired.length} expired sessions from premium access`);
    return expired.length;
  } catch (error) {
    console.error('Cleanup error:', error);
    return 0;
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get premium session duration in minutes (from settings or default)
 */
export function getPremiumDurationMinutes(): number {
  const durationEnv = process.env.PREMIUM_DURATION_MINUTES;
  if (durationEnv) {
    const parsed = parseInt(durationEnv, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 60; // Default: 60 minutes
}

/**
 * Get premium price in TSH (from settings or default)
 */
export function getPremiumPrice(): number {
  const priceEnv = process.env.PREMIUM_PRICE;
  if (priceEnv) {
    const parsed = parseInt(priceEnv, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 1000; // Default: 1000 TSH
}

// ============================================================================
// COOKIES (Browser-side helpers)
// ============================================================================

/**
 * Set access token cookie (client-side)
 * Export for use in API responses
 */
export function getAccessCookieHeader(token: string): string {
  const duration = getPremiumDurationMinutes();
  const maxAge = duration * 60; // Convert to seconds
  return `access_token=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict`;
}

/**
 * Clear access token cookie (client-side)
 */
export function getClearCookieHeader(): string {
  return `access_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`;
}

/**
 * Extract session token from cookie header
 */
export function extractSessionTokenFromCookie(
  cookieHeader: string | undefined
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === 'access_token' && value) {
      return decodeURIComponent(value);
    }
  }

  return null;
}
