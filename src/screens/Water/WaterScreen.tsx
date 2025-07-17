import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFirebaseFitness } from '../../context/FirebaseFitnessContext';

const WaterScreen: React.FC = () => {
  const { state, addWaterIntake } = useFirebaseFitness();
  const [customAmount, setCustomAmount] = useState('');

  const currentWater = state.water?.amount || 0;
  const targetWater = state.goals.dailyWater;
  const progress = (currentWater / targetWater) * 100;
  const remainingWater = Math.max(0, targetWater - currentWater);

  const presetAmounts = [250, 500, 750, 1000];

  const handleAddWater = async (amount: number) => {
    try {
      await addWaterIntake(amount);
      if (amount === parseInt(customAmount)) {
        setCustomAmount('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add water intake');
    }
  };

  const handleCustomAmount = async () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    await handleAddWater(amount);
  };

  const WaterGlass = ({ progress }: { progress: number }) => (
    <View style={styles.waterGlass}>
      <View
        style={[
          styles.waterLevel,
          {
            height: `${Math.min(progress, 100)}%`,
            backgroundColor: progress >= 100 ? '#4ECDC4' : '#87CEEB',
          },
        ]}
      />
      <View style={styles.glassContent}>
        <Text style={styles.waterAmount}>{currentWater}</Text>
        <Text style={styles.waterUnit}>ml</Text>
      </View>
    </View>
  );

  const renderWaterEntry = ({ item }: { item: any }) => (
    <View style={styles.entryItem}>
      <View style={styles.entryInfo}>
        <Text style={styles.entryAmount}>{item.amount}ml</Text>
        <Text style={styles.entryTime}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <Ionicons name="water" size={20} color="#4ECDC4" />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Water Intake</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.progressContainer}>
        <WaterGlass progress={progress} />
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {currentWater}ml / {targetWater}ml
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round(progress)}% Complete
          </Text>
          {remainingWater > 0 && (
            <Text style={styles.remainingText}>
              {remainingWater}ml remaining
            </Text>
          )}
        </View>
      </View>

      <View style={styles.presetsContainer}>
        <Text style={styles.sectionTitle}>Quick Add</Text>
        <View style={styles.presetsGrid}>
          {presetAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.presetButton}
              onPress={() => handleAddWater(amount)}
            >
              <Ionicons name="water" size={24} color="#4ECDC4" />
              <Text style={styles.presetText}>{amount}ml</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.customContainer}>
        <Text style={styles.sectionTitle}>Custom Amount</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter amount in ml"
            value={customAmount}
            onChangeText={setCustomAmount}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCustomAmount}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Today's Log</Text>
        {state.water?.entries && state.water.entries.length > 0 ? (
          <FlatList
            data={state.water.entries}
            renderItem={renderWaterEntry}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            style={styles.entriesList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="water-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No water logged yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start tracking your hydration!
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
    backgroundColor: '#4ECDC4',
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
  waterGlass: {
    width: 120,
    height: 160,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterLevel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  glassContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  waterAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  waterUnit: {
    fontSize: 14,
    color: '#666',
  },
  progressInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    color: '#4ECDC4',
    marginTop: 4,
  },
  remainingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  presetsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetButton: {
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
  presetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  customContainer: {
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
  addButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    padding: 20,
  },
  entriesList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  entryInfo: {
    flex: 1,
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  entryTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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

export default WaterScreen;