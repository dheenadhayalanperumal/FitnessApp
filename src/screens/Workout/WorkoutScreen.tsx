import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFirebaseFitness } from '../../context/FirebaseFitnessContext';
import { useFirebaseAuth } from '../../context/FirebaseAuthContext';

const WorkoutScreen: React.FC = () => {
  const { state, addWorkout } = useFirebaseFitness();
  const { user } = useFirebaseAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutType, setWorkoutType] = useState<'cardio' | 'strength' | 'flexibility' | 'sports'>('cardio');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const workoutTypes = [
    { key: 'cardio', label: 'Cardio', icon: 'heart' as const, color: '#FF6B6B' },
    { key: 'strength', label: 'Strength', icon: 'barbell' as const, color: '#4ECDC4' },
    { key: 'flexibility', label: 'Flexibility', icon: 'body' as const, color: '#45B7D1' },
    { key: 'sports', label: 'Sports', icon: 'basketball' as const, color: '#FFA07A' },
  ];

  const handleAddWorkout = async () => {
    if (!workoutName || !duration) {
      Alert.alert('Error', 'Please enter workout name and duration');
      return;
    }

    const durationValue = parseInt(duration);
    if (isNaN(durationValue) || durationValue <= 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }

    const workout = {
      userId: user?.id || 'unknown',
      name: workoutName,
      type: workoutType,
      duration: durationValue,
      calories: Math.round(durationValue * (workoutType === 'cardio' ? 10 : workoutType === 'strength' ? 8 : 5)),
      exercises: [],
      date: new Date().toISOString().split('T')[0],
      notes,
    };

    try {
      await addWorkout(workout);
      setWorkoutName('');
      setDuration('');
      setNotes('');
      setModalVisible(false);
      Alert.alert('Success', 'Workout logged successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to log workout');
    }
  };

  const getWorkoutTypeInfo = (type: string) => {
    return workoutTypes.find(t => t.key === type) || workoutTypes[0];
  };

  const QuickWorkoutCard = ({ type, label, icon, color }: any) => (
    <TouchableOpacity
      style={styles.quickWorkoutCard}
      onPress={() => {
        setWorkoutType(type);
        setModalVisible(true);
      }}
    >
      <Ionicons name={icon} size={32} color={color} />
      <Text style={styles.quickWorkoutText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.quickStartContainer}>
        <Text style={styles.sectionTitle}>Quick Start</Text>
        <View style={styles.quickWorkoutGrid}>
          {workoutTypes.map((type) => (
            <QuickWorkoutCard
              key={type.key}
              type={type.key}
              label={type.label}
              icon={type.icon}
              color={type.color}
            />
          ))}
        </View>
      </View>

      <View style={styles.recentWorkoutsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.workoutsList}>
          {state.workouts.length > 0 ? (
            state.workouts.map((workout) => {
              const typeInfo = getWorkoutTypeInfo(workout.type);
              return (
                <View key={workout.id} style={styles.workoutCard}>
                  <View style={styles.workoutHeader}>
                    <View style={styles.workoutTitleContainer}>
                      <Ionicons name={typeInfo.icon} size={20} color={typeInfo.color} />
                      <Text style={styles.workoutName}>{workout.name}</Text>
                    </View>
                    <Text style={styles.workoutDate}>{workout.date}</Text>
                  </View>
                  <View style={styles.workoutStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="time" size={16} color="#666" />
                      <Text style={styles.statText}>{workout.duration} min</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="flame" size={16} color="#666" />
                      <Text style={styles.statText}>{workout.calories} cal</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.workoutType, { color: typeInfo.color }]}>
                        {typeInfo.label}
                      </Text>
                    </View>
                  </View>
                  {workout.notes && (
                    <Text style={styles.workoutNotes}>{workout.notes}</Text>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No workouts logged yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start your first workout today!
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Log Workout</Text>
            <TouchableOpacity onPress={handleAddWorkout}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.workoutTypeSelector}>
              <Text style={styles.inputLabel}>Workout Type</Text>
              <View style={styles.workoutTypeButtons}>
                {workoutTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.workoutTypeButton,
                      workoutType === type.key && styles.selectedWorkoutType,
                    ]}
                    onPress={() => setWorkoutType(type.key as any)}
                  >
                    <Ionicons name={type.icon} size={20} color={workoutType === type.key ? 'white' : type.color} />
                    <Text
                      style={[
                        styles.workoutTypeButtonText,
                        workoutType === type.key && styles.selectedWorkoutTypeText,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Workout Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Morning Run"
                value={workoutName}
                onChangeText={setWorkoutName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 30"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Any notes about your workout..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FFA07A',
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
  quickStartContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickWorkoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickWorkoutCard: {
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
  quickWorkoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  recentWorkoutsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#FFA07A',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutsList: {
    flex: 1,
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
    marginBottom: 12,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
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
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  workoutType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  workoutNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    color: '#FFA07A',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  workoutTypeSelector: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  workoutTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  workoutTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedWorkoutType: {
    backgroundColor: '#FFA07A',
  },
  workoutTypeButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  selectedWorkoutTypeText: {
    color: 'white',
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default WorkoutScreen;