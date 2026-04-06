// Application configuration constants

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_VERSION = 'v1';
export const API_REQUEST_TIMEOUT_MS = 30000;
export const API_MAX_REQUEST_SIZE = '10mb';

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
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Payment errors
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  INVALID_PHONE: 'INVALID_PHONE',
  PAYMENT_INIT_FAILED: 'PAYMENT_INIT_FAILED',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_AMOUNT_INVALID: 'PAYMENT_AMOUNT_INVALID',

  // Access control errors
  PREMIUM_ACCESS_REQUIRED: 'PREMIUM_ACCESS_REQUIRED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Resource not found
  NOT_FOUND: 'NOT_FOUND',
  VIDEO_NOT_FOUND: 'VIDEO_NOT_FOUND',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  ADMIN_NOT_FOUND: 'ADMIN_NOT_FOUND',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // External service errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  FASTLIPA_ERROR: 'FASTLIPA_ERROR',

  // Generic errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

// ============================================================================
// PAYMENT CONFIGURATION
// ============================================================================

export const PAYMENT_CONFIG = {
  PROVIDER: 'fastlipa',
  MIN_AMOUNT_TSH: 100,
  MAX_AMOUNT_TSH: 5000000,
  POLL_INTERVAL_MS: 2000, // Check status every 2 seconds
  MAX_POLL_ATTEMPTS: 30, // Give up after 60 seconds
  TIMEOUT_MS: 60000,
} as const;

// ============================================================================
// PREMIUM CONFIGURATION
// ============================================================================

export const PREMIUM_CONFIG = {
  DEFAULT_PRICE_TSH: 1000,
  DEFAULT_DURATION_MINUTES: 60,
  SESSION_TOKEN_PREFIX: 'sess_',
  COOKIE_NAME: 'access_token',
  SESSION_TIMEOUT_MINUTES: 24 * 60, // 24 hours
} as const;

// ============================================================================
// DATABASE LIMITS
// ============================================================================

export const DB_LIMITS = {
  CATEGORY_NAME_MAX: 100,
  CATEGORY_SLUG_MAX: 100,
  CATEGORY_DESCRIPTION_MAX: 500,

  TITLE_MAX: 500,
  DESCRIPTION_MAX: 2000,
  URL_MAX: 2000,

  EMAIL_MAX: 255,
  PASSWORD_MIN: 8,

  PHONE_LENGTH: 12, // Normalized format: 25577xxxxxxxxx
  PAYMENT_REFERENCE_MAX: 100,

  PAGE_LIMIT_MIN: 1,
  PAGE_LIMIT_MAX: 100,
  PAGE_LIMIT_DEFAULT: 20,
} as const;

// ============================================================================
// TIMING CONFIGURATION
// ============================================================================

export const TIMINGS = {
  JWT_EXPIRATION_HOURS: 24,
  SESSION_EXPIRATION_MINUTES: 60,
  PAYMENT_POLL_INTERVAL_MS: 2000,
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100,
} as const;

// ============================================================================
// ENDPOINTS MAPPING
// ============================================================================

export const ENDPOINTS = {
  // Public endpoints
  'GET /api/v1/public/categories': 'Retrieve all categories',
  'GET /api/v1/public/categories/:id': 'Get category details',
  'GET /api/v1/public/videos': 'List videos (paginated)',
  'GET /api/v1/public/videos/:id': 'Get video details',
  'GET /api/v1/public/videos/category/:categoryId': 'Get category videos',

  // Payment endpoints
  'POST /api/v1/payment/create': 'Initiate payment',
  'GET /api/v1/payment/verify/:reference': 'Verify payment status',

  // Access control endpoints
  'POST /api/v1/access/get-session': 'Create access session',
  'POST /api/v1/access/check': 'Check video access',
  'POST /api/v1/access/verify': 'Verify premium session',

  // Admin endpoints
  'POST /api/v1/admin/login': 'Admin login',

  'GET /api/v1/admin/categories': 'List all categories',
  'POST /api/v1/admin/categories': 'Create category',
  'PUT /api/v1/admin/categories/:id': 'Update category',
  'DELETE /api/v1/admin/categories/:id': 'Delete category',

  'GET /api/v1/admin/videos': 'List all videos',
  'POST /api/v1/admin/videos': 'Create video',
  'PUT /api/v1/admin/videos/:id': 'Update video',
  'DELETE /api/v1/admin/videos/:id': 'Delete video',

  'GET /api/v1/admin/payments': 'List payments',
  'GET /api/v1/admin/payments/:reference': 'Get payment details',

  'GET /api/v1/admin/stats': 'Get dashboard statistics',
  'GET /api/v1/admin/settings': 'Get settings',
  'PUT /api/v1/admin/settings': 'Update settings',
} as const;

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

export const VALIDATION = {
  EMAIL_MIN_LENGTH: 5,
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,

  PHONE_REGEX: /^(\+?255|0)?[67]\d{8}$/,
  SLUG_REGEX: /^[a-z0-9-]+$/,

  URL_MAX_LENGTH: 2000,
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 500,
} as const;

// ============================================================================
// FEATURE FLAGS (Can be enabled/disabled via settings)
// ============================================================================

export const FEATURES = {
  ENABLE_PREMIUM_VIDEOS: true,
  ENABLE_CATEGORY_SORTING: true,
  ENABLE_VIDEO_SORTING: true,
  ENABLE_PAYMENT_VERIFICATION: true,
  ENABLE_SESSION_CLEANUP: true,
} as const;

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

/**
 * List of required environment variables
 * Should be checked during app startup
 */
export const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET',
  'FASTLIPA_API_URL',
  'FASTLIPA_API_KEY',
] as const;

/**
 * List of optional environment variables with defaults
 */
export const OPTIONAL_ENV_VARS = [
  'PORT', // Default: 3000
  'NODE_ENV', // Default: development
  'PREMIUM_PRICE', // Default: 1000
  'PREMIUM_DURATION_MINUTES', // Default: 60
  'LOG_LEVEL', // Default: info
] as const;
