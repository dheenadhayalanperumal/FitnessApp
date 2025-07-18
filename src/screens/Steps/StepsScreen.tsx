import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useFirebaseFitness } from '../../context/FirebaseFitnessContext';
import { useFirebaseAuth } from '../../context/FirebaseAuthContext';
import { useSteps } from '../../hooks/useSteps';
import { useNativeStepCounter } from '../../hooks/useNativeStepCounter';
import { deviceStepCounter } from '../../services/deviceStepCounter';
import LineChart from '../../components/charts/LineChart';

const StepsScreen: React.FC = () => {
  const { user } = useFirebaseAuth();
  const { state, updateSteps } = useFirebaseFitness();
  const [showChart, setShowChart] = useState(false);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  const userId = user?.id || 'current-user';
  const stepsHook = useSteps(userId);
  const nativeStepCounter = useNativeStepCounter();

  // Use native steps only
  const currentSteps = nativeStepCounter.steps || 0;
  
  const targetSteps = state.goals.dailySteps;
  const progress = (currentSteps / targetSteps) * 100;
  const caloriesBurned = Math.round(currentSteps * 0.04);
  const distanceWalked = Math.round(currentSteps * 0.0008 * 100) / 100;

  useEffect(() => {
    loadWeeklyData();
  }, []);

  // Sync native steps with database periodically
  useEffect(() => {
    if (nativeStepCounter.isSupported && nativeStepCounter.steps >= 0) {
      const syncInterval = setInterval(() => {
        syncNativeSteps();
      }, 30000); // Sync every 30 seconds

      return () => clearInterval(syncInterval);
    }
  }, [nativeStepCounter.isSupported, nativeStepCounter.steps]);

  // Sync immediately when steps change
  useEffect(() => {
    if (nativeStepCounter.steps >= 0) {
      syncNativeSteps();
    }
  }, [nativeStepCounter.steps]);

  const syncNativeSteps = async () => {
    try {
      await updateSteps(nativeStepCounter.steps);
    } catch (error) {
      console.error('Failed to sync native steps:', error);
    }
  };

  const loadWeeklyData = async () => {
    try {
      const data = await stepsHook.getWeeklySteps();
      setWeeklyData(data);
    } catch (error) {
      console.error('Failed to load weekly steps data');
    }
  };

  const getChartData = () => {
    if (!weeklyData.length) return { labels: [], datasets: [{ data: [] }] };
    
    const labels = weeklyData.map((data, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return date.toLocaleDateString('en', { weekday: 'short' });
    });
    
    return {
      labels,
      datasets: [{
        data: weeklyData.map(data => data.steps || 0),
        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };


  const CircularProgress = ({ progress, size = 200 }: any) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={[styles.circularProgress, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.progressSvg}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progress >= 100 ? "#4CAF50" : "#007AFF"}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.progressContent}>
          <Text style={styles.stepsNumber}>{currentSteps.toLocaleString()}</Text>
          <Text style={styles.stepsLabel}>steps</Text>
          <Text style={styles.targetLabel}>of {targetSteps.toLocaleString()}</Text>
          {progress >= 100 && (
            <View style={styles.goalAchievedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.goalAchievedText}>Goal Reached!</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Steps Today</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
        
        {/* Native Step Counter Status */}
        <View style={styles.nativeCounterStatus}>
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot,
              { backgroundColor: nativeStepCounter.isListening ? '#4CAF50' : nativeStepCounter.isSupported ? '#FFC107' : '#F44336' }
            ]} />
            <Text style={styles.statusText}>
              {nativeStepCounter.isListening 
                ? 'Auto Tracking Active' 
                : nativeStepCounter.isSupported 
                  ? 'Starting...' 
                  : 'Device Not Supported'}
            </Text>
            <Ionicons 
              name="phone-portrait" 
              size={16} 
              color="#fff" 
            />
          </View>
          
          {/* Debug Information */}
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>Steps: {nativeStepCounter.steps}</Text>
            <Text style={styles.debugText}>Supported: {nativeStepCounter.isSupported ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Listening: {nativeStepCounter.isListening ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
            <Text style={styles.debugText}>Algorithm: Google Fit Style</Text>
            <Text style={styles.debugText}>Status: Only counts actual walking</Text>
          </View>
          
          {nativeStepCounter.error && (
            <Text style={styles.errorText}>{nativeStepCounter.error}</Text>
          )}
          {!nativeStepCounter.isSupported && (
            <Text style={styles.infoText}>
              Device accelerometer not available
            </Text>
          )}
          
          {/* Manual restart button for debugging */}
          <View style={styles.debugButtonContainer}>
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={async () => {
                console.log('🔄 Manual restart triggered');
                await nativeStepCounter.stopTracking();
                await nativeStepCounter.startTracking();
              }}
            >
              <Text style={styles.debugButtonText}>Restart</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.debugButton, { backgroundColor: '#FF6B6B' }]}
              onPress={async () => {
                console.log('🔄 Starting without permissions');
                await nativeStepCounter.stopTracking();
                // @ts-ignore - accessing internal method for debugging
                const success = await deviceStepCounter.startListeningWithoutPermissions();
                console.log('Permission-free start result:', success);
              }}
            >
              <Text style={styles.debugButtonText}>Skip Perms</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.debugButton, { backgroundColor: '#4CAF50' }]}
              onPress={async () => {
                console.log('🔄 Starting simple mode');
                // @ts-ignore - accessing internal method for debugging
                const success = await deviceStepCounter.startListeningSimpleMode();
                console.log('Simple mode start result:', success);
              }}
            >
              <Text style={styles.debugButtonText}>Simple Mode</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <CircularProgress progress={Math.min(progress, 100)} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color="#FF6B6B" />
          <Text style={styles.statValue}>{caloriesBurned}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="map" size={24} color="#4ECDC4" />
          <Text style={styles.statValue}>{distanceWalked}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="trophy" size={24} color="#FFD93D" />
          <Text style={styles.statValue}>{Math.round(progress)}%</Text>
          <Text style={styles.statLabel}>Goal</Text>
        </View>
      </View>


      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          <TouchableOpacity
            style={styles.chartToggle}
            onPress={() => setShowChart(!showChart)}
          >
            <Ionicons 
              name={showChart ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#007AFF" 
            />
          </TouchableOpacity>
        </View>
        
        {showChart && (
          <LineChart
            data={getChartData()}
            title="Last 7 Days"
            yAxisSuffix=""
            color={(opacity) => `rgba(255, 107, 107, ${opacity})`}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  date: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  circularProgress: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSvg: {
    position: 'absolute',
  },
  progressContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  stepsNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  stepsLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  targetLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  goalAchievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
  },
  goalAchievedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chartContainer: {
    padding: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartToggle: {
    padding: 8,
  },
  nativeCounterStatus: {
    marginTop: 12,
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
  },
  errorText: {
    color: '#FFE0E0',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  debugInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  debugText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  debugButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 4,
  },
  debugButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default StepsScreen;