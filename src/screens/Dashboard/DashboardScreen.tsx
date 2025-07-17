import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFirebaseAuth } from '../../context/FirebaseAuthContext';
import { useFirebaseFitness } from '../../context/FirebaseFitnessContext';

const DashboardScreen: React.FC = () => {
  const { user } = useFirebaseAuth();
  const { state, loadTodaysData, getDashboardData } = useFirebaseFitness();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user) {
      loadTodaysData(user.id);
    }
  }, [user]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (user) {
      await loadTodaysData(user.id);
    }
    setRefreshing(false);
  }, [user]);

  const dashboardData = getDashboardData();

  const StatsCard = ({ title, value, unit, icon, color, progress }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <View style={styles.statInfo}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>
            {value} <Text style={styles.statUnit}>{unit}</Text>
          </Text>
        </View>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progress, 100)}%`, backgroundColor: color },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );

  const QuickActionCard = ({ title, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <Ionicons name={icon} size={32} color={color} />
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Good Morning!</Text>
        <Text style={styles.userName}>{user?.name}</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatsCard
          title="Steps"
          value={dashboardData.steps?.steps || 0}
          unit={`/ ${state.goals.dailySteps}`}
          icon="walk"
          color="#FF6B6B"
          progress={((dashboardData.steps?.steps || 0) / state.goals.dailySteps) * 100}
        />

        <StatsCard
          title="Water"
          value={dashboardData.water?.amount || 0}
          unit={`ml / ${state.goals.dailyWater}ml`}
          icon="water"
          color="#4ECDC4"
          progress={((dashboardData.water?.amount || 0) / state.goals.dailyWater) * 100}
        />

        <StatsCard
          title="Calories"
          value={dashboardData.diet?.totalCalories || 0}
          unit={`/ ${state.goals.dailyCalories}`}
          icon="restaurant"
          color="#45B7D1"
          progress={((dashboardData.diet?.totalCalories || 0) / state.goals.dailyCalories) * 100}
        />

        <StatsCard
          title="Weight"
          value={dashboardData.weight?.weight || 0}
          unit="kg"
          icon="scale"
          color="#96CEB4"
        />
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionCard
            title="Log Steps"
            icon="walk"
            color="#FF6B6B"
            onPress={() => {}}
          />
          <QuickActionCard
            title="Add Water"
            icon="water"
            color="#4ECDC4"
            onPress={() => {}}
          />
          <QuickActionCard
            title="Log Meal"
            icon="restaurant"
            color="#45B7D1"
            onPress={() => {}}
          />
          <QuickActionCard
            title="New Workout"
            icon="fitness"
            color="#FFA07A"
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.recentWorkoutsContainer}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        {dashboardData.recentWorkouts.length > 0 ? (
          dashboardData.recentWorkouts.map((workout) => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                <Text style={styles.workoutDate}>{workout.date}</Text>
              </View>
              <View style={styles.workoutStats}>
                <Text style={styles.workoutStat}>
                  {workout.duration} min • {workout.calories} cal
                </Text>
                <Text style={styles.workoutType}>{workout.type}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No workouts yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start your fitness journey today!
            </Text>
          </View>
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  statsContainer: {
    padding: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statUnit: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#666',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
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
  quickActionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  recentWorkoutsContainer: {
    padding: 20,
  },
  workoutCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  workoutDate: {
    fontSize: 12,
    color: '#666',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutStat: {
    fontSize: 14,
    color: '#666',
  },
  workoutType: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DashboardScreen;