import { Alert } from 'react-native';
import { FirebaseError } from 'firebase/app';

export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  shouldRetry: boolean;
  retryDelay?: number;
}

export class ErrorHandlingService {
  private static errorLog: Array<{ timestamp: Date; error: ErrorInfo; context?: string }> = [];
  private static maxLogSize = 100;

  // Firebase Auth Error Mapping
  private static authErrorMap: Record<string, ErrorInfo> = {
    'auth/invalid-credential': {
      code: 'auth/invalid-credential',
      message: 'Invalid credentials provided',
      userMessage: 'Invalid email or password. Please check your credentials and try again.',
      severity: 'medium',
      shouldRetry: true,
    },
    'auth/user-not-found': {
      code: 'auth/user-not-found',
      message: 'User not found',
      userMessage: 'No account found with this email address.',
      severity: 'medium',
      shouldRetry: false,
    },
    'auth/wrong-password': {
      code: 'auth/wrong-password',
      message: 'Wrong password',
      userMessage: 'Incorrect password. Please try again.',
      severity: 'medium',
      shouldRetry: true,
    },
    'auth/email-already-in-use': {
      code: 'auth/email-already-in-use',
      message: 'Email already in use',
      userMessage: 'An account with this email already exists. Please use a different email or try logging in.',
      severity: 'medium',
      shouldRetry: false,
    },
    'auth/weak-password': {
      code: 'auth/weak-password',
      message: 'Weak password',
      userMessage: 'Password should be at least 6 characters long.',
      severity: 'medium',
      shouldRetry: true,
    },
    'auth/invalid-email': {
      code: 'auth/invalid-email',
      message: 'Invalid email',
      userMessage: 'Please enter a valid email address.',
      severity: 'medium',
      shouldRetry: true,
    },
    'auth/user-disabled': {
      code: 'auth/user-disabled',
      message: 'User account disabled',
      userMessage: 'This account has been disabled. Please contact support.',
      severity: 'high',
      shouldRetry: false,
    },
    'auth/too-many-requests': {
      code: 'auth/too-many-requests',
      message: 'Too many failed attempts',
      userMessage: 'Too many failed login attempts. Please try again later or reset your password.',
      severity: 'high',
      shouldRetry: true,
      retryDelay: 300000, // 5 minutes
    },
    'auth/network-request-failed': {
      code: 'auth/network-request-failed',
      message: 'Network request failed',
      userMessage: 'Network error. Please check your internet connection and try again.',
      severity: 'high',
      shouldRetry: true,
      retryDelay: 5000,
    },
    'auth/requires-recent-login': {
      code: 'auth/requires-recent-login',
      message: 'Requires recent login',
      userMessage: 'This operation requires recent authentication. Please log in again.',
      severity: 'medium',
      shouldRetry: true,
    },
    'auth/operation-not-allowed': {
      code: 'auth/operation-not-allowed',
      message: 'Operation not allowed',
      userMessage: 'This sign-in method is not enabled. Please contact support.',
      severity: 'high',
      shouldRetry: false,
    },
  };

  // Firestore Error Mapping
  private static firestoreErrorMap: Record<string, ErrorInfo> = {
    'permission-denied': {
      code: 'permission-denied',
      message: 'Permission denied',
      userMessage: 'You don\'t have permission to access this data. Please log in again.',
      severity: 'high',
      shouldRetry: false,
    },
    'unavailable': {
      code: 'unavailable',
      message: 'Service unavailable',
      userMessage: 'Service temporarily unavailable. Please try again in a moment.',
      severity: 'high',
      shouldRetry: true,
      retryDelay: 10000,
    },
    'deadline-exceeded': {
      code: 'deadline-exceeded',
      message: 'Request timeout',
      userMessage: 'Request timed out. Please check your connection and try again.',
      severity: 'medium',
      shouldRetry: true,
      retryDelay: 5000,
    },
    'resource-exhausted': {
      code: 'resource-exhausted',
      message: 'Resource exhausted',
      userMessage: 'Service quota exceeded. Please try again later.',
      severity: 'high',
      shouldRetry: true,
      retryDelay: 60000,
    },
    'failed-precondition': {
      code: 'failed-precondition',
      message: 'Failed precondition',
      userMessage: 'Operation failed due to current state. Please refresh and try again.',
      severity: 'medium',
      shouldRetry: true,
    },
    'aborted': {
      code: 'aborted',
      message: 'Operation aborted',
      userMessage: 'Operation was interrupted. Please try again.',
      severity: 'medium',
      shouldRetry: true,
    },
    'out-of-range': {
      code: 'out-of-range',
      message: 'Out of range',
      userMessage: 'Invalid data range. Please check your input.',
      severity: 'medium',
      shouldRetry: false,
    },
    'unauthenticated': {
      code: 'unauthenticated',
      message: 'Unauthenticated',
      userMessage: 'You need to be logged in to perform this action.',
      severity: 'high',
      shouldRetry: false,
    },
    'data-loss': {
      code: 'data-loss',
      message: 'Data loss',
      userMessage: 'Data corruption detected. Please contact support.',
      severity: 'critical',
      shouldRetry: false,
    },
    'internal': {
      code: 'internal',
      message: 'Internal error',
      userMessage: 'An internal error occurred. Please try again or contact support.',
      severity: 'high',
      shouldRetry: true,
      retryDelay: 10000,
    },
    'not-found': {
      code: 'not-found',
      message: 'Not found',
      userMessage: 'The requested data was not found.',
      severity: 'medium',
      shouldRetry: false,
    },
    'already-exists': {
      code: 'already-exists',
      message: 'Already exists',
      userMessage: 'This data already exists.',
      severity: 'medium',
      shouldRetry: false,
    },
    'cancelled': {
      code: 'cancelled',
      message: 'Operation cancelled',
      userMessage: 'Operation was cancelled.',
      severity: 'low',
      shouldRetry: true,
    },
    'invalid-argument': {
      code: 'invalid-argument',
      message: 'Invalid argument',
      userMessage: 'Invalid data provided. Please check your input.',
      severity: 'medium',
      shouldRetry: false,
    },
  };

