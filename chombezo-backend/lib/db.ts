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
// ADMIN QUERIES
// ============================================================================

export async function getAdminByEmail(email: string) {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to fetch admin: ${error.message}`);
  }
  return data;
}

export async function updateAdminLastLogin(adminId: string) {
  const { error } = await supabase
    .from('admins')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', adminId);

  if (error) throw new Error(`Failed to update last login: ${error.message}`);
}

// ============================================================================
// CATEGORY QUERIES
// ============================================================================

export async function getCategoriesPublic(includePremium = true) {
  let query = supabase
    .from('categories')
    .select('id, name, slug, is_premium, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (!includePremium) {
    query = query.eq('is_premium', false);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
  return data;
}

export async function getCategoriesAdmin(limit = 20, offset = 0) {
  const { data, error, count } = await supabase
    .from('categories')
    .select('id, name, slug, is_premium, is_active, sort_order, created_at', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
  return { categories: data || [], total: count || 0 };
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

export async function getCategoryById(id: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
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

export async function getVideosPublic(limit = 20, offset = 0) {
  let query = supabase
    .from('videos')
    .select('id, title, description, category_id, thumbnail_url, video_url, is_active, sort_order, created_at, categories(id, name, slug, is_premium)', { count: 'exact' })
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to fetch videos: ${error.message}`);

  return { videos: data || [], total: count || 0 };
}

export async function getVideosAdmin(limit = 50, offset = 0) {
  const { data, error, count } = await supabase
    .from('videos')
    .select('id, title, description, category_id, thumbnail_url, video_url, is_active, sort_order, created_at', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch videos: ${error.message}`);
  return { videos: data || [], total: count || 0 };
}

export async function getVideoById(id: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('id, title, description, category_id, thumbnail_url, video_url, is_active, sort_order, created_at, categories(id, name, slug, is_premium)')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function getVideosByCategory(categoryId: string, limit = 20, offset = 0) {
  const { data, error, count } = await supabase
    .from('videos')
    .select('id, title, description, category_id, thumbnail_url, video_url, is_active, sort_order, created_at, categories(id, name, slug, is_premium)', { count: 'exact' })
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch videos: ${error.message}`);
  return { videos: data || [], total: count || 0 };
}

export async function createVideo(input: {
  category_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string;
  duration_seconds?: number | null;
  is_premium?: boolean;
  is_active?: boolean;
  sort_order: number;
}) {
  const { data, error } = await supabase
    .from('videos')
    .insert({
      category_id: input.category_id,
      title: input.title,
      description: input.description,
      thumbnail_url: input.thumbnail_url,
      video_url: input.video_url,
      duration_seconds: input.duration_seconds || null,
      is_premium: input.is_premium || false,
      is_active: input.is_active !== false,
      sort_order: input.sort_order,
    })
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

export async function createAccessSession(input: {
  payment_id: string;
  session_token: string;
  phone_number: string;
  access_start_time: string;
  access_expiry_time: string;
}) {
  const { data, error } = await supabase
    .from('access_sessions')
    .insert({
      payment_id: input.payment_id,
      session_token: input.session_token,
      phone_number: input.phone_number,
      access_start_time: input.access_start_time,
      access_expiry_time: input.access_expiry_time,
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
    .gt('access_expiry_time', new Date().toISOString())
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

export async function updateSetting(key: string, value: string) {
  const { data, error } = await supabase
    .from('settings')
    .upsert({ key, value })
    .select()
    .single();

  if (error) throw new Error(`Failed to update setting: ${error.message}`);
  return data;
}

export async function getAllPayments(limit = 50, offset = 0, status?: string) {
  let query = supabase
    .from('payments')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch payments: ${error.message}`);

  return {
    payments: data || [],
    total: count || 0,
  };
}

export async function countVideos() {
  const { count, error } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true });

  if (error) throw new Error(`Failed to count videos: ${error.message}`);
  return count || 0;
}

export async function countCategories() {
  const { count, error } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true });

  if (error) throw new Error(`Failed to count categories: ${error.message}`);
  return count || 0;
}

export async function countPayments(status?: string) {
  let query = supabase.from('payments').select('*', { count: 'exact', head: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { count, error } = await query;

  if (error) throw new Error(`Failed to count payments: ${error.message}`);
  return count || 0;
}

export async function countAccessSessions() {
  const { count, error } = await supabase
    .from('access_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) throw new Error(`Failed to count sessions: ${error.message}`);
  return count || 0;
}
