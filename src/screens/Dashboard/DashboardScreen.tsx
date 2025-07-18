import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
import { useFirebaseAuth } from '../../context/FirebaseAuthContext';
import { useFirebaseFitness } from '../../context/FirebaseFitnessContext';
import { useNativeStepCounter } from '../../hooks/useNativeStepCounter';

const { width } = Dimensions.get('window');

const DashboardScreen: React.FC = () => {
  const { user } = useFirebaseAuth();
  const { state, loadTodaysData, getDashboardData } = useFirebaseFitness();
  const [refreshing, setRefreshing] = React.useState(false);
  const nativeStepCounter = useNativeStepCounter();

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

  const StatsCard = ({ title, value, unit, icon, cardColor, progress }: any) => (
    <View style={[styles.statCard, { backgroundColor: cardColor }]}>
      <View style={styles.statHeader}>
        <View style={styles.statInfo}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>
            {value} <Text style={styles.statUnit}>{unit}</Text>
          </Text>
        </View>
        <Ionicons name={icon} size={28} color="rgba(255, 255, 255, 0.9)" />
      </View>
      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progress, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );

  const QuickActionCard = ({ title, icon, cardColor, onPress }: any) => (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.quickActionCard, { backgroundColor: cardColor }]}>
        <Ionicons name={icon} size={32} color="rgba(255, 255, 255, 0.9)" />
        <Text style={styles.quickActionText}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.backgroundGradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Good Morning!</Text>
                <Text style={styles.userName}>{user?.name}</Text>
              </View>
              <TouchableOpacity style={styles.profileButton}>
                <Ionicons name="person-circle" size={40} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <StatsCard
              title="Steps"
              value={nativeStepCounter.steps || 0}
              unit={`/ ${state.goals.dailySteps}`}
              icon="walk"
              cardColor="#FF6B6B"
              progress={((nativeStepCounter.steps || 0) / state.goals.dailySteps) * 100}
            />

            <StatsCard
              title="Water"
              value={dashboardData.water?.amount || 0}
              unit={`ml / ${state.goals.dailyWater}ml`}
              icon="water"
              cardColor="#4ECDC4"
              progress={((dashboardData.water?.amount || 0) / state.goals.dailyWater) * 100}
            />

            <StatsCard
              title="Calories"
              value={dashboardData.diet?.totalCalories || 0}
              unit={`/ ${state.goals.dailyCalories}`}
              icon="restaurant"
              cardColor="#45B7D1"
              progress={((dashboardData.diet?.totalCalories || 0) / state.goals.dailyCalories) * 100}
            />

            <StatsCard
              title="Weight"
              value={dashboardData.weight?.weight || 0}
              unit="kg"
              icon="scale"
              cardColor="#96CEB4"
            />
          </View>

          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionCard
                title="Log Steps"
                icon="walk"
                cardColor="#FF6B6B"
                onPress={() => {}}
              />
              <QuickActionCard
                title="Add Water"
                icon="water"
                cardColor="#4ECDC4"
                onPress={() => {}}
              />
              <QuickActionCard
                title="Log Meal"
                icon="restaurant"
                cardColor="#45B7D1"
                onPress={() => {}}
              />
              <QuickActionCard
                title="New Workout"
                icon="fitness"
                cardColor="#FFA07A"
                onPress={() => {}}
              />
            </View>
          </View>

          <View style={styles.recentWorkoutsContainer}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
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
                <Ionicons name="fitness-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyStateText}>No workouts yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start your fitness journey today!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  profileButton: {
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 5,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  statCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  statUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    borderRadius: 16,
    padding: 20,
    width: (width - 50) / 2,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginTop: 8,
    textAlign: 'center',
  },
  recentWorkoutsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  workoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: 'white',
  },
  workoutDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutStat: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  workoutType: {
    fontSize: 12,
    color: '#4ECDC4',
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
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DashboardScreen;