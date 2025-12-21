import AsyncStorage from '@react-native-async-storage/async-storage';
import { GymDay } from '../types';

const STORAGE_KEY = '@arcstreak:days';
const HIGHEST_STREAK_KEY = '@arcstreak:highestStreak';

export const getGymDays = async (): Promise<GymDay[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error getting gym days:', error);
    return [];
  }
};

export const saveGymDay = async (date: string): Promise<void> => {
  try {
    const days = await getGymDays();
    const exists = days.some((day) => day.date === date);
    if (!exists) {
      days.push({ date });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(days));
    }
  } catch (error) {
    console.error('Error saving gym day:', error);
  }
};

export const removeGymDay = async (date: string): Promise<void> => {
  try {
    const days = await getGymDays();
    const filtered = days.filter((day) => day.date !== date);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing gym day:', error);
  }
};

export const clearAllGymDays = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing gym days:', error);
  }
};

export const isGymDay = async (date: string): Promise<boolean> => {
  try {
    const days = await getGymDays();
    return days.some((day) => day.date === date);
  } catch (error) {
    console.error('Error checking gym day:', error);
    return false;
  }
};

export const getHighestStreak = async (): Promise<number> => {
  try {
    const data = await AsyncStorage.getItem(HIGHEST_STREAK_KEY);
    if (data) {
      return parseInt(data, 10);
    }
    return 0;
  } catch (error) {
    console.error('Error getting highest streak:', error);
    return 0;
  }
};

export const setHighestStreak = async (streak: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(HIGHEST_STREAK_KEY, streak.toString());
  } catch (error) {
    console.error('Error saving highest streak:', error);
  }
};

