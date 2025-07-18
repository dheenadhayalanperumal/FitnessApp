export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

export interface StepsData {
  id: string;
  userId: string;
  date: string;
  steps: number;
  target: number;
  calories: number;
  distance: number;
  createdAt: Date;
}

export interface WaterIntake {
  id: string;
  userId: string;
  date: string;
  amount: number;
  target: number;
  entries: WaterEntry[];
  createdAt: Date;
}

export interface WaterEntry {
  id: string;
  amount: number;
  timestamp: Date;
}

export interface DietEntry {
  id: string;
  userId: string;
  date: string;
  meals: Meal[];
  totalCalories: number;
  targetCalories: number;
  createdAt: Date;
}

export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: Date;
}

export interface WeightEntry {
  id: string;
  userId: string;
  weight: number;
  date: string;
  notes?: string;
  createdAt: Date;
}

export interface WorkoutEntry {
  id: string;
  userId: string;
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports';
  duration: number;
  calories: number;
  exercises: Exercise[];
  date: string;
  notes?: string;
  createdAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  notes?: string;
}

export interface DashboardData {
  steps: StepsData | null;
  water: WaterIntake | null;
  diet: DietEntry | null;
  weight: WeightEntry | null;
  recentWorkouts: WorkoutEntry[];
}

export interface NavigationProps {
  navigation: any;
  route: any;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

export interface Goals {
  dailySteps: number;
  dailyWater: number;
  dailyCalories: number;
  weeklyWorkouts: number;
  targetWeight: number;
}

export interface UserProfile {
  user: User;
  goals: Goals;
  preferences: {
    units: 'metric' | 'imperial';
    theme: 'light' | 'dark';
    notifications: boolean;
    dataSync: boolean;
  };
}