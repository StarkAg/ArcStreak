import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Modal,
  FlatList,
  Animated,
  TextInput,
  Dimensions,
  ScrollView,
  SafeAreaView,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { getGymDays, saveGymDay, removeGymDay, getHighestStreak, setHighestStreak, clearAllGymDays } from '../utils/storage';
import { calculateStats } from '../utils/stats';
import { GymDay, Stats } from '../types';
import { getStoredUsername, clearUsername } from '../utils/usernameStorage';
import { getCloudGymDays, saveCloudGymDays, getCloudHighestStreak, saveCloudHighestStreak, getOtherUserGymDays, getOtherUserHighestStreak } from '../utils/supabaseStorage';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from '../utils/favoritesStorage';
import UsernameEntry from '../components/UsernameEntry';
import { Ionicons } from '@expo/vector-icons';

// Import logos
const linkedinLogo = require('../assets/linkedin-logo.png');
const arcReactorLogo = require('../assets/arc-reactor.png');
import GithubIcon from '../components/GithubIcon';

export default function HomeScreen() {
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [stats, setStats] = useState<Stats>({
    totalDays: 0,
    currentStreak: 0,
    currentMonthCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showDaysModal, setShowDaysModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [groupedDays, setGroupedDays] = useState<Record<string, string[]>>({});
  const [highestStreak, setHighestStreakState] = useState(0);
  const [showFireCelebration, setShowFireCelebration] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicSound, setMusicSound] = useState<Audio.Sound | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberUsername, setMemberUsername] = useState('');
  const [memberStats, setMemberStats] = useState<Stats | null>(null);
  const [memberGymDays, setMemberGymDays] = useState<GymDay[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showMemberCalendar, setShowMemberCalendar] = useState(false);
  const [isMemberFavorite, setIsMemberFavorite] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [showUnmarkModal, setShowUnmarkModal] = useState(false);
  const [dateToUnmark, setDateToUnmark] = useState<string | null>(null);
  const syncIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const fireAnimation = React.useRef(new Animated.Value(0)).current;
  const fireScale = React.useRef(new Animated.Value(1)).current;
  const fireRotation = React.useRef(new Animated.Value(0)).current;

  // Sound effects removed for ultra-smooth performance
  
  // Music playback for arc reactor
  useEffect(() => {
    return () => {
      if (musicSound) {
        musicSound.unloadAsync();
      }
    };
  }, [musicSound]);

  const toggleMusic = async () => {
    try {
      triggerHaptic('medium');
      
      if (isMusicPlaying && musicSound) {
        // Stop music
        await musicSound.pauseAsync();
        setIsMusicPlaying(false);
      } else {
        // Play music
        if (musicSound) {
          await musicSound.playAsync();
        } else {
          // Load and play music
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/back-in-black.mp3'),
            { shouldPlay: true, isLooping: true }
          );
          setMusicSound(sound);
        }
        setIsMusicPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling music:', error);
      Alert.alert('Error', 'Could not play music. Make sure back-in-black.mp3 exists in assets folder.');
    }
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning') => {
    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
      }
    } catch (error) {
      // Silently fail if haptics not available
    }
  };

  const loadGymDays = useCallback(async () => {
    try {
      setLoading(true);
      const days = await getGymDays();
      
      // Get today's date string
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Create marked dates object
      const marked: Record<string, any> = {};
      
      // First, mark all gym days
      days.forEach((day) => {
        const isToday = day.date === todayString;
        marked[day.date] = {
          selected: true,
          selectedColor: '#FFFFFF',
          selectedTextColor: isToday ? '#4CAF50' : '#000000', // Green text if today
          customStyles: {
            container: {
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
              ...(isToday && {
                borderWidth: 2,
                borderColor: '#4CAF50',
              }),
            },
            text: {
              textAlign: 'center',
              ...(isToday && {
                color: '#4CAF50',
                fontWeight: 'bold',
              }),
            },
          },
        };
      });
      
      // Always mark today with green text and border (even if not a gym day)
      marked[todayString] = {
        ...marked[todayString],
        selected: marked[todayString]?.selected || false,
        selectedColor: marked[todayString]?.selected ? '#FFFFFF' : undefined,
        selectedTextColor: '#4CAF50', // Always green text for today
        customStyles: {
          container: {
            borderWidth: 2,
            borderColor: '#4CAF50',
            borderRadius: 8,
            backgroundColor: marked[todayString]?.selected ? '#FFFFFF' : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
          },
          text: {
            color: '#4CAF50',
            fontWeight: 'bold',
            textAlign: 'center',
          },
        },
      };
      
      setMarkedDates(marked);
      
      // Calculate stats
      const calculatedStats = calculateStats(days);
      setStats(calculatedStats);
      
      // Load highest streak
      const currentHighest = await getHighestStreak();
      setHighestStreakState(currentHighest);
      
      // Group days by month for the modal
      const grouped: Record<string, string[]> = {};
      days.forEach((day) => {
        const date = new Date(day.date);
        const monthKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(day.date);
      });
      
      // Sort days within each month
      Object.keys(grouped).forEach((month) => {
        grouped[month].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      });
      
      setGroupedDays(grouped);
    } catch (error) {
      console.error('Error loading gym days:', error);
      Alert.alert('Error', 'Failed to load gym days');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGymDays();
    // Load highest streak on mount
    getHighestStreak().then((streak) => {
      setHighestStreakState(streak);
    });
    // Load username on mount
    getStoredUsername().then((storedUsername) => {
      setUsername(storedUsername);
    });
  }, [loadGymDays]);

  // Track app state to sync when app comes to foreground
  const appState = useRef(AppState.currentState);

  // Sync when app comes to foreground (after being closed or in background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        username
      ) {
        // App has come to the foreground, sync data silently
        handleSync(true); // Silent sync
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // Auto-sync every 2 minutes when username is set (less frequent to avoid refreshing)
  useEffect(() => {
    if (username) {
      // Initial sync after 10 seconds
      const initialTimeout = setTimeout(() => {
        handleSync(true); // true = silent sync
      }, 10000);

      // Then sync every 2 minutes (120 seconds) instead of 30 seconds
      syncIntervalRef.current = setInterval(() => {
        handleSync(true); // true = silent sync
      }, 120000);

      return () => {
        clearTimeout(initialTimeout);
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    } else {
      // Clear interval if no username
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const handleDayPress = async (day: DateData) => {
    try {
      const dateString = day.dateString;
      const isMarked = markedDates[dateString]?.selected;

      // Haptic feedback only (no sound)
      triggerHaptic('medium');

      // Get today's date for marker
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const isToday = dateString === todayString;

      if (isMarked) {
        // Show confirmation modal before unmarking
        setDateToUnmark(dateString);
        setShowUnmarkModal(true);
        return; // Exit early, modal handles the rest
      } else {
        // Mark the day - update immediately
        await saveGymDay(dateString);
        const newMarked = {
          ...markedDates,
          [dateString]: {
            selected: true,
            selectedColor: '#FFFFFF',
            selectedTextColor: isToday ? '#4CAF50' : '#000000', // Green text if today
            customStyles: {
              container: {
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                ...(isToday && {
                  borderWidth: 2,
                  borderColor: '#4CAF50',
                }),
              },
              text: {
                textAlign: 'center',
                ...(isToday && {
                  color: '#4CAF50',
                  fontWeight: 'bold',
                }),
              },
            },
          },
        };
        setMarkedDates(newMarked);
        triggerHaptic('success');
        
        // Sync to Supabase if username is set
        if (username) {
          const localGymDays = await getGymDays();
          await saveCloudGymDays(localGymDays).catch(err => console.error('Error syncing to cloud:', err));
        }
      }

      // Update stats in background (non-blocking)
      getGymDays().then((days) => {
        const calculatedStats = calculateStats(days);
        setStats(calculatedStats);
        
        // Check for new high streak
        getHighestStreak().then((currentHighest) => {
          if (calculatedStats.currentStreak > currentHighest && calculatedStats.currentStreak > 0) {
            setHighestStreak(calculatedStats.currentStreak).then(() => {
              setHighestStreakState(calculatedStats.currentStreak);
              
              // Celebrate new high streak!
              setShowFireCelebration(true);
              triggerHaptic('heavy');
              
              // Start dancing animation - start with larger scale to cover screen
              fireAnimation.setValue(0);
              fireScale.setValue(2);
              fireRotation.setValue(0);
              
              // Dancing animation - bounce and rotate
              Animated.parallel([
                // Bounce up and down
                Animated.loop(
                  Animated.sequence([
                    Animated.timing(fireAnimation, {
                      toValue: -20,
                      duration: 200,
                      useNativeDriver: true,
                    }),
                    Animated.timing(fireAnimation, {
                      toValue: 20,
                      duration: 200,
                      useNativeDriver: true,
                    }),
                    Animated.timing(fireAnimation, {
                      toValue: -15,
                      duration: 150,
                      useNativeDriver: true,
                    }),
                    Animated.timing(fireAnimation, {
                      toValue: 15,
                      duration: 150,
                      useNativeDriver: true,
                    }),
                    Animated.timing(fireAnimation, {
                      toValue: 0,
                      duration: 100,
                      useNativeDriver: true,
                    }),
                  ]),
                  { iterations: 3 }
                ),
                // Scale pulse (around base scale of 2)
                Animated.loop(
                  Animated.sequence([
                    Animated.timing(fireScale, {
                      toValue: 2.2,
                      duration: 300,
                      useNativeDriver: true,
                    }),
                    Animated.timing(fireScale, {
                      toValue: 2,
                      duration: 300,
                      useNativeDriver: true,
                    }),
                  ]),
                  { iterations: 5 }
                ),
                // Rotation
                Animated.loop(
                  Animated.sequence([
                    Animated.timing(fireRotation, {
                      toValue: 1,
                      duration: 200,
                      useNativeDriver: true,
                    }),
                    Animated.timing(fireRotation, {
                      toValue: -1,
                      duration: 200,
                      useNativeDriver: true,
                    }),
                    Animated.timing(fireRotation, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                    }),
                  ]),
                  { iterations: 3 }
                ),
              ]).start();
              
              // Hide celebration with zoom-out effect after 2 seconds
              setTimeout(() => {
                // Zoom out animation - scales from 2 to 8 and moves up
                Animated.parallel([
                  Animated.timing(fireScale, {
                    toValue: 8,
                    duration: 600,
                    useNativeDriver: true,
                  }),
                  Animated.timing(fireAnimation, {
                    toValue: -200,
                    duration: 600,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  setShowFireCelebration(false);
                  fireAnimation.setValue(0);
                  fireScale.setValue(2);
                  fireRotation.setValue(0);
                });
              }, 2000);
            });
          }
        });
      });
    } catch (error) {
      console.error('Error toggling gym day:', error);
      triggerHaptic('warning');
      Alert.alert('Error', 'Failed to update gym day');
    }
  };


  const openLink = async (url: string) => {
    triggerHaptic('light');
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleSync = async (silent: boolean = false) => {
    if (!username) {
      if (!silent) {
        setShowUsernameModal(true);
      }
      return;
    }

    try {
      if (!silent) {
        setSyncStatus('syncing');
        setSyncMessage('Syncing...');
        triggerHaptic('medium');
      }

      // Get local data
      const localGymDays = await getGymDays();
      const localHighestStreak = await getHighestStreak();

      // Get cloud data
      const cloudGymDays = await getCloudGymDays();
      const cloudHighestStreak = await getCloudHighestStreak();

      // Merge gym days: combine all unique dates from both local and cloud
      const localDates = new Set(localGymDays.map(d => d.date));
      const cloudDates = new Set(cloudGymDays.map(d => d.date));
      const allDates = new Set([...localDates, ...cloudDates]);
      const mergedGymDays: GymDay[] = Array.from(allDates)
        .map(date => ({ date }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Determine sync direction for message
      if (cloudGymDays.length > localGymDays.length) {
        if (!silent) setSyncMessage('Downloading from cloud...');
      } else if (localGymDays.length > cloudGymDays.length) {
        if (!silent) setSyncMessage('Uploading to cloud...');
      } else {
        // Same count, check if dates are different
        const localDates = new Set(localGymDays.map(d => d.date));
        const cloudDates = new Set(cloudGymDays.map(d => d.date));
        const datesMatch = localDates.size === cloudDates.size && 
          Array.from(localDates).every(date => cloudDates.has(date));
        
        if (!datesMatch && !silent) {
          setSyncMessage('Syncing...');
        } else if (!silent) {
          // Data is already in sync, no message needed
          setSyncMessage('');
        }
      }

      // Save merged data to cloud
      await saveCloudGymDays(mergedGymDays);

      // Update local storage if merged data is different
      const localDatesSet = new Set(localGymDays.map(d => d.date));
      const mergedDatesSet = new Set(mergedGymDays.map(d => d.date));
      const needsUpdate = localDatesSet.size !== mergedDatesSet.size || 
        !Array.from(localDatesSet).every(date => mergedDatesSet.has(date));

      if (needsUpdate) {
        // Clear and re-save all merged days
        await clearAllGymDays();
        for (const day of mergedGymDays) {
          await saveGymDay(day.date);
        }
      }

      // Handle highest streak - use the maximum
      const finalHighestStreak = Math.max(localHighestStreak, cloudHighestStreak);
      if (finalHighestStreak > localHighestStreak) {
        await setHighestStreak(finalHighestStreak);
      }
      if (finalHighestStreak > cloudHighestStreak) {
        await saveCloudHighestStreak(finalHighestStreak);
      }

      // Only reload UI if data actually changed (to avoid unnecessary refreshes)
      if (needsUpdate || finalHighestStreak !== localHighestStreak) {
        await loadGymDays();
        setHighestStreakState(finalHighestStreak);
      } else {
        // Just update highest streak state if it changed
        if (finalHighestStreak !== localHighestStreak) {
          setHighestStreakState(finalHighestStreak);
        }
      }

      if (!silent) {
        setSyncStatus('success');
        setSyncMessage('Sync successful!');
        triggerHaptic('success');

        // Clear status after 3 seconds
        setTimeout(() => {
          setSyncStatus('idle');
          setSyncMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error syncing:', error);
      if (!silent) {
        setSyncStatus('error');
        setSyncMessage('Sync failed. Check connection.');
        triggerHaptic('warning');
        
        // Clear error status after 3 seconds
        setTimeout(() => {
          setSyncStatus('idle');
          setSyncMessage('');
        }, 3000);
      }
    }
  };

  const handleUsernameSet = (newUsername: string) => {
    setUsername(newUsername);
    setShowUsernameModal(false);
  };

  const handleViewMember = async () => {
    if (!memberUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    try {
      setMemberLoading(true);
      const username = memberUsername.trim();
      const days = await getOtherUserGymDays(username);
      const memberHighestStreak = await getOtherUserHighestStreak(username);
      
      setMemberGymDays(days);
      
      const calculatedStats = calculateStats(days);
      setMemberStats({
        ...calculatedStats,
        currentMonthCount: calculatedStats.currentMonthCount,
      });
      
      // Check if favorite
      const favorite = await isFavorite(username);
      setIsMemberFavorite(favorite);
    } catch (error) {
      console.error('Error loading member data:', error);
      Alert.alert('Error', 'Failed to load member data. User may not exist.');
      setMemberStats(null);
      setMemberGymDays([]);
    } finally {
      setMemberLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!memberUsername.trim()) return;
    
    try {
      if (isMemberFavorite) {
        await removeFavorite(memberUsername.trim());
        setIsMemberFavorite(false);
      } else {
        await addFavorite(memberUsername.trim());
        setIsMemberFavorite(true);
      }
      // Reload favorites list
      const updatedFavorites = await getFavorites();
      setFavorites(updatedFavorites);
      triggerHaptic('light');
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleSelectFavorite = async (favUsername: string) => {
    setMemberUsername(favUsername);
    // Auto-load the favorite's data
    const days = await getOtherUserGymDays(favUsername);
    const memberHighestStreak = await getOtherUserHighestStreak(favUsername);
    
    setMemberGymDays(days);
    
    const calculatedStats = calculateStats(days);
    setMemberStats({
      ...calculatedStats,
      currentMonthCount: calculatedStats.currentMonthCount,
    });
    
    setIsMemberFavorite(true);
  };

  // Load favorites on mount
  useEffect(() => {
    getFavorites().then(setFavorites);
  }, []);

  const handleConfirmUnmark = async () => {
    if (!dateToUnmark) return;

    try {
      const dateString = dateToUnmark;
      
      // Unmark the day locally
      await removeGymDay(dateString);
      
      // Sync to Supabase if username is set
      if (username) {
        const localGymDays = await getGymDays();
        await saveCloudGymDays(localGymDays);
      }
      
      // Get today's date for marker
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const isToday = dateString === todayString;
      
      const newMarked = { ...markedDates };
      delete newMarked[dateString];
      
      // Re-add today's marker if needed
      if (isToday) {
        newMarked[todayString] = {
          selected: false,
          selectedTextColor: '#4CAF50', // Always green text for today
          customStyles: {
            container: {
              borderWidth: 2,
              borderColor: '#4CAF50',
              borderRadius: 8,
              backgroundColor: 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            },
            text: {
              color: '#4CAF50',
              fontWeight: 'bold',
              textAlign: 'center',
            },
          },
        };
      }
      
      setMarkedDates(newMarked);
      triggerHaptic('light');
      
      // Update stats
      getGymDays().then((days) => {
        const calculatedStats = calculateStats(days);
        setStats(calculatedStats);
      });
      
      // Close modal
      setShowUnmarkModal(false);
      setDateToUnmark(null);
    } catch (error) {
      console.error('Error unmarking day:', error);
      Alert.alert('Error', 'Failed to unmark day');
      setShowUnmarkModal(false);
      setDateToUnmark(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Arc Streak</Text>
          <Text style={styles.tagline}>Mark every day. Become your best.</Text>
          <View style={styles.headerLine} />
        </View>

        {/* Sign In / Sync Button */}
        <View style={styles.syncButtonContainer}>
          <TouchableOpacity
            style={[
              styles.syncButton,
              syncStatus === 'syncing' && styles.syncButtonSyncing,
              syncStatus === 'success' && styles.syncButtonSuccess,
              syncStatus === 'error' && styles.syncButtonError,
            ]}
            onPress={() => {
              triggerHaptic('light');
              if (username) {
                handleSync();
              } else {
                setShowUsernameModal(true);
              }
            }}
            disabled={syncStatus === 'syncing'}
            activeOpacity={0.7}
          >
            <View style={styles.syncButtonContent}>
              {syncStatus === 'syncing' ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.syncIcon} />
                  <Text style={styles.syncButtonText}>Syncing...</Text>
                </>
              ) : username ? (
                <>
                  <Text style={styles.syncButtonText}>Sync to Cloud</Text>
                  <Ionicons name="cloud" size={18} color="#FFFFFF" style={styles.buttonIconRight} />
                </>
              ) : (
                <Text style={styles.syncButtonText}>Sign In</Text>
              )}
            </View>
            {syncMessage ? (
              <Text style={styles.syncStatusText}>{syncMessage}</Text>
            ) : username ? (
              <Text style={styles.syncStatusText}>Signed in as: {username}</Text>
            ) : null}
          </TouchableOpacity>
          
          {/* Other Members Button */}
          {username && (
            <TouchableOpacity
              style={styles.otherMembersButton}
              onPress={() => {
                triggerHaptic('light');
                setShowMembersModal(true);
                // Reload favorites when opening modal
                getFavorites().then(setFavorites);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.otherMembersButtonText}>Add Family/Friends</Text>
              <Ionicons name="people" size={16} color="#FFFFFF" style={styles.buttonIconRight} />
            </TouchableOpacity>
          )}
          
          {/* Logout Button */}
          {username && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert(
                  'Logout',
                  'Are you sure you want to logout?',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Logout',
                      style: 'destructive',
                      onPress: async () => {
                        await clearUsername();
                        setUsername(null);
                        triggerHaptic('light');
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: '#000000',
              calendarBackground: '#000000',
              textSectionTitleColor: '#CCCCCC',
              selectedDayBackgroundColor: '#FFFFFF',
              selectedDayTextColor: '#000000',
              todayTextColor: '#4CAF50',
              dayTextColor: '#FFFFFF',
              textDisabledColor: '#666666',
              arrowColor: '#FFFFFF',
              monthTextColor: '#FFFFFF',
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: scale(14),
              textMonthFontSize: scale(18),
              textDayHeaderFontSize: scale(10),
            }}
            style={{
              minHeight: CALENDAR_MIN_HEIGHT,
            }}
            enableSwipeMonths={true}
            markingType="custom"
            hideExtraDays={false}
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => {
              triggerHaptic('light');
              setShowDaysModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.statValue}>{stats.totalDays}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => {
              triggerHaptic('light');
              setShowStreakModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </TouchableOpacity>
        </View>

        {/* Footer with Credits */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Crafted By Harsh (Stark)</Text>
          <View style={styles.logoContainer}>
            <TouchableOpacity
              onPress={() => openLink('https://in.linkedin.com/in/harshxagarwal')}
              activeOpacity={0.7}
              style={styles.logoButton}
            >
              <Image 
                source={linkedinLogo} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleMusic}
              activeOpacity={0.7}
              style={[styles.logoButton, isMusicPlaying && styles.arcReactorActive]}
            >
              <Image 
                source={arcReactorLogo} 
                style={[styles.logo, isMusicPlaying && { tintColor: '#4CAF50' }]} 
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openLink('https://github.com/StarkAg')}
              activeOpacity={0.7}
              style={styles.logoButton}
            >
              <GithubIcon size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Days List Modal */}
        <Modal
          visible={showDaysModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDaysModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>All Gym Days</Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('light');
                    setShowDaysModal(false);
                  }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={Object.keys(groupedDays).sort((a, b) => {
                  // Sort months chronologically (newest first)
                  const dateA = new Date(a);
                  const dateB = new Date(b);
                  return dateB.getTime() - dateA.getTime();
                })}
                keyExtractor={(item) => item}
                renderItem={({ item: month }) => (
                  <View style={styles.monthGroup}>
                    <Text style={styles.monthHeader}>{month}</Text>
                    <View style={styles.daysList}>
                      {groupedDays[month].map((date) => {
                        const dateObj = new Date(date);
                        const dayName = dateObj.toLocaleDateString('default', { weekday: 'short' });
                        const dayNumber = dateObj.getDate();
                        return (
                          <View key={date} style={styles.dayItem}>
                            <Text style={styles.dayName}>{dayName}</Text>
                            <Text style={styles.dayNumber}>{dayNumber}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No gym days recorded yet</Text>
                  </View>
                }
              />

              <TouchableOpacity
                style={styles.resetDaysButton}
                onPress={() => {
                  triggerHaptic('medium');
                  Alert.alert(
                    'Reset All Days',
                    'Are you sure you want to delete all gym days? This action cannot be undone.',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => triggerHaptic('light'),
                      },
                      {
                        text: 'Reset',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            triggerHaptic('heavy');
                            await clearAllGymDays();
                            
                            // Get today's date string
                            const today = new Date();
                            const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                            
                            // Clear all marked dates but re-add today's marker
                            const newMarkedDates: Record<string, any> = {
                              [todayString]: {
                                selected: false,
                                selectedTextColor: '#4CAF50', // Always green text for today
                                customStyles: {
                                  container: {
                                    borderWidth: 2,
                                    borderColor: '#4CAF50',
                                    borderRadius: 8,
                                    backgroundColor: 'transparent',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                  },
                                  text: {
                                    color: '#4CAF50',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                  },
                                },
                              },
                            };
                            
                            setMarkedDates(newMarkedDates);
                            setStats({
                              totalDays: 0,
                              currentStreak: 0,
                              currentMonthCount: 0,
                            });
                            setGroupedDays({});
                            Alert.alert('Success', 'All gym days have been deleted');
                            // Reload to refresh the modal
                            const days = await getGymDays();
                            const grouped: Record<string, string[]> = {};
                            days.forEach((day) => {
                              const date = new Date(day.date);
                              const monthKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
                              if (!grouped[monthKey]) {
                                grouped[monthKey] = [];
                              }
                              grouped[monthKey].push(day.date);
                            });
                            Object.keys(grouped).forEach((month) => {
                              grouped[month].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
                            });
                            setGroupedDays(grouped);
                          } catch (error) {
                            console.error('Error resetting days:', error);
                            Alert.alert('Error', 'Failed to reset days');
                          }
                        },
                      },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.resetDaysButtonText}>Reset All Days</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Streak Modal */}
        <Modal
          visible={showStreakModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowStreakModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Streak Stats</Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('light');
                    setShowStreakModal(false);
                  }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.streakStatsContainer}>
                <View style={styles.streakStatItem}>
                  <Text style={styles.streakStatLabel}>Current Streak</Text>
                  <Text style={styles.streakStatValue}>{stats.currentStreak}</Text>
                </View>
                
                <View style={styles.streakStatItem}>
                  <Text style={styles.streakStatLabel}>Highest Streak</Text>
                  <Text style={styles.streakStatValue}>{highestStreak}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.resetStreakButton}
                onPress={() => {
                  triggerHaptic('medium');
                  Alert.alert(
                    'Reset Highest Streak',
                    'Are you sure you want to reset your highest streak record? This will not affect your current streak.',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => triggerHaptic('light'),
                      },
                      {
                        text: 'Reset',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            triggerHaptic('heavy');
                            await setHighestStreak(0);
                            setHighestStreakState(0);
                            Alert.alert('Success', 'Highest streak has been reset');
                          } catch (error) {
                            console.error('Error resetting streak:', error);
                            Alert.alert('Error', 'Failed to reset streak');
                          }
                        },
                      },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.resetStreakButtonText}>Reset Highest Streak</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Fire Celebration Overlay */}
        {showFireCelebration && (
          <View style={styles.fireOverlay}>
            <Animated.View
              style={{
                transform: [
                  { translateY: fireAnimation },
                  { scale: fireScale },
                  {
                    rotate: fireRotation.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ['-15deg', '15deg'],
                    }),
                  },
                ],
              }}
            >
              <Text style={styles.fireEmoji}>🔥</Text>
            </Animated.View>
            <Animated.View
              style={{
                opacity: fireScale.interpolate({
                  inputRange: [2, 8],
                  outputRange: [1, 0],
                }),
              }}
            >
              <Text style={styles.celebrationText}>New High Streak!</Text>
            </Animated.View>
          </View>
        )}

        {/* Username Entry Modal */}
        <UsernameEntry
          visible={showUsernameModal}
          onClose={() => {
            triggerHaptic('light');
            setShowUsernameModal(false);
          }}
          onUsernameSet={handleUsernameSet}
        />

        {/* Other Members Modal */}
        <Modal
          visible={showMembersModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowMembersModal(false);
            setMemberUsername('');
            setMemberStats(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Family & Friends</Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('light');
                    setShowMembersModal(false);
                    setMemberUsername('');
                    setMemberStats(null);
                  }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.memberSearchContainer}>
                <Text style={styles.memberSearchLabel}>Enter Username:</Text>
                <View style={styles.memberInputContainer}>
                  <TextInput
                    style={styles.memberInput}
                    value={memberUsername}
                    onChangeText={setMemberUsername}
                    placeholder="Enter username"
                    placeholderTextColor="#666666"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.viewMemberButton}
                    onPress={handleViewMember}
                    disabled={memberLoading || !memberUsername.trim()}
                    activeOpacity={0.7}
                  >
                    {memberLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.viewMemberButtonText}>View</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Favorites List */}
              {favorites.length > 0 && (
                <View style={styles.favoritesContainer}>
                  <Text style={styles.favoritesTitle}>Favorites</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.favoritesList}>
                    {favorites.map((fav) => (
                      <TouchableOpacity
                        key={fav}
                        style={styles.favoriteChip}
                        onPress={() => handleSelectFavorite(fav)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.favoriteChipText}>{fav}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {memberStats && (
                <View style={styles.memberStatsContainer}>
                  <View style={styles.memberHeaderRow}>
                    <Text style={styles.memberStatsTitle}>Stats for: {memberUsername}</Text>
                    <TouchableOpacity
                      onPress={handleToggleFavorite}
                      style={styles.favoriteButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={isMemberFavorite ? "heart" : "heart-outline"} 
                        size={24} 
                        color={isMemberFavorite ? "#FF4444" : "#CCCCCC"} 
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.memberStatsGrid}>
                    <View style={styles.memberStatCard}>
                      <Text style={styles.memberStatValue}>{memberStats.totalDays}</Text>
                      <Text style={styles.memberStatLabel}>Total Days</Text>
                    </View>
                    <View style={styles.memberStatCard}>
                      <Text style={styles.memberStatValue}>{memberStats.currentStreak}</Text>
                      <Text style={styles.memberStatLabel}>Current Streak</Text>
                    </View>
                    <View style={styles.memberStatCard}>
                      <Text style={styles.memberStatValue}>{memberStats.currentMonthCount}</Text>
                      <Text style={styles.memberStatLabel}>This Month</Text>
                    </View>
                  </View>
                  
                  {/* View Calendar Button - Hidden for now */}
                  {/* <TouchableOpacity
                    style={styles.viewCalendarButton}
                    onPress={() => {
                      triggerHaptic('light');
                      setShowMemberCalendar(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="calendar" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.viewCalendarButtonText}>View Full Calendar</Text>
                  </TouchableOpacity> */}
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Member Calendar Modal */}
        <Modal
          visible={showMemberCalendar}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowMemberCalendar(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{memberUsername}'s Calendar</Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('light');
                    setShowMemberCalendar(false);
                  }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.calendarModalScroll}>
                <View style={styles.calendarContainer}>
                  <Calendar
                    markedDates={memberGymDays.reduce((acc, day) => {
                      acc[day.date] = {
                        selected: true,
                        selectedColor: '#FFFFFF',
                        selectedTextColor: '#000000',
                        customStyles: {
                          container: {
                            borderRadius: 8,
                            justifyContent: 'center',
                            alignItems: 'center',
                          },
                        },
                      };
                      return acc;
                    }, {} as Record<string, any>)}
                    theme={{
                      backgroundColor: '#000000',
                      calendarBackground: '#000000',
                      textSectionTitleColor: '#CCCCCC',
                      selectedDayBackgroundColor: '#FFFFFF',
                      selectedDayTextColor: '#000000',
                      todayTextColor: '#4CAF50',
                      dayTextColor: '#FFFFFF',
                      textDisabledColor: '#666666',
                      arrowColor: '#FFFFFF',
                      monthTextColor: '#FFFFFF',
                      textDayFontWeight: '500',
                      textMonthFontWeight: 'bold',
                      textDayHeaderFontWeight: '600',
                      textDayFontSize: scale(14),
                      textMonthFontSize: scale(18),
                      textDayHeaderFontSize: scale(10),
                    }}
                    enableSwipeMonths={true}
                    markingType="custom"
                    hideExtraDays={false}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Unmark Confirmation Modal */}
        <Modal
          visible={showUnmarkModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {
            setShowUnmarkModal(false);
            setDateToUnmark(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.unmarkModalContent}>
              <Text style={styles.unmarkModalTitle}>Unmark Gym Day</Text>
              <Text style={styles.unmarkModalMessage}>
                Are you sure you want to unmark {dateToUnmark}?
              </Text>
              <View style={styles.unmarkModalButtons}>
                <TouchableOpacity
                  style={[styles.unmarkModalButton, styles.unmarkModalCancelButton]}
                  onPress={() => {
                    triggerHaptic('light');
                    setShowUnmarkModal(false);
                    setDateToUnmark(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.unmarkModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unmarkModalButton, styles.unmarkModalConfirmButton]}
                  onPress={handleConfirmUnmark}
                  activeOpacity={0.7}
                >
                  <Text style={styles.unmarkModalConfirmText}>Unmark</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// Create responsive styles based on screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_HEIGHT < 800;
const isMediumScreen = SCREEN_HEIGHT >= 800 && SCREEN_HEIGHT < 900;
const isLargeScreen = SCREEN_HEIGHT >= 900;

// Responsive scaling factors
const scale = (size: number) => {
  if (isSmallScreen) return size * 0.85;
  if (isMediumScreen) return size * 0.95;
  return size;
};

const verticalScale = (size: number) => {
  if (isSmallScreen) return size * 0.8;
  if (isMediumScreen) return size * 0.9;
  return size;
};

// Calculate responsive values (must be constants for StyleSheet)
const PADDING = scale(16);
const PADDING_SMALL = scale(12);
const MARGIN = verticalScale(12);
const MARGIN_SMALL = verticalScale(8);
const FONT_SIZE_LARGE = scale(28);
const FONT_SIZE_MEDIUM = scale(18);
const FONT_SIZE_SMALL = scale(14);
const FONT_SIZE_XSMALL = scale(12);
const FONT_SIZE_XXSMALL = scale(10);
const BORDER_RADIUS = scale(10);
const LOGO_SIZE = scale(28);
const CALENDAR_MIN_HEIGHT = isSmallScreen ? 280 : isMediumScreen ? 300 : 320;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: PADDING,
    paddingTop: MARGIN_SMALL,
    paddingBottom: MARGIN,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: MARGIN,
    paddingTop: MARGIN_SMALL,
  },
  appName: {
    fontSize: FONT_SIZE_LARGE,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(4),
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FONT_SIZE_XSMALL,
    color: '#CCCCCC',
    fontWeight: '300',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: MARGIN_SMALL,
  },
  headerLine: {
    height: 1,
    backgroundColor: '#333333',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  calendarContainer: {
    backgroundColor: '#000000',
    borderRadius: 0,
    marginBottom: MARGIN,
    padding: scale(4),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: MARGIN,
    gap: PADDING_SMALL,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: BORDER_RADIUS,
    padding: MARGIN,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statValue: {
    fontSize: FONT_SIZE_LARGE,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: verticalScale(2),
  },
  statLabel: {
    fontSize: FONT_SIZE_XSMALL,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingTop: MARGIN,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    marginTop: MARGIN_SMALL,
  },
  footerText: {
    fontSize: FONT_SIZE_XSMALL,
    color: '#CCCCCC',
    fontWeight: '500',
    marginBottom: PADDING_SMALL,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MARGIN,
  },
  logoButton: {
    padding: MARGIN_SMALL,
  },
  arcReactorActive: {
    opacity: 1,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    tintColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  monthGroup: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  monthHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  daysList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  dayName: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  streakStatsContainer: {
    padding: 20,
  },
  streakStatItem: {
    marginBottom: 24,
    alignItems: 'center',
  },
  streakStatLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    fontWeight: '500',
  },
  streakStatValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resetStreakButton: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  resetStreakButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetDaysButton: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  resetDaysButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fireOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fireEmoji: {
    fontSize: 300,
    marginBottom: 20,
  },
  celebrationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  syncButtonContainer: {
    marginBottom: PADDING_SMALL,
  },
  syncButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: BORDER_RADIUS,
    padding: MARGIN,
    marginBottom: MARGIN_SMALL,
    borderWidth: 1,
    borderColor: '#333333',
  },
  syncButtonSyncing: {
    backgroundColor: '#1A3A1A',
    borderColor: '#4CAF50',
  },
  syncButtonSuccess: {
    backgroundColor: '#1A3A1A',
    borderColor: '#4CAF50',
  },
  syncButtonError: {
    backgroundColor: '#3A1A1A',
    borderColor: '#FF4444',
  },
  syncButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncIcon: {
    marginRight: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonIconRight: {
    marginLeft: 8,
  },
  syncButtonText: {
    fontSize: FONT_SIZE_SMALL,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  syncStatusText: {
    fontSize: FONT_SIZE_XXSMALL,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: verticalScale(4),
  },
  otherMembersButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: BORDER_RADIUS,
    padding: PADDING_SMALL,
    marginBottom: MARGIN_SMALL,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherMembersButtonText: {
    fontSize: FONT_SIZE_XSMALL,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: '#3A1A1A',
    borderRadius: BORDER_RADIUS,
    padding: PADDING_SMALL,
    marginBottom: verticalScale(4),
    borderWidth: 1,
    borderColor: '#FF4444',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: FONT_SIZE_XSMALL,
    fontWeight: '600',
    color: '#FF4444',
  },
  memberSearchContainer: {
    padding: 20,
  },
  memberSearchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  memberInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  memberInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  viewMemberButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  viewMemberButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  memberStatsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  memberStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  memberStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  memberStatCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  memberStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  memberStatLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  favoritesContainer: {
    padding: 20,
    paddingBottom: 12,
  },
  favoritesTitle: {
    fontSize: FONT_SIZE_SMALL,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  favoritesList: {
    flexDirection: 'row',
  },
  favoriteChip: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  favoriteChipText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE_XSMALL,
    fontWeight: '500',
  },
  memberHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  favoriteButton: {
    padding: 4,
  },
  viewCalendarButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: BORDER_RADIUS,
    padding: 12,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  viewCalendarButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE_SMALL,
    fontWeight: '600',
  },
  calendarModalScroll: {
    maxHeight: '70%',
  },
  unmarkModalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    borderWidth: 1,
    borderColor: '#333333',
    maxWidth: '90%',
    alignSelf: 'center',
  },
  unmarkModalTitle: {
    fontSize: FONT_SIZE_MEDIUM,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  unmarkModalMessage: {
    fontSize: FONT_SIZE_SMALL,
    color: '#CCCCCC',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  unmarkModalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  unmarkModalButton: {
    flex: 1,
    padding: 14,
    borderRadius: BORDER_RADIUS,
    alignItems: 'center',
    borderWidth: 1,
  },
  unmarkModalCancelButton: {
    backgroundColor: '#1A1A1A',
    borderColor: '#333333',
  },
  unmarkModalConfirmButton: {
    backgroundColor: '#3A1A1A',
    borderColor: '#FF4444',
  },
  unmarkModalCancelText: {
    fontSize: FONT_SIZE_SMALL,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  unmarkModalConfirmText: {
    fontSize: FONT_SIZE_SMALL,
    fontWeight: '600',
    color: '#FF4444',
  },
});
