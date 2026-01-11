import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Linking, Alert, ActivityIndicator, ScrollView, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Updates from 'expo-updates';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { getStoredUsername, clearUsername } from '../../utils/usernameStorage';
import { getGymDays, getHighestStreak, setHighestStreak, clearAllGymDays, saveGymDay } from '../../utils/storage';
import { getCloudGymDays, saveCloudGymDays, getCloudHighestStreak, saveCloudHighestStreak } from '../../utils/supabaseStorage';
import { GymDay } from '../../types';
import UsernameEntry from '../../components/UsernameEntry';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeMode } from '../../utils/themeStorage';

// Import logos
const linkedinLogo = require('../../assets/linkedin-logo.png');
const arcReactorLogo = require('../../assets/arc-reactor.png');
import GithubIcon from '../../components/GithubIcon';

export default function SettingsScreen() {
  const { themeMode, colors, setThemeMode } = useTheme();
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicSound, setMusicSound] = useState<Audio.Sound | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'downloading' | 'success' | 'error'>('idle');
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const themeIconRotation = useRef(new Animated.Value(0)).current;
  const themeIconScale = useRef(new Animated.Value(1)).current;

  // Load username on mount
  useEffect(() => {
    getStoredUsername().then((storedUsername) => {
      setUsername(storedUsername);
    });
  }, []);

  // Music playback for arc reactor
  useEffect(() => {
    return () => {
      if (musicSound) {
        musicSound.unloadAsync();
      }
    };
  }, [musicSound]);

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
            require('../../assets/back-in-black.mp3'),
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

  const openLink = async (url: string) => {
    triggerHaptic('light');
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleSync = async () => {
    if (!username) {
      setShowUsernameModal(true);
      return;
    }

    try {
      setSyncStatus('syncing');
      setSyncMessage('Syncing...');
      triggerHaptic('medium');

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
        setSyncMessage('Downloading from cloud...');
      } else if (localGymDays.length > cloudGymDays.length) {
        setSyncMessage('Uploading to cloud...');
      } else {
        // Same count, check if dates are different
        const localDates = new Set(localGymDays.map(d => d.date));
        const cloudDates = new Set(cloudGymDays.map(d => d.date));
        const datesMatch = localDates.size === cloudDates.size && 
          Array.from(localDates).every(date => cloudDates.has(date));
        
        if (!datesMatch) {
          setSyncMessage('Syncing...');
        } else {
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

      setSyncStatus('success');
      setSyncMessage('Sync successful!');
      triggerHaptic('success');

      // Clear status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error syncing:', error);
      setSyncStatus('error');
      setSyncMessage('Sync failed. Check connection.');
      triggerHaptic('warning');
      
      // Clear error status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncMessage('');
      }, 3000);
    }
  };

  const handleUsernameSet = (newUsername: string) => {
    setUsername(newUsername);
    setShowUsernameModal(false);
  };

  const cycleTheme = () => {
    triggerHaptic('light');
    
    // Animate icon
    themeIconRotation.setValue(0);
    themeIconScale.setValue(1);
    
    Animated.parallel([
      Animated.timing(themeIconRotation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(themeIconScale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(themeIconScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Cycle through themes: dark -> light -> auto -> dark
    const themeOrder: ThemeMode[] = ['dark', 'light', 'auto'];
    const currentIndex = themeOrder.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setThemeMode(themeOrder[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'dark':
        return 'moon';
      case 'light':
        return 'sunny';
      case 'auto':
        return 'phone-portrait';
      default:
        return 'moon';
    }
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'dark':
        return 'Dark';
      case 'light':
        return 'Light';
      case 'auto':
        return 'Auto';
      default:
        return 'Auto';
    }
  };

  const handleUpdate = async () => {
    try {
      // Check if updates are enabled
      if (!Updates.isEnabled) {
        Alert.alert(
          'Updates',
          'OTA updates are only available in production builds. In development mode, updates are disabled.',
          [{ text: 'OK' }]
        );
        return;
      }

      setUpdateStatus('checking');
      setUpdateMessage('Checking for updates...');
      triggerHaptic('light');

      // Check for available updates
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        setUpdateStatus('downloading');
        setUpdateMessage('Downloading update...');
        
        // Download the update
        await Updates.fetchUpdateAsync();
        
        setUpdateStatus('success');
        setUpdateMessage('Update ready! Reloading...');
        triggerHaptic('success');
        
        // Reload the app to apply the update
        await Updates.reloadAsync();
      } else {
        setUpdateStatus('success');
        setUpdateMessage('App is up to date!');
        triggerHaptic('success');
        
        setTimeout(() => {
          setUpdateStatus('idle');
          setUpdateMessage('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateStatus('error');
      setUpdateMessage('Update check failed');
      triggerHaptic('warning');
      
      setTimeout(() => {
        setUpdateStatus('idle');
        setUpdateMessage('');
      }, 3000);
    }
  };

  const spin = themeIconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    title: { color: colors.text },
    syncButton: { backgroundColor: colors.surface, borderColor: colors.border },
    syncButtonSyncing: { backgroundColor: colors.surface, borderColor: colors.success },
    syncButtonSuccess: { backgroundColor: colors.surface, borderColor: colors.success },
    syncButtonError: { backgroundColor: colors.surface, borderColor: colors.error },
    syncButtonText: { color: colors.text },
    syncStatusText: { color: colors.textSecondary },
    updateButton: { backgroundColor: colors.surface, borderColor: colors.border },
    updateButtonChecking: { backgroundColor: colors.surface, borderColor: colors.primary },
    updateButtonSuccess: { backgroundColor: colors.surface, borderColor: colors.success },
    updateButtonError: { backgroundColor: colors.surface, borderColor: colors.error },
    updateButtonText: { color: colors.text },
    updateStatusText: { color: colors.textSecondary },
    logoutButton: { backgroundColor: colors.surface, borderColor: colors.error },
    logoutButtonText: { color: colors.error },
    footer: { borderTopColor: colors.border },
    footerText: { color: colors.textSecondary },
    themeButton: { backgroundColor: colors.surface, borderColor: colors.border },
    themeButtonText: { color: colors.text },
    themeButtonLabel: { color: colors.textSecondary },
    logo: { tintColor: colors.text },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, dynamicStyles.title]}>Settings</Text>

          {/* Theme Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.themeButton, dynamicStyles.themeButton]}
              onPress={cycleTheme}
              activeOpacity={0.7}
            >
              <View style={styles.themeButtonContent}>
                <View style={styles.themeIconContainer}>
                  <Animated.View
                    style={{
                      transform: [
                        { rotate: spin },
                        { scale: themeIconScale },
                      ],
                    }}
                  >
                    <Ionicons name={getThemeIcon()} size={24} color={colors.text} />
                  </Animated.View>
                </View>
                <View style={styles.themeButtonTextContainer}>
                  <Text style={[styles.themeButtonText, dynamicStyles.themeButtonText]}>Theme</Text>
                  <Text style={[styles.themeButtonLabel, dynamicStyles.themeButtonLabel]}>{getThemeLabel()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Sign In / Sync Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.syncButton,
                dynamicStyles.syncButton,
                syncStatus === 'syncing' && dynamicStyles.syncButtonSyncing,
                syncStatus === 'success' && dynamicStyles.syncButtonSuccess,
                syncStatus === 'error' && dynamicStyles.syncButtonError,
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
                    <ActivityIndicator size="small" color={colors.text} style={styles.syncIcon} />
                    <Text style={[styles.syncButtonText, dynamicStyles.syncButtonText]}>Syncing...</Text>
                  </>
                ) : username ? (
                  <>
                    <Text style={[styles.syncButtonText, dynamicStyles.syncButtonText]}>Sync to Cloud</Text>
                    <Ionicons name="cloud" size={18} color={colors.text} style={styles.buttonIconRight} />
                  </>
                ) : (
                  <Text style={[styles.syncButtonText, dynamicStyles.syncButtonText]}>Sign In</Text>
                )}
              </View>
              {syncMessage ? (
                <Text style={[styles.syncStatusText, dynamicStyles.syncStatusText]}>{syncMessage}</Text>
              ) : username ? (
                <Text style={[styles.syncStatusText, dynamicStyles.syncStatusText]}>Signed in as: {username}</Text>
              ) : null}
            </TouchableOpacity>

            {/* Logout Button */}
            {username && (
              <TouchableOpacity
                style={[styles.logoutButton, dynamicStyles.logoutButton]}
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
                <Text style={[styles.logoutButtonText, dynamicStyles.logoutButtonText]}>Logout</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* OTA Update Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.updateButton,
                dynamicStyles.updateButton,
                updateStatus === 'checking' && dynamicStyles.updateButtonChecking,
                updateStatus === 'downloading' && dynamicStyles.updateButtonChecking,
                updateStatus === 'success' && dynamicStyles.updateButtonSuccess,
                updateStatus === 'error' && dynamicStyles.updateButtonError,
              ]}
              onPress={handleUpdate}
              disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
              activeOpacity={0.7}
            >
              <View style={styles.syncButtonContent}>
                {updateStatus === 'checking' || updateStatus === 'downloading' ? (
                  <>
                    <ActivityIndicator size="small" color={colors.text} style={styles.syncIcon} />
                    <Text style={[styles.syncButtonText, dynamicStyles.updateButtonText]}>
                      {updateStatus === 'checking' ? 'Checking...' : 'Downloading...'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.syncButtonText, dynamicStyles.updateButtonText]}>Check for Updates</Text>
                    <Ionicons name="refresh" size={18} color={colors.text} style={styles.buttonIconRight} />
                  </>
                )}
              </View>
              {updateMessage ? (
                <Text style={[styles.syncStatusText, dynamicStyles.updateStatusText]}>{updateMessage}</Text>
              ) : (
                <Text style={[styles.syncStatusText, dynamicStyles.updateStatusText]}>
                  Tap to fetch latest app updates
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer with Credits */}
          <View style={[styles.footer, dynamicStyles.footer]}>
            <Text style={[styles.footerText, dynamicStyles.footerText]}>Crafted By Harsh (Stark)</Text>
            <View style={styles.logoContainer}>
              <TouchableOpacity
                onPress={() => openLink('https://in.linkedin.com/in/harshxagarwal')}
                activeOpacity={0.7}
                style={styles.logoButton}
              >
                <Image 
                  source={linkedinLogo} 
                  style={[styles.logo, dynamicStyles.logo]} 
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
                  style={[styles.logo, dynamicStyles.logo, isMusicPlaying && { tintColor: colors.success }]} 
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openLink('https://github.com/StarkAg')}
                activeOpacity={0.7}
                style={styles.logoButton}
              >
                <GithubIcon size={32} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Username Entry Modal */}
      <UsernameEntry
        visible={showUsernameModal}
        onClose={() => {
          triggerHaptic('light');
          setShowUsernameModal(false);
        }}
        onUsernameSet={handleUsernameSet}
      />
    </SafeAreaView>
  );
}

const LOGO_SIZE = 28;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  themeButton: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  themeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIconContainer: {
    marginRight: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeButtonTextContainer: {
    flex: 1,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  themeButtonLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  syncButton: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  syncButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncIcon: {
    marginRight: 8,
  },
  buttonIconRight: {
    marginLeft: 8,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  syncStatusText: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
  },
  logoutButton: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  updateButton: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 8,
    fontWeight: '500',
    marginBottom: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoButton: {
    padding: 8,
  },
  arcReactorActive: {
    opacity: 1,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
