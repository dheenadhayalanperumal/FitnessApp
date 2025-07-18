import { ErrorHandlingService } from './errorHandlingService';
import { NetworkService } from './networkService';

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: {
    message: string;
    stack?: string;
    code?: string;
    context?: string;
  };
  user?: {
    id: string;
    email: string;
  };
  device: {
    platform: string;
    version: string;
    model?: string;
  };
  app: {
    version: string;
    build: string;
  };
  network: {
    isConnected: boolean;
    connectionType: string;
  };
  breadcrumbs: Array<{
    timestamp: Date;
    message: string;
    level: 'debug' | 'info' | 'warning' | 'error';
    category: string;
  }>;
}

export class ErrorMonitoringService {
  private static reports: ErrorReport[] = [];
  private static breadcrumbs: ErrorReport['breadcrumbs'] = [];
  private static maxReports = 100;
  private static maxBreadcrumbs = 50;
  private static userId: string | null = null;
  private static userEmail: string | null = null;

  // Initialize error monitoring
  static initialize() {
    // Global error handlers disabled for clean user experience
    // this.setupGlobalErrorHandlers();
    this.startPeriodicCleanup();
  }

  // Set user information for error reports
  static setUser(userId: string, userEmail: string) {
    this.userId = userId;
    this.userEmail = userEmail;
  }

  // Clear user information
  static clearUser() {
    this.userId = null;
    this.userEmail = null;
  }

  // Add breadcrumb for debugging
  static addBreadcrumb(
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    category: string = 'general'
  ) {
    // Breadcrumb logging disabled for clean user experience
    return;
    const breadcrumb = {
      timestamp: new Date(),
      message,
      level,
      category,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep breadcrumbs size manageable
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }

    // Logging disabled for clean user experience
  }

  // Report error with full context
  static reportError(
    error: Error,
    context?: string,
    additionalInfo?: Record<string, any>
  ) {
    // Error reporting disabled for clean user experience
    return;
    const report: ErrorReport = {
      id: this.generateId(),
      timestamp: new Date(),
      error: {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        context: context || 'Unknown',
      },
      user: this.userId ? {
        id: this.userId!,
        email: this.userEmail || 'Unknown',
      } : undefined,
      device: this.getDeviceInfo(),
      app: this.getAppInfo(),
      network: this.getNetworkInfo(),
      breadcrumbs: [...this.breadcrumbs],
    };

    // Add additional info if provided
    if (additionalInfo) {
      (report as any).additionalInfo = additionalInfo;
    }

    this.reports.push(report);

    // Keep reports size manageable
    if (this.reports.length > this.maxReports) {
      this.reports.shift();
    }

    // Error reporting disabled for clean user experience

    // Add breadcrumb for the error
    this.addBreadcrumb(
      `Error: ${error.message}`,
      'error',
      context || 'error'
    );

    // Try to send to remote logging service (if available)
    this.sendToRemoteLogging(report);
  }

  // Get device information
  private static getDeviceInfo() {
    // In a real app, you'd use react-native-device-info
    return {
      platform: 'unknown',
      version: 'unknown',
      model: 'unknown',
    };
  }

  // Get app information
  private static getAppInfo() {
    return {
      version: '1.0.0',
      build: '1',
    };
  }

  // Get network information
  private static getNetworkInfo() {
    const networkState = NetworkService.getCurrentState();
    return {
      isConnected: networkState.isConnected,
      connectionType: networkState.connectionType,
    };
  }

  // Generate unique ID for error report
  private static generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Setup global error handlers
  private static setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    const originalHandler = global.Promise.prototype.catch;
    global.Promise.prototype.catch = function(onRejected) {
      return originalHandler.call(this, (error) => {
        if (error && !error._handled) {
          ErrorMonitoringService.reportError(
            error instanceof Error ? error : new Error(String(error)),
            'unhandled_promise_rejection'
          );
          error._handled = true;
        }
        if (onRejected) {
          return onRejected(error);
        }
        throw error;
      });
    };
  }

  // Send error report to remote logging service
  private static async sendToRemoteLogging(report: ErrorReport) {
    try {
      // In a real app, you'd send to a service like Sentry, LogRocket, etc.
      // For now, we'll just queue it for later sending
      if (NetworkService.isOnline()) {
        // Remote logging disabled for clean user experience
      } else {
        // Queued reporting disabled for clean user experience
      }
    } catch (error) {
      // Error logging disabled for clean user experience
    }
  }

  // Get all error reports
  static getErrorReports(): ErrorReport[] {
    return [...this.reports];
  }

  // Get error reports by severity
  static getErrorReportsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): ErrorReport[] {
    return this.reports.filter(report => {
      const errorInfo = ErrorHandlingService.handleFirebaseError(
        new Error(report.error.message),
        report.error.context
      );
      return errorInfo.severity === severity;
    });
  }

  // Get recent error reports
  static getRecentErrorReports(hoursAgo: number = 24): ErrorReport[] {
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    return this.reports.filter(report => report.timestamp > cutoff);
  }

  // Clear all error reports
  static clearErrorReports() {
    this.reports = [];
  }

  // Clear all breadcrumbs
  static clearBreadcrumbs() {
    this.breadcrumbs = [];
  }

  // Get error statistics
  static getErrorStatistics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentHourErrors = this.reports.filter(r => r.timestamp > oneHourAgo);
    const recentDayErrors = this.reports.filter(r => r.timestamp > oneDayAgo);

    // Group by error type
    const errorTypes = this.reports.reduce((acc, report) => {
      const context = report.error.context || 'Unknown';
      acc[context] = (acc[context] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.reports.length,
      lastHour: recentHourErrors.length,
      lastDay: recentDayErrors.length,
      errorTypes,
      mostCommonError: Object.entries(errorTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None',
    };
  }

  // Export error reports for debugging
  static exportErrorReports(): string {
    return JSON.stringify({
      reports: this.reports,
      breadcrumbs: this.breadcrumbs,
      statistics: this.getErrorStatistics(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  // Start periodic cleanup of old reports
  private static startPeriodicCleanup() {
    const cleanupInterval = 60 * 60 * 1000; // 1 hour
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    setInterval(() => {
      const cutoff = new Date(Date.now() - maxAge);
      this.reports = this.reports.filter(report => report.timestamp > cutoff);
      this.breadcrumbs = this.breadcrumbs.filter(breadcrumb => breadcrumb.timestamp > cutoff);
    }, cleanupInterval);
  }

  // Performance monitoring
  static measurePerformance<T>(
    operation: () => Promise<T>,
    name: string
  ): Promise<T> {
    const startTime = Date.now();
    
    return operation().then(
      result => {
        const duration = Date.now() - startTime;
        this.addBreadcrumb(
          `Performance: ${name} completed in ${duration}ms`,
          'info',
          'performance'
        );
        return result;
      },
      error => {
        const duration = Date.now() - startTime;
        this.addBreadcrumb(
          `Performance: ${name} failed after ${duration}ms`,
          'error',
          'performance'
        );
        throw error;
      }
    );
  }
}

// Error monitoring initialization disabled for clean user experience
// ErrorMonitoringService.initialize();