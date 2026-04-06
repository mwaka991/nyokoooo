// Error handling and custom error classes

import { HTTP_STATUS, ERROR_CODES } from './constants';

// ============================================================================
// BASE ERROR CLASS
// ============================================================================

export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(
    statusCode: number,
    errorCode: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
    };
  }
}

// ============================================================================
// AUTHENTICATION ERRORS
// ============================================================================

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED, message);
    this.name = 'UnauthorizedError';
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid email or password') {
    super(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_CREDENTIALS,
      message
    );
    this.name = 'InvalidCredentialsError';
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired') {
    super(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_EXPIRED, message);
    this.name = 'TokenExpiredError';
  }
}

export class TokenInvalidError extends AppError {
  constructor(message: string = 'Invalid token') {
    super(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_INVALID, message);
    this.name = 'TokenInvalidError';
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export class ValidationError extends AppError {
  public details?: Record<string, string>;

  constructor(message: string = 'Validation failed', details?: Record<string, string>) {
    super(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, message);
    this.name = 'ValidationError';
    this.details = details;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.details,
    };
  }
}

// ============================================================================
// PAYMENT ERRORS
// ============================================================================

export class PaymentError extends AppError {
  constructor(message: string = 'Payment processing error') {
    super(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_ERROR, message);
    this.name = 'PaymentError';
  }
}

export class InvalidPhoneError extends AppError {
  constructor(message: string = 'Invalid phone number format') {
    super(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_PHONE, message);
    this.name = 'InvalidPhoneError';
  }
}

export class PaymentInitiationError extends AppError {
  constructor(message: string = 'Could not initiate payment') {
    super(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_INIT_FAILED, message);
    this.name = 'PaymentInitiationError';
  }
}

export class PaymentNotFoundError extends AppError {
  constructor(message: string = 'Payment not found') {
    super(HTTP_STATUS.NOT_FOUND, ERROR_CODES.PAYMENT_NOT_FOUND, message);
    this.name = 'PaymentNotFoundError';
  }
}

export class PaymentPendingError extends AppError {
  constructor(message: string = 'Payment is still pending') {
    super(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_PENDING, message);
    this.name = 'PaymentPendingError';
  }
}

export class PaymentFailedError extends AppError {
  constructor(message: string = 'Payment failed') {
    super(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.PAYMENT_FAILED, message);
    this.name = 'PaymentFailedError';
  }
}

// ============================================================================
// ACCESS CONTROL ERRORS
// ============================================================================

export class PremiumAccessRequiredError extends AppError {
  constructor(message: string = 'Premium access required') {
    super(
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.PREMIUM_ACCESS_REQUIRED,
      message
    );
    this.name = 'PremiumAccessRequiredError';
  }
}

export class SessionExpiredError extends AppError {
  constructor(message: string = 'Access session has expired') {
    super(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.SESSION_EXPIRED,
      message
    );
    this.name = 'SessionExpiredError';
  }
}

// ============================================================================
// RESOURCE NOT FOUND ERRORS
// ============================================================================

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      `${resource} not found`
    );
    this.name = 'NotFoundError';
  }
}

export class VideoNotFoundError extends AppError {
  constructor(message: string = 'Video not found') {
    super(HTTP_STATUS.NOT_FOUND, ERROR_CODES.VIDEO_NOT_FOUND, message);
    this.name = 'VideoNotFoundError';
  }
}

export class CategoryNotFoundError extends AppError {
  constructor(message: string = 'Category not found') {
    super(HTTP_STATUS.NOT_FOUND, ERROR_CODES.CATEGORY_NOT_FOUND, message);
    this.name = 'CategoryNotFoundError';
  }
}

export class AdminNotFoundError extends AppError {
  constructor(message: string = 'Admin not found') {
    super(HTTP_STATUS.NOT_FOUND, ERROR_CODES.ADMIN_NOT_FOUND, message);
    this.name = 'AdminNotFoundError';
  }
}

// ============================================================================
// DATABASE ERRORS
// ============================================================================

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(
      HTTP_STATUS.INTERNAL_ERROR,
      ERROR_CODES.DATABASE_ERROR,
      message
    );
    this.name = 'DatabaseError';
  }
}

// ============================================================================
// EXTERNAL SERVICE ERRORS
// ============================================================================

export class ExternalServiceError extends AppError {
  constructor(service: string = 'External service') {
    super(
      HTTP_STATUS.INTERNAL_ERROR,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      `${service} is temporarily unavailable`
    );
    this.name = 'ExternalServiceError';
  }
}

// ============================================================================
// ERROR RESPONSE
// ============================================================================

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  status: number;
  timestamp: string;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: unknown): ErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.errorCode,
        message: error.message,
        details: (error as any).details,
      },
      status: error.statusCode,
      timestamp,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: error.message || 'An unexpected error occurred',
      },
      status: HTTP_STATUS.INTERNAL_ERROR,
      timestamp,
    };
  }

  return {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
    },
    status: HTTP_STATUS.INTERNAL_ERROR,
    timestamp,
  };
}

// ============================================================================
// LOGGING
// ============================================================================

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  code?: string;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Structured error logging
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const logEntry: LogEntry = {
    timestamp,
    level: 'error',
    message: context || 'Error occurred',
  };

  if (error instanceof AppError) {
    logEntry.code = error.errorCode;
    logEntry.message = error.message;
  } else if (error instanceof Error) {
    logEntry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else {
    logEntry.message = String(error);
  }

  console.error(JSON.stringify(logEntry));
}

/**
 * Structured info logging
 */
export function logInfo(message: string, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  const logEntry: any = {
    timestamp,
    level: 'info',
    message,
    ...context,
  };

  console.log(JSON.stringify(logEntry));
}
