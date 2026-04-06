// Custom error classes and utilities

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ============================================================================
// AUTHENTICATION ERRORS
// ============================================================================

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super(401, 'TOKEN_EXPIRED', 'Authentication token has expired');
  }
}

export class InvalidTokenError extends AppError {
  constructor() {
    super(401, 'INVALID_TOKEN', 'Invalid or malformed token');
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', public errors?: Record<string, string>) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class InvalidInputError extends AppError {
  constructor(message = 'Invalid input') {
    super(400, 'INVALID_INPUT', message);
  }
}

// ============================================================================
// PAYMENT ERRORS
// ============================================================================

export class PaymentError extends AppError {
  constructor(public errorCode: string, message: string) {
    super(400, errorCode, message);
  }
}

export class InvalidPhoneError extends AppError {
  constructor() {
    super(400, 'INVALID_PHONE_NUMBER', 'Phone number must be in format 07xxxxxxxxx');
  }
}

export class PaymentInitiationError extends AppError {
  constructor() {
    super(400, 'PAYMENT_INITIATION_FAILED', 'Failed to initiate payment');
  }
}

export class PaymentNotFoundError extends AppError {
  constructor() {
    super(404, 'PAYMENT_NOT_FOUND', 'Payment not found');
  }
}

export class PaymentPendingError extends AppError {
  constructor() {
    super(202, 'PAYMENT_PENDING', 'Payment is still pending. Please try again soon.');
  }
}

export class PaymentFailedError extends AppError {
  constructor(message = 'Payment was declined or cancelled') {
    super(400, 'PAYMENT_FAILED', message);
  }
}

// ============================================================================
// ACCESS CONTROL ERRORS
// ============================================================================

export class PremiumAccessRequiredError extends AppError {
  constructor() {
    super(403, 'PREMIUM_ACCESS_REQUIRED', 'Premium access is required to view this content');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, 'FORBIDDEN', message);
  }
}

// ============================================================================
// RESOURCE ERRORS
// ============================================================================

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class VideoNotFoundError extends AppError {
  constructor() {
    super(404, 'VIDEO_NOT_FOUND', 'Video not found');
  }
}

export class CategoryNotFoundError extends AppError {
  constructor() {
    super(404, 'CATEGORY_NOT_FOUND', 'Category not found');
  }
}

export class AdminNotFoundError extends AppError {
  constructor() {
    super(404, 'ADMIN_NOT_FOUND', 'Admin user not found');
  }
}

// ============================================================================
// CONFLICT ERRORS
// ============================================================================

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, 'CONFLICT', message);
  }
}

export class DuplicateError extends AppError {
  constructor(resource = 'Resource') {
    super(409, 'DUPLICATE', `${resource} already exists`);
  }
}

// ============================================================================
// SERVER ERRORS
// ============================================================================

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(500, 'INTERNAL_ERROR', message);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(500, 'DATABASE_ERROR', message);
  }
}

export class ExternalServiceError extends AppError {
  constructor(serviceName: string) {
    super(503, 'SERVICE_UNAVAILABLE', `${serviceName} service is temporarily unavailable`);
  }
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  status: number;
  errors?: Record<string, string>;
  timestamp: string;
}

export function createErrorResponse(error: AppError): ErrorResponse {
  return {
    success: false,
    error: error.errorCode,
    message: error.message,
    status: error.statusCode,
    ...(error instanceof ValidationError && error.errors
      ? { errors: error.errors }
      : {}),
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

export function logError(error: Error, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    console.error(
      JSON.stringify({
        timestamp,
        level: 'ERROR',
        code: error.errorCode,
        status: error.statusCode,
        message: error.message,
        ...context,
      })
    );
  } else {
    console.error(
      JSON.stringify({
        timestamp,
        level: 'ERROR',
        message: error.message,
        stack: error.stack,
        ...context,
      })
    );
  }
}
