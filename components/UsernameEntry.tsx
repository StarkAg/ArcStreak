// Username entry component
// Allows user to enter/change their username for cloud sync

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { saveUsername, getStoredUsername } from '../utils/usernameStorage';

interface UsernameEntryProps {
  visible: boolean;
  onClose: () => void;
  onUsernameSet: (username: string) => void;
}

export default function UsernameEntry({ visible, onClose, onUsernameSet }: UsernameEntryProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing username when modal opens
  React.useEffect(() => {
    if (visible) {
      getStoredUsername().then((stored) => {
        if (stored) {
          setUsername(stored);
        }
      });
    }
  }, [visible]);

  const handleSave = async () => {
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      triggerHaptic('warning');
      Alert.alert('Invalid Username', 'Please enter a username');
      return;
    }

    if (trimmedUsername.length < 3) {
      triggerHaptic('warning');
      Alert.alert('Invalid Username', 'Username must be at least 3 characters');
      return;
    }

    if (trimmedUsername.length > 20) {
      triggerHaptic('warning');
      Alert.alert('Invalid Username', 'Username must be less than 20 characters');
      return;
    }

    // Validate username format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      triggerHaptic('warning');
      Alert.alert('Invalid Username', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      setLoading(true);
      triggerHaptic('medium');
      await saveUsername(trimmedUsername);
      onUsernameSet(trimmedUsername);
      triggerHaptic('success');
      Alert.alert('Success', `Username set to: ${trimmedUsername}`);
      onClose();
    } catch (error) {
      console.error('Error saving username:', error);
      triggerHaptic('error');
      Alert.alert('Error', 'Failed to save username');
    } finally {
      setLoading(false);
    }
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    try {
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      // Haptics not available
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Set Username</Text>
          <Text style={styles.subtitle}>
            Enter a username to sync your data across devices
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter username"
            placeholderTextColor="#666666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            editable={!loading}
          />

          <Text style={styles.hint}>
            Username must be 3-20 characters (letters, numbers, underscores only)
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                triggerHaptic('light');
                onClose();
              }}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Stark',
  },
  subtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Stark',
  },
  input: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 8,
    fontFamily: 'Stark',
  },
  hint: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Stark',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Stark',
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Stark',
  },
});

