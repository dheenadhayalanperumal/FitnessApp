import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFirebaseFitness } from '../../context/FirebaseFitnessContext';

const SettingsScreen: React.FC = () => {
  const { state } = useFirebaseFitness();
  const [notifications, setNotifications] = useState(true);
  const [dataSync, setDataSync] = useState(true);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const SettingsItem = ({ icon, title, value, onPress, showArrow = true }: any) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <Ionicons name={icon} size={24} color="#007AFF" />
        <Text style={styles.settingsItemTitle}>{title}</Text>
      </View>
      <View style={styles.settingsItemRight}>
        <Text style={styles.settingsItemValue}>{value}</Text>
        {showArrow && <Ionicons name="chevron-forward" size={16} color="#ccc" />}
      </View>
    </TouchableOpacity>
  );

  const SettingsToggle = ({ icon, title, value, onValueChange }: any) => (
    <View style={styles.settingsItem}>
      <View style={styles.settingsItemLeft}>
        <Ionicons name={icon} size={24} color="#007AFF" />
        <Text style={styles.settingsItemTitle}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: '#007AFF' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const handleUnitsChange = () => {
    Alert.alert(
      'Units',
      'Choose your preferred units',
      [
        { text: 'Metric (kg, km)', onPress: () => setUnits('metric') },
        { text: 'Imperial (lbs, miles)', onPress: () => setUnits('imperial') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Theme',
      'Choose your preferred theme',
      [
        { text: 'Light', onPress: () => setTheme('light') },
        { text: 'Dark', onPress: () => setTheme('dark') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingsList}>
          <SettingsToggle
            icon="notifications-outline"
            title="Notifications"
            value={notifications}
            onValueChange={setNotifications}
          />
          <SettingsToggle
            icon="cloud-outline"
            title="Data Sync"
            value={dataSync}
            onValueChange={setDataSync}
          />
          <SettingsItem
            icon="globe-outline"
            title="Units"
            value={units === 'metric' ? 'Metric' : 'Imperial'}
            onPress={handleUnitsChange}
          />
          <SettingsItem
            icon="color-palette-outline"
            title="Theme"
            value={theme === 'light' ? 'Light' : 'Dark'}
            onPress={handleThemeChange}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goals</Text>
        <View style={styles.settingsList}>
          <SettingsItem
            icon="walk-outline"
            title="Daily Steps Goal"
            value={state.goals.dailySteps.toLocaleString()}
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <SettingsItem
            icon="water-outline"
            title="Daily Water Goal"
            value={`${state.goals.dailyWater}ml`}
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <SettingsItem
            icon="restaurant-outline"
            title="Daily Calories Goal"
            value={state.goals.dailyCalories.toString()}
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <SettingsItem
            icon="fitness-outline"
            title="Weekly Workouts Goal"
            value={state.goals.weeklyWorkouts.toString()}
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <SettingsItem
            icon="scale-outline"
            title="Target Weight"
            value={`${state.goals.targetWeight}kg`}
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        <View style={styles.settingsList}>
          <SettingsItem
            icon="lock-closed-outline"
            title="Privacy Settings"
            value="Manage"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <SettingsItem
            icon="shield-outline"
            title="Data Protection"
            value="View"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <SettingsItem
            icon="eye-outline"
            title="Data Usage"
            value="Monitor"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <View style={styles.settingsList}>
          <SettingsItem
            icon="download-outline"
            title="Export Data"
            value="Download"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <SettingsItem
            icon="cloud-upload-outline"
            title="Backup Data"
            value="Sync"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <SettingsItem
            icon="refresh-outline"
            title="Reset Data"
            value="Clear All"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.settingsList}>
          <SettingsItem
            icon="help-circle-outline"
            title="Help & FAQ"
            value="Get Help"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <SettingsItem
            icon="mail-outline"
            title="Contact Support"
            value="Email"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <SettingsItem
            icon="star-outline"
            title="Rate App"
            value="Review"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
          <SettingsItem
            icon="information-circle-outline"
            title="About"
            value="Version 1.0.0"
            onPress={() => Alert.alert('Feature', 'Coming soon!')}
          />
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemValue: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
});

export default SettingsScreen;