# Fitness App - React Native

A comprehensive fitness tracking mobile application built with React Native and Expo, featuring all the essential tools for monitoring your health and fitness journey.

## Features

### 📱 Core Functionality
- **User Authentication**: Login and registration system
- **Dashboard**: Overview of daily fitness metrics
- **Steps Tracking**: Monitor daily steps with progress visualization
- **Water Intake**: Track hydration with customizable goals
- **Diet Tracking**: Log meals and monitor calorie intake
- **Weight Monitoring**: Record and track weight changes
- **Workout Logging**: Record various types of workouts
- **Profile Management**: User profile and settings

### 🎯 Key Features
- **Real-time Data Sync**: All data is stored locally using AsyncStorage
- **Progress Visualization**: Visual progress indicators for all metrics
- **Goal Setting**: Customizable daily and weekly goals
- **Responsive Design**: Optimized for both iOS and Android
- **Intuitive Navigation**: Bottom tabs with drawer navigation
- **Modern UI**: Clean, user-friendly interface

## Technology Stack

- **React Native**: 0.79.5
- **Expo**: ~53.0.17
- **TypeScript**: ~5.8.3
- **React Navigation**: 7.x
- **AsyncStorage**: For local data persistence
- **Expo Vector Icons**: For consistent iconography

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Expo CLI
- iOS Simulator (for iOS testing)
- Android Studio (for Android testing)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on device/simulator:
   ```bash
   npm run ios     # For iOS
   npm run android # For Android
   npm run web     # For web
   ```

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable components
│   ├── forms/           # Form components
│   ├── charts/          # Chart components
│   └── navigation/      # Navigation components
├── screens/
│   ├── Auth/            # Authentication screens
│   ├── Dashboard/       # Dashboard screen
│   ├── Steps/           # Steps tracking
│   ├── Water/           # Water intake
│   ├── Diet/            # Diet tracking
│   ├── Weight/          # Weight monitoring
│   ├── Workout/         # Workout logging
│   ├── Profile/         # User profile
│   └── Settings/        # App settings
├── context/
│   ├── AuthContext.tsx  # Authentication state
│   └── FitnessContext.tsx # Fitness data state
├── models/
│   ├── User.ts          # User data models
│   └── FitnessData.ts   # Fitness data models
├── types/
│   └── index.ts         # TypeScript definitions
├── hooks/               # Custom hooks
├── services/            # API services
├── utils/               # Utility functions
└── styles/              # Shared styles
```

## Features in Detail

### Authentication System
- Email/password login and registration
- Secure user session management
- Persistent authentication state

### Fitness Tracking
- **Steps**: Daily step counting with progress visualization
- **Water**: Hydration tracking with intake logging
- **Diet**: Meal logging with calorie and macro tracking
- **Weight**: Weight monitoring with trend analysis
- **Workouts**: Exercise logging with duration and type

### Data Management
- Local storage using AsyncStorage
- Real-time data synchronization
- Data persistence across app sessions

### Navigation
- Bottom tab navigation for main features
- Drawer navigation for profile and settings
- Smooth transitions and animations

## Contributing

This is a demonstration project based on an existing web application, converted to React Native. The app showcases modern React Native development practices and patterns.

## Future Enhancements

- Chart visualization for progress tracking
- Health app integration (Apple Health, Google Fit)
- Social features and sharing
- Advanced workout planning
- Nutrition database integration
- Wearable device sync

## License

This project is for educational and demonstration purposes.