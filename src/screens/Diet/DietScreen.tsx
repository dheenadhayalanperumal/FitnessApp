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

const DietScreen: React.FC = () => {
  const { state, addMeal } = useFirebaseFitness();
  const [modalVisible, setModalVisible] = useState(false);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');

  const currentCalories = state.diet?.totalCalories || 0;
  const targetCalories = state.goals.dailyCalories;
  const progress = (currentCalories / targetCalories) * 100;
  const remainingCalories = Math.max(0, targetCalories - currentCalories);

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: 'sunny', color: '#FFD93D' },
    { key: 'lunch', label: 'Lunch', icon: 'restaurant', color: '#FF6B6B' },
    { key: 'dinner', label: 'Dinner', icon: 'moon', color: '#4ECDC4' },
    { key: 'snack', label: 'Snack', icon: 'fast-food', color: '#45B7D1' },
  ];

  const handleAddMeal = async () => {
    if (!mealName || !calories) {
      Alert.alert('Error', 'Please enter meal name and calories');
      return;
    }

    const meal = {
      name: mealName,
      type: selectedMealType,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      timestamp: new Date(),
    };

    try {
      await addMeal(meal);
      setMealName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setModalVisible(false);
      Alert.alert('Success', 'Meal added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add meal');
    }
  };

  const getMealsByType = (type: string) => {
    return state.diet?.meals?.filter(meal => meal.type === type) || [];
  };

  const MealTypeCard = ({ type, label, icon, color }: any) => {
    const meals = getMealsByType(type);
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

    return (
      <View style={[styles.mealTypeCard, { borderLeftColor: color }]}>
        <View style={styles.mealTypeHeader}>
          <View style={styles.mealTypeInfo}>
            <Ionicons name={icon} size={20} color={color} />
            <Text style={styles.mealTypeLabel}>{label}</Text>
          </View>
          <Text style={styles.mealTypeCalories}>{totalCalories} cal</Text>
        </View>
        {meals.length > 0 ? (
          meals.map((meal) => (
            <View key={meal.id} style={styles.mealItem}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealCalories}>{meal.calories} cal</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noMealsText}>No meals logged</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Diet Tracker</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.caloriesCard}>
          <Text style={styles.caloriesNumber}>{currentCalories}</Text>
          <Text style={styles.caloriesLabel}>calories consumed</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progress, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.targetText}>
            {remainingCalories} calories remaining of {targetCalories}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.mealsContainer}>
        <View style={styles.mealsHeader}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {mealTypes.map((type) => (
          <MealTypeCard
            key={type.key}
            type={type.key}
            label={type.label}
            icon={type.icon}
            color={type.color}
          />
        ))}
      </ScrollView>

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
            <Text style={styles.modalTitle}>Add Meal</Text>
            <TouchableOpacity onPress={handleAddMeal}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.mealTypeSelector}>
              <Text style={styles.inputLabel}>Meal Type</Text>
              <View style={styles.mealTypeButtons}>
                {mealTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.mealTypeButton,
                      selectedMealType === type.key && styles.selectedMealType,
                    ]}
                    onPress={() => setSelectedMealType(type.key as any)}
                  >
                    <Text
                      style={[
                        styles.mealTypeButtonText,
                        selectedMealType === type.key && styles.selectedMealTypeText,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Meal Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Chicken Salad"
                value={mealName}
                onChangeText={setMealName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Calories</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 350"
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.macroInputs}>
              <View style={styles.macroInput}>
                <Text style={styles.inputLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={styles.inputLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={styles.inputLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="numeric"
                />
              </View>
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
    backgroundColor: '#45B7D1',
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
  summaryContainer: {
    padding: 20,
  },
  caloriesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caloriesNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#45B7D1',
    borderRadius: 4,
  },
  targetText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  mealsContainer: {
    flex: 1,
    padding: 20,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#45B7D1',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTypeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  mealTypeCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  mealName: {
    fontSize: 14,
    color: '#333',
  },
  mealCalories: {
    fontSize: 12,
    color: '#666',
  },
  noMealsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
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
    color: '#45B7D1',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  mealTypeSelector: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedMealType: {
    backgroundColor: '#45B7D1',
  },
  mealTypeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedMealTypeText: {
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
  macroInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  macroInput: {
    flex: 1,
  },
});

export default DietScreen;