# Android Native Step Counter Setup

## Overview
This document outlines the setup for Android native step counting functionality in the fitness app.

## Prerequisites
- Android device with step counter hardware sensor
- Android API level 19+ (KitKat 4.4+)
- ACTIVITY_RECOGNITION permission

## Native Module Implementation

### 1. Create Android Native Module
To fully implement native step counting, you'll need to create a custom native module:

```java
// android/app/src/main/java/com/yourapp/StepCounterModule.java
package com.yourapp;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.content.pm.PackageManager;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class StepCounterModule extends ReactContextBaseJavaModule implements SensorEventListener {
    
    private SensorManager sensorManager;
    private Sensor stepCounterSensor;
    private Sensor stepDetectorSensor;
    private ReactApplicationContext reactContext;
    
    private int totalSteps = 0;
    private int initialSteps = 0;
    private boolean isListening = false;
    
    public StepCounterModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.sensorManager = (SensorManager) reactContext.getSystemService(Context.SENSOR_SERVICE);
        this.stepCounterSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        this.stepDetectorSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR);
    }
    
    @Override
    public String getName() {
        return "StepCounter";
    }
    
    @ReactMethod
    public void startStepCounter(Promise promise) {
        if (stepCounterSensor == null) {
            promise.reject("SENSOR_NOT_AVAILABLE", "Step counter sensor not available");
            return;
        }
        
        boolean registered = sensorManager.registerListener(this, stepCounterSensor, SensorManager.SENSOR_DELAY_FASTEST);
        
        if (registered) {
            isListening = true;
            promise.resolve(true);
        } else {
            promise.reject("REGISTRATION_FAILED", "Failed to register step counter listener");
        }
    }
    
    @ReactMethod
    public void stopStepCounter(Promise promise) {
        if (isListening) {
            sensorManager.unregisterListener(this);
            isListening = false;
        }
        promise.resolve(true);
    }
    
    @ReactMethod
    public void getCurrentSteps(Promise promise) {
        promise.resolve(totalSteps);
    }
    
    @ReactMethod
    public void getTodaySteps(Promise promise) {
        // Return steps since app started (simplified)
        promise.resolve(Math.max(0, totalSteps - initialSteps));
    }
    
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            if (initialSteps == 0) {
                initialSteps = (int) event.values[0];
            }
            totalSteps = (int) event.values[0];
            
            WritableMap params = Arguments.createMap();
            params.putInt("steps", totalSteps);
            params.putInt("dailySteps", Math.max(0, totalSteps - initialSteps));
            params.putDouble("timestamp", System.currentTimeMillis());
            
            sendEvent("StepCounterUpdate", params);
        }
    }
    
    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Handle accuracy changes if needed
    }
    
    private void sendEvent(String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
}
```

### 2. Register the Module
```java
// android/app/src/main/java/com/yourapp/MainApplication.java
@Override
protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new StepCounterPackage() // Add this line
    );
}
```

### 3. Add Permissions
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-feature android:name="android.hardware.sensor.stepcounter" android:required="false" />
<uses-feature android:name="android.hardware.sensor.stepdetector" android:required="false" />
```

## Testing
- The current implementation includes a fallback simulation mode for testing
- On devices without native step counter, it will use the simulation
- Real implementation requires the native module above

## Features Implemented
1. **Native Step Detection**: Uses Android's built-in step counter sensor
2. **Permission Handling**: Requests ACTIVITY_RECOGNITION permission
3. **Fallback Mode**: Simulation for testing and unsupported devices
4. **Auto-sync**: Periodically syncs native steps with Firebase
5. **Toggle Feature**: Switch between native and manual tracking
6. **Real-time Updates**: Live step count updates
7. **Error Handling**: Graceful fallback when native features fail

## Usage
1. On Android devices, the app will automatically attempt to use native step counting
2. Users can toggle between native and manual tracking via the UI
3. Steps are automatically synced with the database every minute
4. Manual step entry is still available for corrections or when native isn't available

## Installation
Run: `npm install` or `yarn install` to install the new dependencies.

Note: For full native functionality, you'll need to implement the native module above and rebuild the Android app.