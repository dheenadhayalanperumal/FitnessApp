import { Platform, PermissionsAndroid } from 'react-native';

export class PermissionUtils {
  // Request activity recognition permission for step counting
  static async requestActivityRecognitionPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      // iOS doesn't need this permission for accelerometer
      console.log('🍎 iOS detected, skipping Android permission');
      return true;
    }

    try {
      console.log('🔐 Auto-requesting Android ACTIVITY_RECOGNITION permission...');
      
      // First check if we already have permission
      const hasPermission = await this.checkActivityRecognitionPermission();
      if (hasPermission) {
        console.log('✅ Permission already granted');
        return true;
      }

      console.log('⏳ Auto-requesting permission from user...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Permission request timeout')), 8000);
      });

      try {
        const granted = await Promise.race([
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
            {
              title: 'Step Tracking',
              message: 'Allow step counting for fitness tracking?',
              buttonPositive: 'Allow',
              buttonNegative: 'Skip',
            }
          ),
          timeoutPromise
        ]);

        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        console.log('🔐 Auto-permission result:', granted, 'Granted:', isGranted);
        
        if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          console.log('⚠️ Permission set to never ask again - using accelerometer only');
        } else if (!isGranted) {
          console.log('⚠️ Permission denied - using accelerometer only');
        }
        
        return true; // Always proceed with accelerometer
      } catch (timeoutError) {
        console.log('⚠️ Permission request timed out - proceeding with accelerometer only');
        return true;
      }
      
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      // Always proceed - accelerometer should work without explicit permission
      console.log('⚠️ Proceeding without permission - using accelerometer directly');
      return true;
    }
  }

  // Check if activity recognition permission is already granted
  static async checkActivityRecognitionPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      console.log('🔍 Checking existing permission...');
      
      // Add timeout for permission check too
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Permission check timeout')), 5000);
      });

      const granted = await Promise.race([
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION),
        timeoutPromise
      ]);
      
      console.log('🔍 Permission check result:', granted);
      return granted;
    } catch (error) {
      console.error('❌ Permission check failed:', error);
      return false;
    }
  }
}