import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFirebaseAuth } from '../../context/FirebaseAuthContext';
import { DataMigrationService } from '../../services/dataMigrationService';

const MigrationScreen: React.FC = () => {
  const { user } = useFirebaseAuth();
  const [migrationStatus, setMigrationStatus] = useState<{
    needsMigration: boolean;
    localDataExists: boolean;
    firebaseDataExists: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    migratedItems: string[];
    errors: string[];
  } | null>(null);

  useEffect(() => {
    checkMigrationStatus();
  }, [user]);

  const checkMigrationStatus = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const status = await DataMigrationService.checkMigrationStatus(user.id);
      setMigrationStatus(status);
    } catch (error) {
      Alert.alert('Error', 'Failed to check migration status');
    } finally {
      setIsLoading(false);
    }
  };

  const startMigration = async () => {
    if (!user) return;

    Alert.alert(
      'Migrate Data',
      'This will move your local fitness data to the cloud. This process may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Migration',
          onPress: performMigration,
        },
      ]
    );
  };

  const performMigration = async () => {
    if (!user) return;

    try {
      setIsMigrating(true);
      setMigrationProgress(0);
      setCurrentStep('Starting migration...');

      const result = await DataMigrationService.performMigrationWithProgress(
        user.id,
        (step, progress) => {
          setCurrentStep(step);
          setMigrationProgress(progress);
        }
      );

      setMigrationResult(result);

      if (result.success) {
        Alert.alert(
          'Migration Complete',
          `Successfully migrated ${result.migratedItems.length} data types to the cloud.`,
          [{ text: 'OK', onPress: checkMigrationStatus }]
        );
      } else {
        Alert.alert(
          'Migration Failed',
          `Migration completed with ${result.errors.length} errors. Some data may not have been transferred.`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Migration failed unexpectedly');
    } finally {
      setIsMigrating(false);
      setMigrationProgress(0);
      setCurrentStep('');
    }
  };

  const skipMigration = () => {
    Alert.alert(
      'Skip Migration',
      'Are you sure you want to skip data migration? Your local data will remain on this device only.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            // Navigate away or mark migration as skipped
            Alert.alert('Migration Skipped', 'You can migrate your data later from the Settings screen.');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking your data...</Text>
      </View>
    );
  }

  if (!migrationStatus) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to check migration status</Text>
        <TouchableOpacity style={styles.retryButton} onPress={checkMigrationStatus}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cloud-upload-outline" size={64} color="#007AFF" />
        <Text style={styles.title}>Data Migration</Text>
        <Text style={styles.subtitle}>
          Sync your fitness data to the cloud for backup and cross-device access
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <Ionicons 
            name={migrationStatus.localDataExists ? 'checkmark-circle' : 'close-circle'} 
            size={24} 
            color={migrationStatus.localDataExists ? '#4ECDC4' : '#FF6B6B'} 
          />
          <Text style={styles.statusText}>
            Local Data: {migrationStatus.localDataExists ? 'Found' : 'None'}
          </Text>
        </View>

        <View style={styles.statusItem}>
          <Ionicons 
            name={migrationStatus.firebaseDataExists ? 'checkmark-circle' : 'close-circle'} 
            size={24} 
            color={migrationStatus.firebaseDataExists ? '#4ECDC4' : '#FF6B6B'} 
          />
          <Text style={styles.statusText}>
            Cloud Data: {migrationStatus.firebaseDataExists ? 'Found' : 'None'}
          </Text>
        </View>
      </View>

      {migrationStatus.needsMigration ? (
        <View style={styles.migrationContainer}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <Text style={styles.infoText}>
              We found fitness data on your device that can be backed up to the cloud. 
              This will ensure your data is safe and synced across all your devices.
            </Text>
          </View>

          {isMigrating ? (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{currentStep}</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${migrationProgress}%` }]} 
                />
              </View>
              <Text style={styles.progressPercentage}>{Math.round(migrationProgress)}%</Text>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.migrateButton} 
                onPress={startMigration}
                disabled={isMigrating}
              >
                <Text style={styles.migrateButtonText}>Start Migration</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={skipMigration}
                disabled={isMigrating}
              >
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.completedContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#4ECDC4" />
          <Text style={styles.completedTitle}>
            {migrationStatus.firebaseDataExists ? 'Data Synced' : 'No Migration Needed'}
          </Text>
          <Text style={styles.completedText}>
            {migrationStatus.firebaseDataExists 
              ? 'Your fitness data is safely stored in the cloud'
              : 'No local data found to migrate'
            }
          </Text>
        </View>
      )}

      {migrationResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Migration Results</Text>
          
          {migrationResult.migratedItems.length > 0 && (
            <View style={styles.successSection}>
              <Text style={styles.successTitle}>Successfully Migrated:</Text>
              {migrationResult.migratedItems.map((item, index) => (
                <Text key={index} style={styles.successItem}>✓ {item}</Text>
              ))}
            </View>
          )}

          {migrationResult.errors.length > 0 && (
            <View style={styles.errorSection}>
              <Text style={styles.errorTitle}>Errors:</Text>
              {migrationResult.errors.map((error, index) => (
                <Text key={index} style={styles.errorItem}>✗ {error}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  statusContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  migrationContainer: {
    margin: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 12,
    lineHeight: 20,
  },
  progressContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  migrateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  migrateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  completedContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  completedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  resultContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  successSection: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
    marginBottom: 8,
  },
  successItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  errorSection: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  errorItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MigrationScreen;