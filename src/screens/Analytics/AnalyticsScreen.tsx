import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFirebaseAuth } from '../../context/FirebaseAuthContext';
import { useFirebaseFitness } from '../../context/FirebaseFitnessContext';
import { useSteps } from '../../hooks/useSteps';
import { useWater } from '../../hooks/useWater';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useWeight } from '../../hooks/useWeight';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import ProgressChart from '../../components/charts/ProgressChart';

const AnalyticsScreen: React.FC = () => {
  const { user } = useFirebaseAuth();
  const { state } = useFirebaseFitness();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  
  const userId = user?.id || 'current-user';
  const stepsHook = useSteps(userId);
  const waterHook = useWater(userId);
  const workoutsHook = useWorkouts(userId);
  const weightHook = useWeight(userId);

  const [weeklySteps, setWeeklySteps] = useState<any[]>([]);
  const [weeklyWater, setWeeklyWater] = useState<any[]>([]);
  const [workoutStats, setWorkoutStats] = useState<any>(null);
  const [weightTrend, setWeightTrend] = useState<any[]>([]);

  const loadAnalyticsData = async () => {
    try {
      setRefreshing(true);
      
      if (selectedPeriod === 'week') {
        const [steps, water, weightData] = await Promise.all([
          stepsHook.getWeeklySteps(),
          waterHook.getWeeklyWater(),
          weightHook.getWeightTrend(7),
        ]);
        
        setWeeklySteps(steps);
        setWeeklyWater(water);
        setWeightTrend(weightData);
      } else {
        const [steps, weightData] = await Promise.all([
          stepsHook.getMonthlySteps(),
          weightHook.getWeightTrend(30),
        ]);
        
        setWeeklySteps(steps);
        setWeightTrend(weightData);
      }
      
      const stats = workoutsHook.getWorkoutStats();
      setWorkoutStats(stats);
    } catch (error) {
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const getStepsChartData = () => {
    if (!weeklySteps.length) return { labels: [], datasets: [{ data: [] }] };
    
    const labels = weeklySteps.map((data, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (weeklySteps.length - 1 - index));
      return selectedPeriod === 'week' 
        ? date.toLocaleDateString('en', { weekday: 'short' })
        : date.getDate().toString();
    });
    
    return {
      labels,
      datasets: [{
        data: weeklySteps.map(data => data.steps || 0),
        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const getWaterChartData = () => {
    if (!weeklyWater.length) return { labels: [], datasets: [{ data: [] }] };
    
    const labels = weeklyWater.map((data, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (weeklyWater.length - 1 - index));
      return date.toLocaleDateString('en', { weekday: 'short' });
    });
    
    return {
      labels,
      datasets: [{
        data: weeklyWater.map(data => data.amount || 0),
        color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
      }],
    };
  };

  const getWeightChartData = () => {
    if (!weightTrend.length) return { labels: [], datasets: [{ data: [] }] };
    
    const labels = weightTrend.map(entry => {
      const date = new Date(entry.date);
      return selectedPeriod === 'week'
        ? date.toLocaleDateString('en', { weekday: 'short' })
        : `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    return {
      labels,
      datasets: [{
        data: weightTrend.map(entry => entry.weight),
        color: (opacity = 1) => `rgba(150, 206, 180, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const getProgressData = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysSteps = weeklySteps.find(s => s.date === today);
    const todaysWater = weeklyWater.find(w => w.date === today);
    
    const stepsProgress = todaysSteps ? todaysSteps.steps / state.goals.dailySteps : 0;
    const waterProgress = todaysWater ? todaysWater.amount / state.goals.dailyWater : 0;
    const workoutProgress = workoutStats ? workoutStats.weeklyCount / state.goals.weeklyWorkouts : 0;
    
    return {
      labels: ['Steps', 'Water', 'Workouts'],
      data: [
        Math.min(stepsProgress, 1),
        Math.min(waterProgress, 1),
        Math.min(workoutProgress, 1),
      ],
    };
  };

  const getWorkoutTypesData = () => {
    if (!workoutsHook.workouts.length) return { labels: [], datasets: [{ data: [] }] };
    
    const workoutTypes = ['cardio', 'strength', 'flexibility', 'sports'];
    const typeCounts = workoutTypes.map(type => 
      workoutsHook.getWorkoutsByType(type as any).length
    );
    
    return {
      labels: ['Cardio', 'Strength', 'Flexibility', 'Sports'],
      datasets: [{
        data: typeCounts,
        color: (opacity = 1) => `rgba(255, 160, 122, ${opacity})`,
      }],
    };
  };

  const StatCard = ({ icon, title, value, subtitle, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadAnalyticsData} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.activePeriod]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'week' && styles.activePeriodText]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.activePeriod]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'month' && styles.activePeriodText]}>
              Month
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          icon="trophy"
          title="Total Workouts"
          value={workoutStats?.totalWorkouts || 0}
          subtitle="All time"
          color="#FFD93D"
        />
        <StatCard
          icon="flame"
          title="Calories Burned"
          value={workoutStats?.weeklyCalories || 0}
          subtitle="This week"
          color="#FF6B6B"
        />
        <StatCard
          icon="time"
          title="Workout Time"
          value={`${workoutStats?.weeklyDuration || 0}m`}
          subtitle="This week"
          color="#45B7D1"
        />
        <StatCard
          icon="trending-up"
          title="Weight Change"
          value={`${weightHook.getWeightChange(7).toFixed(1)}kg`}
          subtitle="Last 7 days"
          color="#96CEB4"
        />
      </View>

      <ProgressChart
        data={getProgressData()}
        title="Today's Progress"
      />

      <LineChart
        data={getStepsChartData()}
        title={`Steps - ${selectedPeriod === 'week' ? 'This Week' : 'This Month'}`}
        yAxisSuffix=""
        color={(opacity) => `rgba(255, 107, 107, ${opacity})`}
      />

      {selectedPeriod === 'week' && (
        <BarChart
          data={getWaterChartData()}
          title="Water Intake - This Week"
          yAxisSuffix="ml"
          color={(opacity) => `rgba(78, 205, 196, ${opacity})`}
        />
      )}

      {weightTrend.length > 0 && (
        <LineChart
          data={getWeightChartData()}
          title={`Weight Trend - ${selectedPeriod === 'week' ? 'Last 7 Days' : 'Last 30 Days'}`}
          yAxisSuffix="kg"
          color={(opacity) => `rgba(150, 206, 180, ${opacity})`}
        />
      )}

      <BarChart
        data={getWorkoutTypesData()}
        title="Workout Types Distribution"
        yAxisSuffix=""
        color={(opacity) => `rgba(255, 160, 122, ${opacity})`}
      />
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activePeriod: {
    backgroundColor: 'white',
  },
  periodText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  activePeriodText: {
    color: '#007AFF',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
});

export default AnalyticsScreen;