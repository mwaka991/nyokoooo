// Constants and configuration

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API = {
  VERSION: 'v1',
  BASE_PATH: '/api',
  TIMEOUT_MS: 30000,
  MAX_REQUEST_SIZE: '10mb',
} as const;

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PHONE_NUMBER: 'INVALID_PHONE_NUMBER',

  // Payment
  PAYMENT_INITIATION_FAILED: 'PAYMENT_INITIATION_FAILED',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_FAILED: 'PAYMENT_FAILED',

  // Access
  PREMIUM_ACCESS_REQUIRED: 'PREMIUM_ACCESS_REQUIRED',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  VIDEO_NOT_FOUND: 'VIDEO_NOT_FOUND',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

// ============================================================================
// PAYMENT CONFIGURATION
// ============================================================================

export const PAYMENT = {
  PROVIDER: 'fastlipa' as const,
  MIN_AMOUNT: 100,
  MAX_AMOUNT: 5000000,
  DEFAULT_AMOUNT: 1000,
  CURRENCY: 'TSH',
  POLL_INTERVAL_MS: 2000,
  MAX_POLL_ATTEMPTS: 30,
  TIMEOUT_MINUTES: 60,
} as const;

// ============================================================================
// PREMIUM ACCESS CONFIGURATION
// ============================================================================

export const PREMIUM = {
  DEFAULT_DURATION_MINUTES: 60,
  SESSION_TOKEN_PREFIX: 'sess_',
  COOKIE_NAME: 'access_token',
  COOKIE_MAX_AGE_SECONDS: 60 * 60, // 1 hour
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
} as const;

// ============================================================================
// DATABASE LIMITS
// ============================================================================

export const DB_LIMITS = {
  PAGINATION_MIN: 1,
  PAGINATION_MAX: 100,
  PAGINATION_DEFAULT: 20,
  CATEGORIES_MAX: 50,
  VIDEOS_PER_CATEGORY_MAX: 1000,
  RETENTION_DAYS: 90,
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION = {
  EMAIL_MIN_LENGTH: 5,
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PHONE_LENGTH_MIN: 10,
  PHONE_LENGTH_MAX: 12,
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 500,
  DESCRIPTION_MAX_LENGTH: 2000,
  CATEGORY_NAME_MIN: 2,
  CATEGORY_NAME_MAX: 255,
  SLUG_MIN_LENGTH: 2,
  SLUG_MAX_LENGTH: 255,
  URL_MAX_LENGTH: 500,
} as const;

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

export const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'FASTLIPA_API_KEY',
  'FASTLIPA_API_URL',
  'JWT_SECRET',
] as const;

export const OPTIONAL_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'LOG_LEVEL',
  'CORS_ORIGIN',
] as const;

// ============================================================================
// LOGGING LEVELS
// ============================================================================

export const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

// ============================================================================
// ENDPOINTS
// ============================================================================

export const ENDPOINTS = {
  // Public
  PUBLIC: {
    CATEGORIES: '/api/public/categories',
    VIDEOS: '/api/public/videos',
    VIDEOS_BY_ID: (id: string) => `/api/public/videos/${id}`,
    VIDEOS_BY_CATEGORY: (slug: string) => `/api/public/videos/category/${slug}`,
    SETTINGS: '/api/public/settings',
  },
  // Payment
  PAYMENT: {
    CREATE: '/api/payment/create',
    VERIFY: '/api/payment/verify',
  },
  // Access
  ACCESS: {
    CHECK: '/api/access/check',
    SESSIONS: '/api/access/sessions',
  },
  // Admin
  ADMIN: {
    LOGIN: '/api/admin/login',
    LOGOUT: '/api/admin/logout',
    ME: '/api/admin/me',
    CATEGORIES: '/api/admin/categories',
    CATEGORIES_BY_ID: (id: string) => `/api/admin/categories/${id}`,
    VIDEOS: '/api/admin/videos',
    VIDEOS_BY_ID: (id: string) => `/api/admin/videos/${id}`,
  },
} as const;

// ============================================================================
// TIMINGS
// ============================================================================

export const TIMINGS = {
  JWT_EXPIRATION_HOURS: 24,
  SESSION_EXPIRATION_MINUTES: 60,
  PAYMENT_POLLING_INTERVAL_MS: 2000,
  PAYMENT_TIMEOUT_MINUTES: 10,
  SESSION_CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
  SESSION_CLEANUP_BATCH_SIZE: 100,
} as const;
