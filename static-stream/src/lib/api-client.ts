/**
 * Frontend API Client
 * Handles all communication with the backend API
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// HTTP HELPERS
// ============================================================================

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  const token = localStorage.getItem('admin_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add session cookie if available
  const sessionToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('access_token='))
    ?.split('=')[1];

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error [${response.status}]:`, data);
      return {
        success: false,
        error: data.error || {
          code: 'UNKNOWN_ERROR',
          message: 'An error occurred',
        },
      };
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred',
      },
    };
  }
}

// ============================================================================
// PUBLIC API - CATEGORIES
// ============================================================================

export const categories = {
  getAll: async () => {
    return apiCall('/api/public/categories');
  },

  getBySlug: async (slug: string) => {
    return apiCall(`/api/public/categories/${slug}`);
  },
};

// ============================================================================
// PUBLIC API - VIDEOS
// ============================================================================

export const videos = {
  getAll: async (page = 1, limit = 20) => {
    return apiCall(`/api/public/videos?page=${page}&limit=${limit}`);
  },

  getById: async (id: string) => {
    return apiCall(`/api/public/videos/${id}`);
  },

  getByCategory: async (categoryId: string, page = 1, limit = 20) => {
    return apiCall(
      `/api/public/videos/category/${categoryId}?page=${page}&limit=${limit}`
    );
  },
};

// ============================================================================
// PAYMENT API
// ============================================================================

export const payments = {
  /**
   * Initiate a payment for premium access (1000 TSH fixed)
   */
  create: async (phoneNumber: string, amountTsh: number = 1000) => {
    // Backend enforces 1000 TSH, but frontend should also respect this
    if (amountTsh !== 1000) {
      console.warn(`Payment amount ${amountTsh} TSH adjusted to 1000 TSH`);
    }

    return apiCall('/api/payment/create', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        amount_tsh: 1000, // Always 1000 TSH for premium
      }),
    });
  },

  /**
   * Verify payment status with backend (server-to-server verification)
   */
  verify: async (reference: string) => {
    return apiCall(`/api/payment/verify/${reference}`);
  },

  /**
   * Poll payment status with optimized exponential backoff
   * Uses intelligent retry strategy to minimize server load
   */
  pollUntilComplete: async (
    reference: string,
    options?: {
      maxAttempts?: number;
      initialDelayMs?: number;
      maxDelayMs?: number;
      onProgress?: (attempt: number) => void;
      onRetry?: (delayMs: number) => void;
    }
  ) => {
    const { verifyPayment } = await import('./payment-polling-client');
    
    const result = await verifyPayment(API_URL, reference, {
      maxAttempts: options?.maxAttempts,
      initialDelayMs: options?.initialDelayMs,
      maxDelayMs: options?.maxDelayMs,
      onProgress: options?.onProgress,
      onRetry: (_, delayMs) => options?.onRetry?.(delayMs),
    });

    // Convert to legacy response format for backward compatibility
    if (result.success) {
      return {
        success: true,
        data: {
          status: result.status || 'paid',
          access_token: result.accessToken,
          expires_at: result.expiresAt,
          minutes_remaining: result.minutesRemaining,
        },
      };
    }

    return {
      success: false,
      error: {
        code: result.status === 'failed' ? 'PAYMENT_FAILED' : 'PAYMENT_TIMEOUT',
        message: result.message,
      },
    };
  },
};

// ============================================================================
// ACCESS API
// ============================================================================

export const access = {
  getSession: async (userIdentifier: string) => {
    return apiCall('/api/access/get-session', {
      method: 'POST',
      body: JSON.stringify({
        user_identifier: userIdentifier,
      }),
    });
  },

  checkAccess: async (videoId: string) => {
    return apiCall('/api/access/check', {
      method: 'POST',
      body: JSON.stringify({
        video_id: videoId,
      }),
    });
  },

  /**
   * Verify a premium access session token
   * Validates 1-hour expiry and returns remaining time
   */
  verifyToken: async (sessionToken: string) => {
    return apiCall('/api/access/verify-token', {
      method: 'POST',
      body: JSON.stringify({
        session_token: sessionToken,
      }),
    });
  },

  verifySession: async () => {
    return apiCall('/api/access/verify', {
      method: 'POST',
    });
  },
};

// ============================================================================
// ADMIN API
// ============================================================================

export const admin = {
  login: async (email: string, password: string) => {
    const result = await apiCall('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    // Store token if successful
    if (result.success && result.data) {
      const token = (result.data as any).token;
      localStorage.setItem('admin_token', token);
    }

    return result;
  },

  logout: () => {
    localStorage.removeItem('admin_token');
  },

  categories: {
    getAll: async (page = 1, limit = 20) => {
      return apiCall(
        `/api/admin/categories?page=${page}&limit=${limit}`
      );
    },

    create: async (input: {
      name: string;
      slug: string;
      description?: string;
      is_premium?: boolean;
      sort_order?: number;
    }) => {
      return apiCall('/api/admin/categories/create', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    update: async (
      id: string,
      input: Partial<{
        name: string;
        slug: string;
        description: string;
        is_premium: boolean;
        sort_order: number;
      }>
    ) => {
      return apiCall(`/api/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },

    delete: async (id: string) => {
      return apiCall(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });
    },
  },

  videos: {
    getAll: async (page = 1, limit = 20) => {
      return apiCall(
        `/api/admin/videos?page=${page}&limit=${limit}`
      );
    },

    create: async (input: {
      category_id: string;
      title: string;
      description?: string;
      thumbnail_url?: string;
      video_url: string;
      is_premium?: boolean;
      sort_order?: number;
    }) => {
      return apiCall('/api/admin/videos/create', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    update: async (
      id: string,
      input: Partial<{
        category_id: string;
        title: string;
        description: string;
        thumbnail_url: string;
        video_url: string;
        duration_seconds: number;
        is_premium: boolean;
        sort_order: number;
      }>
    ) => {
      return apiCall(`/api/admin/videos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },

    delete: async (id: string) => {
      return apiCall(`/api/admin/videos/${id}`, {
        method: 'DELETE',
      });
    },
  },

  payments: {
    getAll: async (page = 1, limit = 20, status?: string) => {
      let url = `/api/admin/payments?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }
      return apiCall(url);
    },

    getByReference: async (reference: string) => {
      return apiCall(`/api/admin/payments/${reference}`);
    },
  },

  settings: {
    getAll: async () => {
      return apiCall('/api/admin/settings');
    },

    update: async (input: {
      premium_price?: number;
      premium_duration_minutes?: number;
    }) => {
      return apiCall('/api/admin/settings/update', {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },
  },

  stats: {
    getDashboard: async () => {
      return apiCall('/api/admin/stats');
    },
  },
};
