#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Firestore Rules Deployment Script');
console.log('=====================================');

// Check if firestore.rules exists
const rulesPath = path.join(__dirname, 'firestore.rules');
if (!fs.existsSync(rulesPath)) {
  console.error('❌ firestore.rules file not found');
  process.exit(1);
}

console.log('✅ Found firestore.rules file');

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI is installed');
} catch (error) {
  console.error('❌ Firebase CLI not found. Installing...');
  try {
    execSync('npm install -g firebase-tools', { stdio: 'inherit' });
    console.log('✅ Firebase CLI installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install Firebase CLI');
    console.error('Please install manually: npm install -g firebase-tools');
    process.exit(1);
  }
}

// Check if user is logged in
try {
  const user = execSync('firebase auth:export --help', { stdio: 'pipe' }).toString();
  console.log('✅ User is authenticated with Firebase CLI');
} catch (error) {
  console.error('❌ Not logged in to Firebase CLI');
  console.log('Please run: firebase login');
  process.exit(1);
}

// Check if project is initialized
const firebaseConfigPath = path.join(__dirname, 'firebase.json');
if (!fs.existsSync(firebaseConfigPath)) {
  console.log('⚠️  Firebase project not initialized. Initializing...');
  try {
    execSync('firebase init firestore', { stdio: 'inherit' });
    console.log('✅ Firebase project initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase project');
    process.exit(1);
  }
}

// Deploy the rules
try {
  console.log('🚀 Deploying Firestore rules...');
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('✅ Firestore rules deployed successfully!');
  
  console.log('\n🎉 Deployment Complete!');
  console.log('You can verify the rules in the Firebase Console:');
  console.log('https://console.firebase.google.com/project/fitnessapp-85a64/firestore/rules');
  
} catch (error) {
  console.error('❌ Failed to deploy Firestore rules');
  console.error('Error:', error.message);
  
  console.log('\n📋 Manual deployment steps:');
  console.log('1. Run: firebase login');
  console.log('2. Run: firebase init firestore');
  console.log('3. Run: firebase deploy --only firestore:rules');
  
  process.exit(1);
}