import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFirebaseAuth } from '../../context/FirebaseAuthContext';
import { useFirebaseFitness } from '../../context/FirebaseFitnessContext';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useFirebaseAuth();
  const { state } = useFirebaseFitness();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const ProfileItem = ({ icon, title, value, onPress }: any) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemLeft}>
        <Ionicons name={icon} size={24} color="#007AFF" />
        <Text style={styles.profileItemTitle}>{title}</Text>
      </View>
      <View style={styles.profileItemRight}>
        <Text style={styles.profileItemValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={48} color="white" />
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.goalsContainer}>
        <Text style={styles.sectionTitle}>Daily Goals</Text>
        <View style={styles.goalsList}>
          <View style={styles.goalItem}>
            <Ionicons name="walk" size={20} color="#FF6B6B" />
            <Text style={styles.goalLabel}>Steps</Text>
            <Text style={styles.goalValue}>{state.goals.dailySteps.toLocaleString()}</Text>
          </View>
          <View style={styles.goalItem}>
            <Ionicons name="water" size={20} color="#4ECDC4" />
            <Text style={styles.goalLabel}>Water</Text>
            <Text style={styles.goalValue}>{state.goals.dailyWater}ml</Text>
          </View>
          <View style={styles.goalItem}>
            <Ionicons name="restaurant" size={20} color="#45B7D1" />
            <Text style={styles.goalLabel}>Calories</Text>
            <Text style={styles.goalValue}>{state.goals.dailyCalories}</Text>
          </View>
          <View style={styles.goalItem}>
            <Ionicons name="fitness" size={20} color="#FFA07A" />
            <Text style={styles.goalLabel}>Workouts/Week</Text>
            <Text style={styles.goalValue}>{state.goals.weeklyWorkouts}</Text>
          </View>
        </View>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.profileList}>
          <ProfileItem
            icon="person-outline"
            title="Personal Information"
            value="Edit"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <ProfileItem
            icon="scale-outline"
            title="Target Weight"
            value={`${state.goals.targetWeight}kg`}
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <ProfileItem
            icon="trophy-outline"
            title="Goals & Targets"
            value="Manage"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <ProfileItem
            icon="notifications-outline"
            title="Notifications"
            value="Settings"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
        </View>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.profileList}>
          <ProfileItem
            icon="download-outline"
            title="Export Data"
            value="Download"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <ProfileItem
            icon="cloud-upload-outline"
            title="Backup Data"
            value="Sync"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <ProfileItem
            icon="trash-outline"
            title="Clear Data"
            value="Reset"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
        </View>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.profileList}>
          <ProfileItem
            icon="help-circle-outline"
            title="Help & Support"
            value="Contact"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <ProfileItem
            icon="document-text-outline"
            title="Privacy Policy"
            value="View"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <ProfileItem
            icon="information-circle-outline"
            title="About"
            value="Version 1.0"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
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
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  goalsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  goalsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  goalLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  profileSection: {
    padding: 20,
  },
  profileList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  profileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileItemValue: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    padding: 16,
    margin: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ProfileScreen;