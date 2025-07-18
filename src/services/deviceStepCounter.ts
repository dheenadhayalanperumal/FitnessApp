import { Platform, DeviceEventEmitter } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionUtils } from '../utils/permissions';

export interface StepCounterData {
  steps: number;
  timestamp: number;
  dailySteps: number;
}

export interface StepCounterCallback {
  (data: StepCounterData): void;
}

class DeviceStepCounter {
  private isListening = false;
  private listeners: StepCounterCallback[] = [];
  private subscription: any = null;
  private stepCount = 0;
  private lastY = 0;
  private lastZ = 0;
  private lastX = 0;
  private threshold = 1.5; // Proper threshold for actual walking
  private lastStepTime = 0;
  private minStepInterval = 250; // Minimum 250ms between steps (faster walking allowed)
  private maxStepInterval = 2000; // Maximum 2s between steps (too slow = not walking)
  private todayKey = '';
  private peakValues: number[] = []; // Store recent peak values for pattern analysis
  private valleyValues: number[] = []; // Store valley values for peak-valley detection
  private recentAccelerations: Array<{x: number, y: number, z: number, magnitude: number, timestamp: number}> = [];
  private walkingPattern = false; // Track if we're in a walking pattern
  private stepCandidates: Array<{magnitude: number, timestamp: number}> = []; // Potential steps

  constructor() {
    this.todayKey = new Date().toISOString().split('T')[0];
    this.loadTodaySteps();
  }

  // Load today's steps from storage
  private async loadTodaySteps() {
    try {
      const stored = await AsyncStorage.getItem(`device_steps_${this.todayKey}`);
      if (stored) {
        this.stepCount = parseInt(stored, 10) || 0;
      }
    } catch (error) {
      console.log('Could not load stored steps:', error);
    }
  }

  // Save today's steps to storage
  private async saveTodaySteps() {
    try {
      await AsyncStorage.setItem(`device_steps_${this.todayKey}`, this.stepCount.toString());
    } catch (error) {
      console.log('Could not save steps:', error);
    }
  }

  // Check if device step counting is supported
  async isSupported(): Promise<boolean> {
    try {
      const available = await Accelerometer.isAvailableAsync();
      console.log('Accelerometer available:', available);
      return (Platform.OS === 'android' || Platform.OS === 'ios') && available;
    } catch (error) {
      console.error('Error checking accelerometer availability:', error);
      return false;
    }
  }

