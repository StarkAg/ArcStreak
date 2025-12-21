// Username storage utilities
// Stores and retrieves the current username from AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

const USERNAME_KEY = '@arcstreak:username';

// Get stored username
export const getStoredUsername = async (): Promise<string | null> => {
  try {
    const username = await AsyncStorage.getItem(USERNAME_KEY);
    return username;
  } catch (error) {
    console.error('Error getting username:', error);
    return null;
  }
};

// Save username
export const saveUsername = async (username: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(USERNAME_KEY, username);
  } catch (error) {
    console.error('Error saving username:', error);
  }
};

// Clear username
export const clearUsername = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USERNAME_KEY);
  } catch (error) {
    console.error('Error clearing username:', error);
  }
};

