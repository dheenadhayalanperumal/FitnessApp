import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFirebaseFitness } from '../../context/FirebaseFitnessContext';
import { useFirebaseAuth } from '../../context/FirebaseAuthContext';
import { useSteps } from '../../hooks/useSteps';
import LineChart from '../../components/charts/LineChart';

const StepsScreen: React.FC = () => {
  const { user } = useFirebaseAuth();
  const { state, updateSteps } = useFirebaseFitness();
  const [manualSteps, setManualSteps] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  const userId = user?.id || 'current-user';
  const stepsHook = useSteps(userId);

  const currentSteps = state.steps?.steps || 0;
  const targetSteps = state.goals.dailySteps;
  const progress = (currentSteps / targetSteps) * 100;
  const caloriesBurned = Math.round(currentSteps * 0.04);
  const distanceWalked = Math.round(currentSteps * 0.0008 * 100) / 100;

  useEffect(() => {
    loadWeeklyData();
  }, []);

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

  const handleUpdateSteps = async () => {
    const steps = parseInt(manualSteps);
    if (isNaN(steps) || steps < 0) {
      Alert.alert('Error', 'Please enter a valid number of steps');
      return;
    }

    try {
      await updateSteps(steps);
      setManualSteps('');
      Alert.alert('Success', 'Steps updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update steps');
    }
  };

  const addSteps = async (amount: number) => {
    try {
      await updateSteps(currentSteps + amount);
    } catch (error) {
      Alert.alert('Error', 'Failed to add steps');
    }
  };

  const CircularProgress = ({ progress, size = 200 }: any) => {
    const radius = size / 2 - 10;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={[styles.circularProgress, { width: size, height: size }]}>
        <View style={styles.progressCircle}>
          <View
            style={[
              styles.progressFill,
              {
                width: size - strokeWidth,
                height: size - strokeWidth,
                borderRadius: (size - strokeWidth) / 2,
                borderWidth: strokeWidth,
                borderColor: '#e0e0e0',
              },
            ]}
          >
            <View
              style={[
                styles.progressActive,
                {
                  width: size - strokeWidth,
                  height: size - strokeWidth,
                  borderRadius: (size - strokeWidth) / 2,
                  borderWidth: strokeWidth,
                  borderColor: '#007AFF',
                  borderTopColor: 'transparent',
                  borderRightColor: 'transparent',
                  transform: [{ rotate: `${(progress / 100) * 360}deg` }],
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.progressContent}>
          <Text style={styles.stepsNumber}>{currentSteps.toLocaleString()}</Text>
          <Text style={styles.stepsLabel}>steps</Text>
          <Text style={styles.targetLabel}>of {targetSteps.toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Steps Today</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
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

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Add</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => addSteps(1000)}
          >
            <Text style={styles.quickActionText}>+1,000</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => addSteps(2500)}
          >
            <Text style={styles.quickActionText}>+2,500</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => addSteps(5000)}
          >
            <Text style={styles.quickActionText}>+5,000</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => addSteps(10000)}
          >
            <Text style={styles.quickActionText}>+10,000</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.manualInputContainer}>
        <Text style={styles.sectionTitle}>Manual Entry</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter total steps"
            value={manualSteps}
            onChangeText={setManualSteps}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateSteps}
          >
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableOpacity>
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
  progressCircle: {
    position: 'absolute',
  },
  progressFill: {
    position: 'absolute',
  },
  progressActive: {
    position: 'absolute',
  },
  progressContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  stepsLabel: {
    fontSize: 16,
    color: '#666',
  },
  targetLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
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
  quickActionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  manualInputContainer: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginRight: 12,
  },
  updateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
});

export default StepsScreen;