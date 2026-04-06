// Production-ready Supabase client initialization

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// CATEGORY QUERIES
// ============================================================================

export async function getCategoriesPublic(includePremium = false) {
  let query = supabase
    .from('categories')
    .select('id, name, slug, description, is_premium, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (!includePremium) {
    query = query.eq('is_premium', false);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
  return data;
}

export async function getCategoriesAdmin() {
  const { data, error } = await supabase
    .from('categories')
    .select('*, (SELECT COUNT(*) FROM videos WHERE category_id = id)::int as video_count')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
  return data;
}

export async function getCategoryBySlug(slug: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data;
}

export async function createCategory(input: {
  name: string;
  slug: string;
  description: string | null;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
}) {
  const { data, error } = await supabase
    .from('categories')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create category: ${error.message}`);
  return data;
}

export async function updateCategory(
  id: string,
  input: Partial<Omit<any, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('categories')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update category: ${error.message}`);
  return data;
}

export async function deleteCategory(id: string, hardDelete = false) {
  if (hardDelete) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete category: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to deactivate category: ${error.message}`);
  }
}

// ============================================================================
// VIDEO QUERIES
// ============================================================================

export async function getVideosPublic(options?: {
  category_slug?: string;
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'oldest' | 'trending';
}) {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

  let query = supabase
    .from('videos')
    .select('*, categories(id, name, is_premium)', { count: 'exact' })
    .eq('is_active', true);

  if (options?.category_slug) {
    query = query.eq('categories.slug', options.category_slug);
  }

  // In production, you'd track views and use that for trending
  const orderBy = options?.sort === 'oldest' ? 'created_at' : 'created_at';
  query = query.order(orderBy, { ascending: options?.sort === 'oldest' });

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to fetch videos: ${error.message}`);

  return { data, count, limit, offset };
}

export async function getVideosAdmin(options?: { limit?: number; offset?: number }) {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const { data, error, count } = await supabase
    .from('videos')
    .select('*, categories(name)', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch videos: ${error.message}`);
  return { data, count, limit, offset };
}

export async function getVideoById(id: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('*, categories(id, name, is_premium)')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function getVideosByCategory(slug: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('*, categories(id, name, is_premium)')
    .eq('categories.slug', slug)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch videos: ${error.message}`);
  return data;
}

export async function createVideo(input: {
  category_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string;
  video_url: string;
  is_active: boolean;
  sort_order: number;
}) {
  const { data, error } = await supabase
    .from('videos')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create video: ${error.message}`);
  return data;
}

export async function updateVideo(
  id: string,
  input: Partial<Omit<any, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('videos')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update video: ${error.message}`);
  return data;
}

export async function deleteVideo(id: string, hardDelete = false) {
  if (hardDelete) {
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete video: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('videos')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to deactivate video: ${error.message}`);
  }
}

// ============================================================================
// PAYMENT QUERIES
// ============================================================================

export async function createPayment(input: {
  provider: string;
  provider_reference: string;
  amount_tsh: number;
  phone_number: string;
  status?: string;
  metadata?: Record<string, any>;
}) {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      provider: input.provider || 'fastlipa',
      provider_reference: input.provider_reference,
      amount_tsh: input.amount_tsh,
      phone_number: input.phone_number,
      status: input.status || 'pending',
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create payment: ${error.message}`);
  return data;
}

export async function getPaymentById(id: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function getPaymentByReference(reference: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('provider_reference', reference)
    .single();

  if (error) return null;
  return data;
}

export async function updatePaymentStatus(
  id: string,
  status: string,
  verified_at?: boolean
) {
  const update: any = {
    status: status,
    updated_at: new Date().toISOString(),
  };

  if (verified_at) {
    update.verified_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('payments')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update payment: ${error.message}`);
  return data;
}

// ============================================================================
// ACCESS SESSION QUERIES
// ============================================================================

export async function createAccessSession(
  payment_id: string,
  session_token: string,
  expires_at: string
) {
  const { data, error } = await supabase
    .from('access_sessions')
    .insert({
      payment_id: payment_id,
      session_token: session_token,
      expires_at: expires_at,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create access session: ${error.message}`);
  return data;
}

export async function getAccessSession(token: string) {
  const { data, error } = await supabase
    .from('access_sessions')
    .select('*')
    .eq('session_token', token)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) return null;
  return data;
}

export async function updateAccessSessionLastAccessed(sessionId: string) {
  const { error } = await supabase
    .from('access_sessions')
    .update({
      accessed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) throw new Error(`Failed to update session: ${error.message}`);
}

// ============================================================================
// ADMIN QUERIES
// ============================================================================

export async function getAdminByEmail(email: string) {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (error) return null;
  return data;
}

// ============================================================================
// SETTINGS QUERIES
// ============================================================================

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error) return null;
  return data?.value || null;
}

export async function getAllSettings() {
  const { data, error } = await supabase.from('settings').select('*');

  if (error) throw new Error(`Failed to fetch settings: ${error.message}`);

  const settings: Record<string, string> = {};
  data?.forEach((setting: any) => {
    settings[setting.key] = setting.value;
  });

  return settings;
}
