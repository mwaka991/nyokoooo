/**
 * Frontend API Client
 * 
 * This file should be copied to: frontend/src/lib/api-client.ts
 * Provides type-safe API calls from frontend to backend
 * 
 * Usage:
 * import { apiClient } from '@/lib/api-client';
 * 
 * const categories = await apiClient.categories.getAll();
 * const payment = await apiClient.payment.create({ phone: '0712345678', amount: 1000 });
 */

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  status?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
}

interface Video {
  id: string;
  category_id: string;
  title: string;
  description?: string;
  thumbnail_url: string;
  video_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface Payment {
  id: string;
  amount_tsh: number;
  phone_number: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  created_at: string;
  paid_at?: string;
  provider_reference?: string;
}

interface AccessCheckResponse {
  has_access: boolean;
  premium_until?: string;
  category_access: Record<string, boolean>;
}

interface AdminLoginResponse {
  token: string;
  admin_id: string;
  email: string;
  expires_at: string;
}

// Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const TIMEOUT_MS = 30000;

// Utility: Fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: 'include', // Include cookies (for session token)
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// Utility: Handle error responses
function handleError(error: unknown): Error {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return new Error('Network error - backend unavailable');
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('Unknown error occurred');
}

/**
 * PUBLIC API - Categories
 */
const categoriesApi = {
  /**
   * Get all categories
   * @param includePremium - Include premium categories (default: true)
   */
  getAll: async (includePremium = true): Promise<ApiResponse<{ categories: Category[] }>> => {
    try {
      const url = new URL(`${API_URL}/api/public/categories`);
      url.searchParams.set('includePremium', String(includePremium));

      const response = await fetchWithTimeout(url.toString());
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Get category by slug
   */
  getBySlug: async (slug: string): Promise<ApiResponse<{ category: Category }>> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/public/categories/${slug}`);
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },
};

/**
 * PUBLIC API - Videos
 */
const videosApi = {
  /**
   * Get all videos with pagination
   */
  getAll: async (limit = 20, offset = 0): Promise<ApiResponse<{ videos: Video[]; total: number }>> => {
    try {
      const url = new URL(`${API_URL}/api/public/videos`);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset));

      const response = await fetchWithTimeout(url.toString());
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Get single video by ID
   */
  getById: async (videoId: string): Promise<ApiResponse<{ video: Video }>> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/public/videos/${videoId}`);
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Get videos by category slug
   */
  getByCategory: async (categorySlug: string, limit = 20, offset = 0) => {
    try {
      const url = new URL(`${API_URL}/api/public/videos/category/${categorySlug}`);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset));

      const response = await fetchWithTimeout(url.toString());
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Search videos
   */
  search: async (query: string, limit = 20, offset = 0) => {
    try {
      const url = new URL(`${API_URL}/api/public/videos/search`);
      url.searchParams.set('q', query);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset));

      const response = await fetchWithTimeout(url.toString());
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },
};

/**
 * PAYMENT API
 */
const paymentApi = {
  /**
   * Create a new payment and initiate FastLipa request
   */
  create: async (params: {
    phone_number: string;
    amount_tsh: number;
  }): Promise<ApiResponse<{ payment: Payment; polling_url: string }>> => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/api/payment/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Verify payment status with backend (server-to-server verification)
   */
  verify: async (params: {
    payment_id: string;
    provider_reference: string;
  }): Promise<ApiResponse<{ payment: Payment; access_granted: boolean }>> => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/api/payment/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Get payment status by ID
   */
  getStatus: async (paymentId: string): Promise<ApiResponse<{ payment: Payment }>> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/payment/${paymentId}`);
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },
};

/**
 * ACCESS API
 */
const accessApi = {
  /**
   * Check current user's access level
   */
  checkStatus: async (): Promise<ApiResponse<AccessCheckResponse>> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/access/check`);
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Check if user can access specific video
   */
  canAccessVideo: async (videoId: string): Promise<ApiResponse<{ can_access: boolean; reason?: string }>> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/access/check?video_id=${videoId}`);
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Get premium pricing information
   */
  getPricing: async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/access/pricing`);
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Logout/invalidate current session
   */
  logout: async (): Promise<ApiResponse<null>> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/access/logout`, {
        method: 'POST',
      });
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },
};

/**
 * ADMIN API
 */
const adminApi = {
  /**
   * Admin login
   */
  login: async (params: { email: string; password: string }): Promise<ApiResponse<AdminLoginResponse>> => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/api/admin/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Get all categories (admin view)
   */
  getCategories: async (token: string): Promise<ApiResponse<{ categories: Category[] }>> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/admin/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Create category
   */
  createCategory: async (
    token: string,
    params: Partial<Category>
  ): Promise<ApiResponse<{ category: Category }>> => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/api/admin/categories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(params),
        }
      );
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Update category
   */
  updateCategory: async (
    token: string,
    categoryId: string,
    params: Partial<Category>
  ): Promise<ApiResponse<{ category: Category }>> => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/api/admin/categories/${categoryId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(params),
        }
      );
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Get all videos (admin view)
   */
  getVideos: async (token: string, limit = 20, offset = 0): Promise<ApiResponse<{ videos: Video[] }>> => {
    try {
      const url = new URL(`${API_URL}/api/admin/videos`);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset));

      const response = await fetchWithTimeout(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Create video
   */
  createVideo: async (
    token: string,
    params: Partial<Video>
  ): Promise<ApiResponse<{ video: Video }>> => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/api/admin/videos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(params),
        }
      );
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },

  /**
   * Update video
   */
  updateVideo: async (
    token: string,
    videoId: string,
    params: Partial<Video>
  ): Promise<ApiResponse<{ video: Video }>> => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/api/admin/videos/${videoId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(params),
        }
      );
      return response.json();
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: handleError(error).message,
        },
      };
    }
  },
};

/**
 * Main API Client Export
 */
export const apiClient = {
  categories: categoriesApi,
  videos: videosApi,
  payment: paymentApi,
  access: accessApi,
  admin: adminApi,
};

// Export types
export type {
  ApiResponse,
  Category,
  Video,
  Payment,
  AccessCheckResponse,
  AdminLoginResponse,
};
