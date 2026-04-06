// Input validation schemas using Zod

import { z } from 'zod';

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

export const CreatePaymentSchema = z.object({
  phone_number: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^(\+?255|0)?[67]\d{8}$/,
      'Invalid phone number. Use format: 07xxxxxxxxx or +255...'
    ),
  amount_tsh: z
    .number()
    .int('Amount must be a whole number')
    .refine(
      (val) => val === 1000,
      'Premium access costs exactly 1000 TSH'
    ),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

export const VerifyPaymentSchema = z.object({
  reference: z
    .string()
    .min(1, 'Payment reference is required'),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

// ============================================================================
// CATEGORY SCHEMAS
// ============================================================================

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be 100 characters or less'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .max(100, 'Slug must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  is_premium: z
    .boolean()
    .default(false),
  sort_order: z
    .number()
    .int()
    .min(0, 'Sort order must be a positive number')
    .default(0),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

// ============================================================================
// VIDEO SCHEMAS
// ============================================================================

export const CreateVideoSchema = z.object({
  category_id: z
    .string()
    .min(1, 'Category ID is required'),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(500, 'Title must be 500 characters or less'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional(),
  thumbnail_url: z
    .string()
    .url('Invalid thumbnail URL')
    .optional(),
  video_url: z
    .string()
    .url('Invalid video URL'),
  is_premium: z
    .boolean()
    .default(false),
  sort_order: z
    .number()
    .int()
    .min(0, 'Sort order must be positive')
    .default(0),
});

export type CreateVideoInput = z.infer<typeof CreateVideoSchema>;

export const UpdateVideoSchema = CreateVideoSchema.partial();

export type UpdateVideoInput = z.infer<typeof UpdateVideoSchema>;

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

export const PaginationSchema = z.object({
  page: z
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(1)
    .transform((val) => (isNaN(val) ? 1 : val)),
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(150, 'Limit cannot exceed 150')
    .default(20)
    .transform((val) => (isNaN(val) ? 20 : val)),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse and validate input against a schema
 * Returns success result with data or error result with error details
 */
export function parseInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  // Format errors as Record<string, string>
  const errors: Record<string, string> = {};
  for (const error of result.error.errors) {
    const path = error.path.join('.');
    const message = error.message;
    errors[path] = message;
  }

  return {
    success: false,
    errors,
  };
}

/**
 * Validate a single field
 */
export function validateField(
  schema: z.ZodSchema,
  data: unknown
): { valid: true } | { valid: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { valid: true };
  }

  return {
    valid: false,
    error: result.error.errors[0]?.message || 'Validation failed',
  };
}
