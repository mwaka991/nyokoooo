// Premium access control - session management and verification

import crypto from 'crypto';
import { supabase, getVideoById, getCategoryBySlug } from './db';

// ============================================================================
// SESSION TOKEN GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure session token
 * Format: sess_<32_random_hex_chars>
 */
export function generateSessionToken(): string {
  const bytes = crypto.randomBytes(32);
  return 'sess_' + bytes.toString('hex');
}

// ============================================================================
// ACCESS VERIFICATION
// ============================================================================

export interface AccessCheckResult {
  has_access: boolean;
  expires_at: string | null;
  time_remaining_minutes: number | null;
}

/**
 * Check if a session token is valid and not expired
 */
export async function checkAccessSession(
  sessionToken: string | null
): Promise<AccessCheckResult> {
  if (!sessionToken || typeof sessionToken !== 'string') {
    return {
      has_access: false,
      expires_at: null,
      time_remaining_minutes: null,
    };
  }

  try {
    const { data, error } = await supabase
      .from('access_sessions')
      .select('id, expires_at')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return {
        has_access: false,
        expires_at: null,
        time_remaining_minutes: null,
      };
    }

    // Update last accessed timestamp
    updateAccessSessionActivity(data.id).catch(console.error);

    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    const remainingMs = expiresAt.getTime() - now.getTime();
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    return {
      has_access: true,
      expires_at: data.expires_at,
      time_remaining_minutes: Math.max(0, remainingMinutes),
    };
  } catch (error) {
    console.error('Error checking access session:', error);
    return {
      has_access: false,
      expires_at: null,
      time_remaining_minutes: null,
    };
  }
}

/**
 * Check if a video is accessible (considering category premium status)
 */
export async function canAccessVideo(
  videoId: string,
  sessionToken: string | null
): Promise<{
  can_access: boolean;
  is_premium: boolean;
  reason?: string;
}> {
  try {
    const video = await getVideoById(videoId);

    if (!video) {
      return {
        can_access: false,
        is_premium: false,
        reason: 'VIDEO_NOT_FOUND',
      };
    }

    // Check if video's category is premium
    const isPremium = video.categories?.is_premium || false;

    if (!isPremium) {
      // Public content - always accessible
      return {
        can_access: true,
        is_premium: false,
      };
    }

    // Premium content - check session
    const { has_access } = await checkAccessSession(sessionToken);

    if (!has_access) {
      return {
        can_access: false,
        is_premium: true,
        reason: 'PREMIUM_ACCESS_REQUIRED',
      };
    }

    return {
      can_access: true,
      is_premium: true,
    };
  } catch (error) {
    console.error('Error checking video access:', error);
    return {
      can_access: false,
      is_premium: false,
      reason: 'ERROR',
    };
  }
}

/**
 * Check if a category is premium
 */
export async function isCategoryPremium(categorySlug: string): Promise<boolean> {
  try {
    const category = await getCategoryBySlug(categorySlug);
    return category?.is_premium || false;
  } catch (error) {
    console.error('Error checking category premium status:', error);
    return false;
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create a new premium access session
 */
export async function createPremiumSession(
  paymentId: string,
  durationMinutes: number
): Promise<{ session_token: string; expires_at: string } | null> {
  try {
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    const { data, error } = await supabase
      .from('access_sessions')
      .insert({
        payment_id: paymentId,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select('session_token, expires_at')
      .single();

    if (error) {
      console.error('Error creating access session:', error);
      return null;
    }

    return {
      session_token: data.session_token,
      expires_at: data.expires_at,
    };
  } catch (error) {
    console.error('Error creating premium session:', error);
    return null;
  }
}

/**
 * Update the last accessed timestamp for a session
 */
async function updateAccessSessionActivity(sessionId: string): Promise<void> {
  try {
    await supabase
      .from('access_sessions')
      .update({
        accessed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
  } catch (error) {
    console.error('Error updating session activity:', error);
  }
}

/**
 * Invalidate a session (logout)
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
  try {
    await supabase
      .from('access_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken);
  } catch (error) {
    console.error('Error invalidating session:', error);
  }
}

// ============================================================================
// SESSION CLEANUP (Background Task)
// ============================================================================

/**
 * Cleanup expired sessions
 * Should be run periodically (e.g., every 5-10 minutes)
 */
export async function cleanupExpiredSessions(): Promise<{ cleaned: number }> {
  try {
    const { error, count } = await supabase
      .from('access_sessions')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true);

    if (error) {
      console.error('Error cleaning up expired sessions:', error);
      return { cleaned: 0 };
    }

    return { cleaned: count || 0 };
  } catch (error) {
    console.error('Error in cleanup task:', error);
    return { cleaned: 0 };
  }
}

/**
 * Get environment variable as number
 * Used for premium access duration
 */
export async function getPremiumDurationMinutes(): Promise<number> {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'PREMIUM_DURATION_MINUTES')
      .single();

    return parseInt(data?.value || '60', 10);
  } catch (error) {
    console.error('Error getting premium duration:', error);
    return 60; // Default 60 minutes
  }
}

/**
 * Get premium price in TSH
 */
export async function getPremiumPrice(): Promise<number> {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'PREMIUM_PRICE_TSH')
      .single();

    return parseInt(data?.value || '1000', 10);
  } catch (error) {
    console.error('Error getting premium price:', error);
    return 1000; // Default 1000 TSH
  }
}

// ============================================================================
// COOKIE HELPERS
// ============================================================================

/**
 * Set premium access cookie
 */
export function setAccessCookie(
  sessionToken: string,
  durationMinutes: number
): string {
  return `access_token=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${durationMinutes * 60}; Path=/`;
}

/**
 * Clear premium access cookie
 */
export function clearAccessCookie(): string {
  return `access_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`;
}

/**
 * Extract session token from cookie string
 */
export function extractSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith('access_token=')) {
      return cookie.slice(13); // Remove "access_token=" prefix
    }
  }

  return null;
}
