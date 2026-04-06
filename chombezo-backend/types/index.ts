// Database Types
export interface Admin {
  id: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  video_count?: number;
}

export interface Video {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string;
  video_url: string;
  is_active: boolean;
  sort_order: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface Payment {
  id: string;
  provider: string;
  provider_reference: string;
  amount_tsh: number;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';
  phone_number: string;
  paid_at: string | null;
  verified_at: string | null;
  expires_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface AccessSession {
  id: string;
  payment_id: string;
  session_token: string;
  phone_number: string;
  access_start_time: string;
  access_expiry_time: string;
  is_active: boolean;
  last_accessed: string | null;
  created_at: string;
  updated_at: string;
  payments?: Payment;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

// API Request/Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  type: 'admin';
  iat: number;
  exp: number;
}

export interface AdminSession {
  id: string;
  email: string;
}

export interface CreatePaymentRequest {
  phone_number: string;
  amount_tsh: number;
}

export interface VerifyPaymentRequest {
  payment_id: string;
  provider_reference: string;
}

export interface AccessCheckResponse {
  has_premium_access: boolean;
  expires_at: string | null;
  time_remaining_minutes: number | null;
}

export interface FastLipaResponse {
  success: boolean;
  reference?: string;
  status?: string;
  message?: string;
}
