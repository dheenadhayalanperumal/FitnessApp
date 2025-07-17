import React, { useState } from 'react';
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

const WeightScreen: React.FC = () => {
  const { state, addWeightEntry } = useFirebaseFitness();
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const currentWeight = state.weight?.weight || 0;
  const targetWeight = state.goals.targetWeight;
  const difference = currentWeight - targetWeight;

  const handleAddWeight = async () => {
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    try {
      await addWeightEntry(weightValue, notes);
      setWeight('');
      setNotes('');
      Alert.alert('Success', 'Weight recorded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to record weight');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weight Tracker</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.currentWeightContainer}>
        <View style={styles.weightCard}>
          <Text style={styles.currentWeight}>{currentWeight}</Text>
          <Text style={styles.weightUnit}>kg</Text>
          <Text style={styles.weightLabel}>Current Weight</Text>
          
          <View style={styles.targetInfo}>
            <Text style={styles.targetLabel}>Target: {targetWeight}kg</Text>
            {difference !== 0 && (
              <Text style={[
                styles.differenceText,
                { color: difference > 0 ? '#FF6B6B' : '#4ECDC4' }
              ]}>
                {difference > 0 ? '+' : ''}{difference.toFixed(1)}kg
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.sectionTitle}>Record Weight</Text>
        
        <View style={styles.weightInput}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your weight"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.notesInput}>
          <Text style={styles.inputLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesTextInput]}
            placeholder="Any notes about your weight..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={styles.recordButton}
          onPress={handleAddWeight}
        >
          <Text style={styles.recordButtonText}>Record Weight</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.sectionTitle}>Tips</Text>
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.tipText}>
            Weigh yourself at the same time each day for consistency
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Ionicons name="time" size={20} color="#007AFF" />
          <Text style={styles.tipText}>
            Best time is in the morning after using the bathroom
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Ionicons name="trending-up" size={20} color="#007AFF" />
          <Text style={styles.tipText}>
            Focus on trends rather than daily fluctuations
          </Text>
        </View>
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
    backgroundColor: '#96CEB4',
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
  currentWeightContainer: {
    padding: 20,
  },
  weightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentWeight: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  weightUnit: {
    fontSize: 18,
    color: '#666',
    marginTop: -8,
  },
  weightLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  targetInfo: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  targetLabel: {
    fontSize: 14,
    color: '#666',
  },
  differenceText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  inputContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  weightInput: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  notesInput: {
    marginBottom: 20,
  },
  notesTextInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  recordButton: {
    backgroundColor: '#96CEB4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  tipsContainer: {
    padding: 20,
  },
  tipCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
});

export default WeightScreen;