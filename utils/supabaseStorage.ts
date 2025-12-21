// Cloud storage using Supabase
// This syncs data across all devices using username (no auth required)

import { supabase } from '../config/supabase';
import { GymDay } from '../types';
import { getStoredUsername } from './usernameStorage';

// Get current username from AsyncStorage
const getCurrentUsername = async (): Promise<string | null> => {
  return await getStoredUsername();
};

// Get all gym days from Supabase for current username
export const getCloudGymDays = async (): Promise<GymDay[]> => {
  try {
    const username = await getCurrentUsername();
    if (!username) {
      console.warn('No username set, cannot fetch cloud gym days');
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select('gym_days')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return empty array
        return [];
      }
      console.error('Error getting cloud gym days:', error);
      return [];
    }

    return data?.gym_days || [];
  } catch (error) {
    console.error('Error getting cloud gym days:', error);
    return [];
  }
};

// Save gym days to Supabase for current username
export const saveCloudGymDays = async (days: GymDay[]): Promise<void> => {
  try {
    const username = await getCurrentUsername();
    if (!username) {
      console.warn('No username set, cannot save cloud gym days');
      return;
    }

    const { error } = await supabase
      .from('users')
      .upsert({
        username,
        gym_days: days,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'username',
      });

    if (error) {
      console.error('Error saving cloud gym days:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving cloud gym days:', error);
    throw error;
  }
};

// Get highest streak from Supabase for current username
export const getCloudHighestStreak = async (): Promise<number> => {
  try {
    const username = await getCurrentUsername();
    if (!username) {
      console.warn('No username set, cannot fetch cloud highest streak');
      return 0;
    }

    const { data, error } = await supabase
      .from('users')
      .select('highest_streak')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return 0
        return 0;
      }
      console.error('Error getting cloud highest streak:', error);
      return 0;
    }

    return data?.highest_streak || 0;
  } catch (error) {
    console.error('Error getting cloud highest streak:', error);
    return 0;
  }
};

// Save highest streak to Supabase for current username
export const saveCloudHighestStreak = async (streak: number): Promise<void> => {
  try {
    const username = await getCurrentUsername();
    if (!username) {
      console.warn('No username set, cannot save cloud highest streak');
      return;
    }

    const { error } = await supabase
      .from('users')
      .upsert({
        username,
        highest_streak: streak,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'username',
      });

    if (error) {
      console.error('Error saving cloud highest streak:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving cloud highest streak:', error);
    throw error;
  }
};

// Listen for real-time updates to gym days for current username
export const subscribeToGymDays = async (
  callback: (days: GymDay[]) => void
): Promise<() => void> => {
  try {
    const username = await getCurrentUsername();
    if (!username) {
      console.warn('No username set, cannot subscribe to gym days');
      return () => {}; // Return empty unsubscribe function
    }

    const channel = supabase
      .channel(`gym-days-${username}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `username=eq.${username}`,
        },
        (payload) => {
          if (payload.new) {
            callback((payload.new as any).gym_days || []);
          } else {
            callback([]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('Error setting up subscription:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Listen for highest streak updates for current username
export const subscribeToHighestStreak = async (
  callback: (streak: number) => void
): Promise<() => void> => {
  try {
    const username = await getCurrentUsername();
    if (!username) {
      console.warn('No username set, cannot subscribe to highest streak');
      return () => {}; // Return empty unsubscribe function
    }

    const channel = supabase
      .channel(`highest-streak-${username}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `username=eq.${username}`,
        },
        (payload) => {
          if (payload.new) {
            callback((payload.new as any).highest_streak || 0);
          } else {
            callback(0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('Error setting up subscription:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Get gym days for a specific username (for viewing other members)
export const getOtherUserGymDays = async (targetUsername: string): Promise<GymDay[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('gym_days')
      .eq('username', targetUsername)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return [];
      }
      console.error('Error getting other user gym days:', error);
      return [];
    }

    return data?.gym_days || [];
  } catch (error) {
    console.error('Error getting other user gym days:', error);
    return [];
  }
};

// Get highest streak for a specific username
export const getOtherUserHighestStreak = async (targetUsername: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('highest_streak')
      .eq('username', targetUsername)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return 0;
      }
      console.error('Error getting other user highest streak:', error);
      return 0;
    }

    return data?.highest_streak || 0;
  } catch (error) {
    console.error('Error getting other user highest streak:', error);
    return 0;
  }
};
