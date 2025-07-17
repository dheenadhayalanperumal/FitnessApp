import { User, Goals } from '../types';

export class UserModel {
  static createUser(userData: Partial<User>): User {
    return {
      id: userData.id || Date.now().toString(),
      email: userData.email || '',
      name: userData.name || '',
      avatar: userData.avatar,
      createdAt: userData.createdAt || new Date(),
      updatedAt: userData.updatedAt || new Date(),
    };
  }

  static updateUser(user: User, updates: Partial<User>): User {
    return {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
  }

  static getDefaultGoals(): Goals {
    return {
      dailySteps: 10000,
      dailyWater: 2000, // ml
      dailyCalories: 2000,
      weeklyWorkouts: 5,
      targetWeight: 70, // kg
    };
  }
}