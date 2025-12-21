// Favorites storage utilities
// Stores and retrieves favorite usernames from AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@arcstreak:favorites';

// Get stored favorites
export const getFavorites = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

// Add favorite
export const addFavorite = async (username: string): Promise<void> => {
  try {
    const favorites = await getFavorites();
    if (!favorites.includes(username)) {
      favorites.push(username);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Error adding favorite:', error);
  }
};

// Remove favorite
export const removeFavorite = async (username: string): Promise<void> => {
  try {
    const favorites = await getFavorites();
    const filtered = favorites.filter((fav) => fav !== username);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
};

// Check if username is favorite
export const isFavorite = async (username: string): Promise<boolean> => {
  try {
    const favorites = await getFavorites();
    return favorites.includes(username);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};

