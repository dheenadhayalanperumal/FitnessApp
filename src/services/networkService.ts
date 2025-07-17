// For React Native, you would use @react-native-community/netinfo
// import NetInfo from '@react-native-community/netinfo';
import { ErrorHandlingService } from './errorHandlingService';

export interface NetworkState {
  isConnected: boolean;
  connectionType: string;
  isReachable: boolean;
}

export class NetworkService {
  private static listeners: Array<(state: NetworkState) => void> = [];
  private static currentState: NetworkState = {
    isConnected: false,
    connectionType: 'unknown',
    isReachable: false,
  };

  // Initialize network monitoring
  static initialize() {
    // For now, we'll simulate network state
    // In a real app, you would use @react-native-community/netinfo
    this.currentState = {
      isConnected: true,
      connectionType: 'wifi',
      isReachable: true,
    };
  }

  // Get current network state
  static getCurrentState(): NetworkState {
    return this.currentState;
  }

  // Check if device is online
  static isOnline(): boolean {
    return this.currentState.isConnected && this.currentState.isReachable;
  }

  // Add network state listener
  static addListener(callback: (state: NetworkState) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of network state change
  private static notifyListeners(state: NetworkState) {
    this.currentState = state;
    this.listeners.forEach(listener => listener(state));
  }

  // Test network connectivity
  static async testConnectivity(): Promise<boolean> {
    try {
      // Simple connectivity test
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      return response.status === 204;
    } catch (error) {
      console.error('Network connectivity test failed:', error);
      return false;
    }
  }

  // Wait for network connection
  static async waitForConnection(timeout: number = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkConnection = () => {
        if (this.isOnline()) {
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          resolve(false);
          return;
        }
        
        setTimeout(checkConnection, 1000);
      };
      
      checkConnection();
    });
  }

  // Execute operation with network retry
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      checkNetwork?: boolean;
    } = {}
  ): Promise<T> {
    const { maxRetries = 3, retryDelay = 1000, checkNetwork = true } = options;
    
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Check network connectivity if requested
        if (checkNetwork && !this.isOnline()) {
          const networkAvailable = await this.waitForConnection(5000);
          if (!networkAvailable) {
            throw new Error('Network unavailable');
          }
        }
        
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Check if this is a network-related error
        if (this.isNetworkError(error)) {
          ErrorHandlingService.handleNetworkError('NETWORK_ERROR', 'NetworkService.executeWithRetry');
          
          // Wait for network before retrying
          await this.waitForConnection();
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries - 1) {
          break;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
    
    throw lastError;
  }

  // Check if error is network-related
  private static isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';
    
    const networkErrorKeywords = [
      'network',
      'connection',
      'timeout',
      'offline',
      'unreachable',
      'failed to fetch',
      'no internet',
      'connection refused',
      'host not found',
    ];
    
    return networkErrorKeywords.some(keyword => 
      errorMessage.includes(keyword) || errorCode.includes(keyword)
    );
  }

  // Handle offline data operations
  static async handleOfflineOperation<T>(
    operation: () => Promise<T>,
    fallbackData?: T
  ): Promise<T> {
    try {
      if (this.isOnline()) {
        return await operation();
      } else {
        if (fallbackData !== undefined) {
          return fallbackData;
        }
        throw new Error('Operation requires network connection');
      }
    } catch (error: any) {
      if (this.isNetworkError(error) && fallbackData !== undefined) {
        return fallbackData;
      }
      throw error;
    }
  }

  // Queue operations for when network is available
  private static operationQueue: Array<() => Promise<void>> = [];

  static queueOperation(operation: () => Promise<void>) {
    this.operationQueue.push(operation);
    
    // If online, process queue immediately
    if (this.isOnline()) {
      this.processQueue();
    }
  }

  private static async processQueue() {
    while (this.operationQueue.length > 0 && this.isOnline()) {
      const operation = this.operationQueue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('Queued operation failed:', error);
          // Re-queue the operation if it failed due to network issues
          if (this.isNetworkError(error)) {
            this.operationQueue.unshift(operation);
            break;
          }
        }
      }
    }
  }

  // Monitor network changes and process queue
  static startQueueProcessor() {
    this.addListener((state) => {
      if (state.isConnected && state.isReachable) {
        this.processQueue();
      }
    });
  }
}

// Initialize network service
NetworkService.initialize();