// Input validation schemas using Zod

import { z } from 'zod';

// ============================================================================
// ADMIN AUTHENTICATION
// ============================================================================

export const LoginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(5)
    .max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ============================================================================
// PAYMENT CREATION
// ============================================================================

export const CreatePaymentSchema = z.object({
  phone_number: z
    .string()
    .regex(/^07\d{8}$|^25577\d{8}$|^25576\d{8}$|^25575\d{8}$/, 
      'Invalid phone format. Use 07xxxxxxxxx or +255...'),
  amount_tsh: z
    .number()
    .int()
    .min(100, 'Minimum amount is 100 TSH')
    .max(5000000, 'Maximum amount is 5,000,000 TSH'),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

// ============================================================================
// PAYMENT VERIFICATION
// ============================================================================

export const VerifyPaymentSchema = z.object({
  payment_id: z
    .string()
    .uuid('Invalid payment ID'),
  provider_reference: z
    .string()
    .min(5, 'Invalid provider reference'),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

// ============================================================================
// CATEGORY MANAGEMENT
// ============================================================================

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(255),
  slug: z
    .string()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .min(2)
    .max(255),
  description: z
    .string()
    .max(1000)
    .optional()
    .nullable(),
  is_premium: z
    .boolean()
    .default(false),
  is_active: z
    .boolean()
    .default(true),
  sort_order: z
    .number()
    .int()
    .min(0)
    .default(0),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

// ============================================================================
// VIDEO MANAGEMENT
// ============================================================================

export const CreateVideoSchema = z.object({
  category_id: z
    .string()
    .uuid('Invalid category ID'),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(500),
  description: z
    .string()
    .max(2000)
    .optional()
    .nullable(),
  thumbnail_url: z
    .string()
    .url('Invalid thumbnail URL'),
  video_url: z
    .string()
    .url('Invalid video URL'),
  is_active: z
    .boolean()
    .default(true),
  sort_order: z
    .number()
    .int()
    .min(0)
    .default(0),
});

export type CreateVideoInput = z.infer<typeof CreateVideoSchema>;

export const UpdateVideoSchema = CreateVideoSchema.partial();

export type UpdateVideoInput = z.infer<typeof UpdateVideoSchema>;

// ============================================================================
// PAGINATION
// ============================================================================

export const PaginationSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Safe parse with error handling
 */
export function parseInput<T>(schema: z.ZodSchema, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
    return { success: false, errors };
  }

  return { success: true, data: result.data as T };
}