  // Network Error Mapping
  private static networkErrorMap: Record<string, ErrorInfo> = {
    'NETWORK_ERROR': {
      code: 'NETWORK_ERROR',
      message: 'Network error',
      userMessage: 'Network connection failed. Please check your internet connection.',
      severity: 'high',
      shouldRetry: true,
      retryDelay: 5000,
    },
    'TIMEOUT': {
      code: 'TIMEOUT',
      message: 'Request timeout',
      userMessage: 'Request timed out. Please try again.',
      severity: 'medium',
      shouldRetry: true,
      retryDelay: 3000,
    },
    'OFFLINE': {
      code: 'OFFLINE',
      message: 'Device offline',
      userMessage: 'You appear to be offline. Please check your internet connection.',
      severity: 'high',
      shouldRetry: true,
      retryDelay: 10000,
    },
  };

  // Handle Firebase errors
  static handleFirebaseError(error: FirebaseError | Error, context?: string): ErrorInfo {
    let errorInfo: ErrorInfo;

    if (error instanceof FirebaseError) {
      const authError = this.authErrorMap[error.code];
      const firestoreError = this.firestoreErrorMap[error.code];
      
      errorInfo = authError || firestoreError || {
        code: error.code,
        message: error.message,
        userMessage: 'An unexpected error occurred. Please try again.',
        severity: 'medium',
        shouldRetry: true,
      };
    } else {
      errorInfo = {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        userMessage: 'An unexpected error occurred. Please try again.',
        severity: 'medium',
        shouldRetry: true,
      };
    }

    this.logError(errorInfo, context);
    return errorInfo;
  }

  // Handle network errors
  static handleNetworkError(errorCode: string, context?: string): ErrorInfo {
    const errorInfo = this.networkErrorMap[errorCode] || {
      code: errorCode,
      message: 'Network error',
      userMessage: 'Network error occurred. Please try again.',
      severity: 'medium',
      shouldRetry: true,
    };

    this.logError(errorInfo, context);
    return errorInfo;
  }

  // Handle validation errors
  static handleValidationError(field: string, value: any, context?: string): ErrorInfo {
    const errorInfo: ErrorInfo = {
      code: 'VALIDATION_ERROR',
      message: `Invalid ${field}: ${value}`,
      userMessage: `Please enter a valid ${field}.`,
      severity: 'low',
      shouldRetry: true,
    };

    this.logError(errorInfo, context);
    return errorInfo;
  }

  // Show user-friendly error message
  static showErrorAlert(errorInfo: ErrorInfo, onRetry?: () => void) {
    const buttons: any[] = [
      {
        text: 'OK',
        style: 'default',
      },
    ];

    if (errorInfo.shouldRetry && onRetry) {
      buttons.unshift({
        text: 'Retry',
        style: 'default',
        onPress: onRetry,
      });
    }

    Alert.alert(
      'Error',
      errorInfo.userMessage,
      buttons,
      { cancelable: false }
    );
  }

  // Log error for debugging
  private static logError(errorInfo: ErrorInfo, context?: string) {
    const logEntry = {
      timestamp: new Date(),
      error: errorInfo,
      context: context || 'Unknown',
    };

    this.errorLog.push(logEntry);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Console logging disabled for clean user experience
  }

  // Get error log for debugging
  static getErrorLog() {
    return this.errorLog;
  }

  // Clear error log
  static clearErrorLog() {
    this.errorLog = [];
  }

  // Retry with exponential backoff
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000,
    backoffFactor: number = 2
  ): Promise<T> {
    let lastError: any;
    let delay = initialDelay;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries - 1) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffFactor;
      }
    }

    throw lastError;
  }

  // Check if error is retryable
  static isRetryableError(error: any): boolean {
    const errorInfo = this.handleFirebaseError(error);
    return errorInfo.shouldRetry;
  }

  // Get retry delay for error
  static getRetryDelay(error: any): number {
    const errorInfo = this.handleFirebaseError(error);
    return errorInfo.retryDelay || 1000;
  }
}