  // Start listening to accelerometer for step detection
  async startListening(): Promise<boolean> {
    console.log('🚀 Starting device step counter...');
    
    const supported = await this.isSupported();
    console.log('📱 Device support check:', supported);
    
    if (!supported) {
      console.warn('❌ Device step counter not supported on this platform');
      return false;
    }

    if (this.isListening) {
      console.log('✅ Already listening, returning true');
      return true;
    }

    try {
      // Skip permission request entirely to avoid hanging
      console.log('⚡ Skipping permission request - using accelerometer directly...');

      // Set accelerometer update interval (optimized for step detection)
      console.log('⚙️ Setting accelerometer update interval...');
      Accelerometer.setUpdateInterval(50); // 50ms for proper step pattern analysis

      // Start listening to accelerometer
      console.log('🎧 Starting accelerometer listener...');
      this.subscription = Accelerometer.addListener(accelerometerData => {
        try {
          this.detectStep(accelerometerData);
        } catch (error) {
          console.error('❌ Error in step detection:', error);
        }
      });

      this.isListening = true;
      console.log('✅ Device step counter started successfully');
      
      // Load and send initial step count
      await this.loadTodaySteps();
      this.notifyListeners();
      
      console.log(`📊 Initial step count: ${this.stepCount}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to start device step counter:', error);
      this.isListening = false;
      return false;
    }
  }

  // Stop listening to accelerometer
  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      if (this.subscription) {
        this.subscription.remove();
        this.subscription = null;
      }
      
      this.isListening = false;
      await this.saveTodaySteps();
      console.log('Device step counter stopped');
    } catch (error) {
      console.error('Failed to stop device step counter:', error);
    }
  }

  // Detect actual walking steps using advanced pattern recognition (similar to Google Fit)
  private detectStep(data: { x: number; y: number; z: number }) {
    const { x, y, z } = data;
    const currentTime = Date.now();
    
    // Calculate magnitude of acceleration (removing gravity baseline)
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    
    // Store recent accelerometer data for pattern analysis
    this.recentAccelerations.push({ x, y, z, magnitude, timestamp: currentTime });
    
    // Keep only last 2 seconds of data for analysis
    const twoSecondsAgo = currentTime - 2000;
    this.recentAccelerations = this.recentAccelerations.filter(reading => reading.timestamp > twoSecondsAgo);
    
    // Need at least 0.5 seconds of data before detecting patterns
    if (this.recentAccelerations.length < 10) { // 50ms intervals = 10 readings per 0.5 second
      // Debug: Log first few readings to confirm accelerometer is working
      if (this.recentAccelerations.length % 20 === 0) {
        console.log(`📊 Collecting data... ${this.recentAccelerations.length}/10 readings`);
      }
      this.updateLastValues(x, y, z);
      return;
    }
    
    // Analyze walking pattern
    const isWalkingPattern = this.analyzeWalkingPattern();
    
    // Debug: Log walking pattern analysis results occasionally
    if (this.recentAccelerations.length % 100 === 0) {
      console.log(`🚶 Walking pattern analysis: ${isWalkingPattern}`);
    }
    
    if (!isWalkingPattern) {
      this.updateLastValues(x, y, z);
      return;
    }
    
    // Check timing constraints for realistic walking
    if (currentTime - this.lastStepTime < this.minStepInterval) {
      this.updateLastValues(x, y, z);
      return;
    }
    
    // Detect peaks and valleys in acceleration data
    const isPeakCandidate = this.detectPeakValley(magnitude, currentTime);
    
    if (isPeakCandidate) {
      // Validate this is a real step using multiple criteria
      if (this.validateStep(magnitude, currentTime)) {
        this.registerStep(magnitude, currentTime);
      }
    }
    
    this.updateLastValues(x, y, z);
  }

  // Analyze if the recent accelerometer data shows a walking pattern
  private analyzeWalkingPattern(): boolean {
    if (this.recentAccelerations.length < 10) return false;
    
    const magnitudes = this.recentAccelerations.map(reading => reading.magnitude);
    const timestamps = this.recentAccelerations.map(reading => reading.timestamp);
    
    // Calculate variance in acceleration - walking should have consistent rhythm
    const avgMagnitude = magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length;
    const variance = magnitudes.reduce((sum, mag) => sum + Math.pow(mag - avgMagnitude, 2), 0) / magnitudes.length;
    const stdDev = Math.sqrt(variance);
    
    // Check for periodic patterns (walking rhythm)
    const hasRhythmicPattern = this.detectRhythmicPattern(magnitudes, timestamps);
    
    // Check for reasonable acceleration range (more permissive for real walking)
    const isReasonableActivity = avgMagnitude > 8.5 && avgMagnitude < 15.0 && stdDev > 0.2 && stdDev < 3.0;
    
    // Check for consistent vertical component (walking has vertical bounce)
    const hasVerticalComponent = this.hasVerticalWalkingComponent();
    
    // Primary walking detection (strict)
    const isWalking = hasRhythmicPattern && isReasonableActivity && hasVerticalComponent;
    
    // Fallback detection (less strict) - if any two criteria are met
    const isMostlyWalking = (hasRhythmicPattern && isReasonableActivity) || 
                           (hasRhythmicPattern && hasVerticalComponent) ||
                           (isReasonableActivity && hasVerticalComponent && stdDev > 0.5);
    
    const finalDecision = isWalking || isMostlyWalking;
    
    // Debug logging for walking pattern analysis
    if (this.stepCount < 5 || this.stepCount % 25 === 0) {
      console.log(`Walking Analysis: Rhythmic=${hasRhythmicPattern}, Activity=${isReasonableActivity}, Vertical=${hasVerticalComponent}`);
      console.log(`Result: Strict=${isWalking}, Fallback=${isMostlyWalking}, Final=${finalDecision}`);
      console.log(`Stats: Avg=${avgMagnitude.toFixed(2)}, StdDev=${stdDev.toFixed(2)}`);
    }
    
    return finalDecision;
  }

  // Detect rhythmic patterns typical of walking
  private detectRhythmicPattern(magnitudes: number[], timestamps: number[]): boolean {
    if (magnitudes.length < 10) return false;
    
    // Find peaks in the magnitude data
    const peaks: number[] = [];
    for (let i = 1; i < magnitudes.length - 1; i++) {
      if (magnitudes[i] > magnitudes[i-1] && magnitudes[i] > magnitudes[i+1]) {
        peaks.push(timestamps[i]);
      }
    }
    
    // Check for consistent timing between peaks (walking rhythm) - more permissive
    if (peaks.length < 2) return false;
    
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i-1]);
    }
    
    // Walking intervals should be between 250ms and 1500ms (more permissive)
    const validIntervals = intervals.filter(interval => interval >= 250 && interval <= 1500);
    const rhythmicConsistency = validIntervals.length / intervals.length;
    
    return rhythmicConsistency >= 0.5; // 50% of intervals should be in walking range (more permissive)
  }

  // Check for vertical component typical of walking
  private hasVerticalWalkingComponent(): boolean {
    if (this.recentAccelerations.length < 10) return false;
    
    // Analyze Y-axis (typically vertical when phone is held normally)
    const yValues = this.recentAccelerations.map(reading => reading.y);
    const yVariance = this.calculateVariance(yValues);
    
    // Walking should have some vertical movement variance (more permissive)
    return yVariance > 0.05 && yVariance < 5.0;
  }

  // Detect peaks and valleys in acceleration magnitude
  private detectPeakValley(magnitude: number, timestamp: number): boolean {
    this.peakValues.push(magnitude);
    if (this.peakValues.length > 5) {
      this.peakValues.shift();
    }
    
    if (this.peakValues.length < 5) return false;
    
    // Check if current reading is a peak (higher than surrounding values)
    const currentIndex = 2; // Middle of 5-element array
    const isPeak = magnitude > this.peakValues[currentIndex-1] && 
                   magnitude > this.peakValues[currentIndex+1] &&
                   magnitude > this.peakValues[currentIndex-2] && 
                   magnitude > this.peakValues[currentIndex+2];
    
    return isPeak && magnitude > 9.5; // Lowered threshold for step peak detection
  }

  // Validate that a detected peak represents a real step
  private validateStep(magnitude: number, timestamp: number): boolean {
    // Check timing - steps should be spaced appropriately
    const timeSinceLastStep = timestamp - this.lastStepTime;
    if (timeSinceLastStep < this.minStepInterval || timeSinceLastStep > this.maxStepInterval) {
      return false;
    }
    
    // Check magnitude is in reasonable range for walking (more permissive)
    if (magnitude < 9.5 || magnitude > 18.0) {
      return false;
    }
    
    // Check for step pattern consistency
    this.stepCandidates.push({ magnitude, timestamp });
    if (this.stepCandidates.length > 5) {
      this.stepCandidates.shift();
    }
    
    // If we have multiple candidates, check for consistency
    if (this.stepCandidates.length >= 3) {
      const intervals = [];
      for (let i = 1; i < this.stepCandidates.length; i++) {
        intervals.push(this.stepCandidates[i].timestamp - this.stepCandidates[i-1].timestamp);
      }
      
      // Check if intervals are reasonably consistent (more permissive)
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const consistentIntervals = intervals.filter(interval => Math.abs(interval - avgInterval) < 300);
      const rhythmConsistency = consistentIntervals.length / intervals.length;
      
      if (rhythmConsistency < 0.6) { // 60% should be reasonably consistent
        return false;
      }
    }
    
    return true;
  }

  // Register a validated step
  private registerStep(magnitude: number, timestamp: number) {
    this.stepCount++;
    this.lastStepTime = timestamp;
    
    console.log(`👟 REAL STEP ${this.stepCount}! Magnitude: ${magnitude.toFixed(2)} at ${new Date(timestamp).toLocaleTimeString()}`);
    
    // Save every 5 steps
    if (this.stepCount % 5 === 0) {
      this.saveTodaySteps();
    }
    
    // Notify listeners
    this.notifyListeners();
  }

  // Helper function to calculate variance
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return variance;
  }

  // Update last values for next iteration
  private updateLastValues(x: number, y: number, z: number) {
    this.lastX = x;
    this.lastY = y;
    this.lastZ = z;
  }

  // Notify all listeners of step count update
  private notifyListeners() {
    const data: StepCounterData = {
      steps: this.stepCount,
      timestamp: Date.now(),
      dailySteps: this.stepCount,
    };

    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in step counter callback:', error);
      }
    });
  }

  // Get current step count
  async getCurrentSteps(): Promise<number> {
    return this.stepCount;
  }

  // Get today's step count
  async getTodaySteps(): Promise<number> {
    return this.stepCount;
  }

  // Check if supported (sync version for backward compatibility)
  isSupportedSync(): boolean {
    return Platform.OS === 'android' || Platform.OS === 'ios';
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

  // Reset daily step count (call at midnight)
  async resetDailySteps(): Promise<void> {
    this.stepCount = 0;
    this.todayKey = new Date().toISOString().split('T')[0];
    await this.saveTodaySteps();
    this.notifyListeners();
  }

  // Manually add steps (for calibration or manual entry)
  async addSteps(steps: number): Promise<void> {
    this.stepCount += steps;
    await this.saveTodaySteps();
    this.notifyListeners();
  }

  // Set step count (for calibration)
  async setSteps(steps: number): Promise<void> {
    this.stepCount = steps;
    await this.saveTodaySteps();
    this.notifyListeners();
  }

  // Get listening status
  getIsListening(): boolean {
    return this.isListening;
  }

  // Calibrate step detection sensitivity
  setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  // Set minimum time between steps
  setMinStepInterval(interval: number): void {
    this.minStepInterval = interval;
  }

  // Start listening without permission checks (for testing/debugging)
  async startListeningWithoutPermissions(): Promise<boolean> {
    console.log('🚀 Starting device step counter WITHOUT permission checks...');

    if (this.isListening) {
      console.log('✅ Already listening, returning true');
      return true;
    }

    try {
      // Set accelerometer update interval
      console.log('⚙️ Setting accelerometer update interval...');
      Accelerometer.setUpdateInterval(100);

      // Start listening to accelerometer directly
      console.log('🎧 Starting accelerometer listener without permissions...');
      this.subscription = Accelerometer.addListener(accelerometerData => {
        try {
          this.detectStep(accelerometerData);
        } catch (error) {
          console.error('❌ Error in step detection:', error);
        }
      });

      this.isListening = true;
      console.log('✅ Device step counter started successfully (no permissions)');
      
      // Load and send initial step count
      await this.loadTodaySteps();
      this.notifyListeners();
      
      console.log(`📊 Initial step count: ${this.stepCount}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to start device step counter without permissions:', error);
      this.isListening = false;
      return false;
    }
  }

  // Simple step detection for testing (less strict)
  async startListeningSimpleMode(): Promise<boolean> {
    console.log('🚀 Starting SIMPLE step detection mode...');

    if (this.isListening) {
      await this.stopListening();
    }

    try {
      console.log('⚙️ Setting accelerometer for simple detection...');
      Accelerometer.setUpdateInterval(100);

      let lastMagnitude = 0;
      let peakDetected = false;
      let lastPeakTime = 0;
      let dataCount = 0;

      this.subscription = Accelerometer.addListener(accelerometerData => {
        const { x, y, z } = accelerometerData;
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const currentTime = Date.now();
        dataCount++;
        
        // Debug: Log first few readings to confirm data is coming
        if (dataCount <= 5) {
          console.log(`📊 Simple mode data ${dataCount}: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}, mag=${magnitude.toFixed(2)}`);
        }
        
        // Very simple detection - any significant change
        const magnitudeDiff = Math.abs(magnitude - lastMagnitude);
        if (magnitudeDiff > 1.0 && currentTime - lastPeakTime > 500) {
          this.stepCount++;
          lastPeakTime = currentTime;
          console.log(`🚶 SIMPLE STEP ${this.stepCount}! Magnitude: ${magnitude.toFixed(2)}, Diff: ${magnitudeDiff.toFixed(2)}`);
          this.saveTodaySteps();
          this.notifyListeners();
        }
        
        lastMagnitude = magnitude;
      });

      this.isListening = true;
      console.log('✅ Simple step detection started');
      
      await this.loadTodaySteps();
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('❌ Failed to start simple step detection:', error);
      return false;
    }
  }
}

export const deviceStepCounter = new DeviceStepCounter();