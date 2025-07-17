import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useFirebaseAuth } from '../../context/FirebaseAuthContext';

// Auth Screens
import LoginScreen from '../../screens/Auth/LoginScreen';
import RegisterScreen from '../../screens/Auth/RegisterScreen';

// Main Screens
import DashboardScreen from '../../screens/Dashboard/DashboardScreen';
import StepsScreen from '../../screens/Steps/StepsScreen';
import WaterScreen from '../../screens/Water/WaterScreen';
import DietScreen from '../../screens/Diet/DietScreen';
import WeightScreen from '../../screens/Weight/WeightScreen';
import WorkoutScreen from '../../screens/Workout/WorkoutScreen';
import ProfileScreen from '../../screens/Profile/ProfileScreen';
import SettingsScreen from '../../screens/Settings/SettingsScreen';
import AnalyticsScreen from '../../screens/Analytics/AnalyticsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        switch (route.name) {
          case 'Dashboard':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Steps':
            iconName = focused ? 'walk' : 'walk-outline';
            break;
          case 'Water':
            iconName = focused ? 'water' : 'water-outline';
            break;
          case 'Diet':
            iconName = focused ? 'restaurant' : 'restaurant-outline';
            break;
          case 'Workout':
            iconName = focused ? 'fitness' : 'fitness-outline';
            break;
          default:
            iconName = 'ellipse';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: {
        paddingBottom: 5,
        height: 60,
      },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Steps" component={StepsScreen} />
    <Tab.Screen name="Water" component={WaterScreen} />
    <Tab.Screen name="Diet" component={DietScreen} />
    <Tab.Screen name="Workout" component={WorkoutScreen} />
  </Tab.Navigator>
);

const DrawerNavigator = () => (
  <Drawer.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#007AFF',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      drawerActiveTintColor: '#007AFF',
      drawerInactiveTintColor: 'gray',
    }}
  >
    <Drawer.Screen 
      name="MainTabs" 
      component={MainTabs}
      options={{
        drawerLabel: 'Home',
        title: 'Fitness App',
        drawerIcon: ({ color, size }) => (
          <Ionicons name="home-outline" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen 
      name="Weight" 
      component={WeightScreen}
      options={{
        drawerLabel: 'Weight Tracking',
        title: 'Weight Tracking',
        drawerIcon: ({ color, size }) => (
          <Ionicons name="scale-outline" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        drawerLabel: 'Profile',
        title: 'Profile',
        drawerIcon: ({ color, size }) => (
          <Ionicons name="person-outline" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen 
      name="Analytics" 
      component={AnalyticsScreen}
      options={{
        drawerLabel: 'Analytics',
        title: 'Analytics',
        drawerIcon: ({ color, size }) => (
          <Ionicons name="analytics-outline" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{
        drawerLabel: 'Settings',
        title: 'Settings',
        drawerIcon: ({ color, size }) => (
          <Ionicons name="settings-outline" size={size} color={color} />
        ),
      }}
    />
  </Drawer.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useFirebaseAuth();

  if (isLoading) {
    return null; // You can add a loading screen here
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <DrawerNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;