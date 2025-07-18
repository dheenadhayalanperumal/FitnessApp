import { Platform, DeviceEventEmitter, NativeModules } from 'react-native';

export interface StepCounterData {
  steps: number;
  timestamp: number;
  dailySteps: number;
}

export interface StepCounterCallback {
  (data: StepCounterData): void;
}

class NativeStepCounter {
  private isListening = false;
  private listeners: StepCounterCallback[] = [];
  private stepCounterModule: any = null;

  constructor() {
    // Try to get the native module if available
    this.stepCounterModule = NativeModules.StepCounter;
  }

  // Check if native step counting is supported
  isSupported(): boolean {
    return Platform.OS === 'android' && this.stepCounterModule !== null;
  }

  // Start listening to step counter
  async startListening(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Native step counter not supported on this platform');
      return false;
    }

    if (this.isListening) {
      return true;
    }

    try {
      // Request permission and start step counting
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('Step counter permission denied');
        return false;
      }

      // Start the native step counter
      await this.stepCounterModule.startStepCounter();

      // Listen for step events
      this.setupEventListener();
      
      this.isListening = true;
      console.log('Native step counter started');
      return true;
    } catch (error) {
      console.error('Failed to start native step counter:', error);
      return false;
    }
  }

  // Stop listening to step counter
  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      if (this.stepCounterModule) {
        await this.stepCounterModule.stopStepCounter();
      }
      
      // Remove event listeners
      DeviceEventEmitter.removeAllListeners('StepCounterUpdate');
      
      this.isListening = false;
      console.log('Native step counter stopped');
    } catch (error) {
      console.error('Failed to stop native step counter:', error);
    }
  }

  // Get current step count
  async getCurrentSteps(): Promise<number> {
    if (!this.isSupported()) {
      return 0;
    }

    try {
      const steps = await this.stepCounterModule.getCurrentSteps();
      return steps || 0;
    } catch (error) {
      console.error('Failed to get current steps:', error);
      return 0;
    }
  }

  // Get today's step count
  async getTodaySteps(): Promise<number> {
    if (!this.isSupported()) {
      return 0;
    }

    try {
      const steps = await this.stepCounterModule.getTodaySteps();
      return steps || 0;
    } catch (error) {
      console.error('Failed to get today steps:', error);
      return 0;
    }
  }

  // Add a listener for step updates
  addListener(callback: StepCounterCallback): void {
    this.listeners.push(callback);
  }

  // Remove a listener
  removeListener(callback: StepCounterCallback): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Request necessary permissions
  private async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const { PermissionsAndroid } = require('react-native');
      
      // Request activity recognition permission (needed for step counting)
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        {
          title: 'Step Counter Permission',
          message: 'This app needs access to your device\'s step counter to track your daily activity.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  // Setup event listener for step updates
  private setupEventListener(): void {
    DeviceEventEmitter.addListener('StepCounterUpdate', (data: StepCounterData) => {
      // Notify all listeners
      this.listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in step counter callback:', error);
        }
      });
    });
  }

}

export const nativeStepCounter = new NativeStepCounter();