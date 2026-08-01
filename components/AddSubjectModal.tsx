import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AddSubjectModalProps {
  visible: boolean;
  onClose: () => void;
  onAddSubject: (subjectName: string, targetPercentage: number) => void;
  existingSubjects: string[];
  customSubjects: string[];
}

const PREDEFINED_SUBJECTS = [
  'Public Speaking & Creative Writing (PSCW)',
  'Web Application of Business (WAB)',
  'Emotional Intelligence (EI)',
  'Qualitative Data Analysis (QDA)',
  'Marketing Management (MM)',
  'Business Economics (BE)',
  'Organizational Behavior (OB)',
];

export default function AddSubjectModal({
  visible,
  onClose,
  onAddSubject,
  existingSubjects,
  customSubjects,
}: AddSubjectModalProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [targetPercentage, setTargetPercentage] = useState('75');
  const [addedSubjects, setAddedSubjects] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'warning' | 'success') => {
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
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    } catch (error) {
      // Silently fail if haptics not available
    }
  };

  // Filter subjects based on search query
  const allSubjects = [...PREDEFINED_SUBJECTS, ...customSubjects];
  const availableSubjects = allSubjects.filter(
    (sub) => !existingSubjects.includes(sub) && !addedSubjects.includes(sub)
  );
  
  const filteredSubjects = searchQuery.trim()
    ? availableSubjects.filter((sub) =>
        sub.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableSubjects;

  const handleAddSubject = (subjectName: string) => {
    if (existingSubjects.includes(subjectName) || addedSubjects.includes(subjectName)) {
      triggerHaptic('warning');
      Alert.alert('Error', 'This subject is already added');
      return;
    }

    triggerHaptic('success');
    setAddedSubjects([...addedSubjects, subjectName]);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleRemoveAddedSubject = (subjectName: string) => {
    triggerHaptic('light');
    setAddedSubjects(addedSubjects.filter((sub) => sub !== subjectName));
  };

  const handleConfirmAdd = () => {
    if (addedSubjects.length === 0) {
      triggerHaptic('warning');
      Alert.alert('Error', 'Please add at least one subject');
      return;
    }

    const target = parseInt(targetPercentage, 10);
    if (isNaN(target) || target < 0 || target > 100) {
      triggerHaptic('warning');
      Alert.alert('Error', 'Target percentage must be between 0 and 100');
      return;
    }

    // Add all subjects
    addedSubjects.forEach((subjectName) => {
      onAddSubject(subjectName, target);
    });

    triggerHaptic('success');
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setTargetPercentage('75');
    setAddedSubjects([]);
    setShowResults(false);
    onClose();
  };

  // If search query doesn't match any subject, allow adding as custom
  const canAddCustom = searchQuery.trim() && 
    !filteredSubjects.some(sub => sub.toLowerCase() === searchQuery.toLowerCase().trim()) &&
    !existingSubjects.includes(searchQuery.trim()) &&
    !addedSubjects.includes(searchQuery.trim());

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={0}
          >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                  <Text style={styles.title}>Add Subject</Text>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('light');
                      handleClose();
                    }}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.content}>
            {/* Search Box */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Search Subjects</Text>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Type to search subjects..."
                  placeholderTextColor="#666666"
                  autoFocus={true}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setShowResults(true);
                    }}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#A0A0A0" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Search Results */}
            {showResults && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Search Results</Text>
                <View style={styles.resultsContainer}>
                  {filteredSubjects.length > 0 ? (
                    <FlatList
                      data={filteredSubjects}
                      keyExtractor={(item, index) => `${item}-${index}`}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.resultItem}
                          onPress={() => handleAddSubject(item)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.resultItemText}>{item}</Text>
                          <Ionicons name="add-circle" size={20} color="#FF6500" />
                        </TouchableOpacity>
                      )}
                      nestedScrollEnabled={true}
                      scrollEnabled={true}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={true}
                    />
                  ) : canAddCustom ? (
                    <TouchableOpacity
                      style={styles.resultItem}
                      onPress={() => handleAddSubject(searchQuery.trim())}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.resultItemText}>
                        Add "{searchQuery.trim()}" as custom subject
                      </Text>
                      <Ionicons name="add-circle" size={20} color="#FF6500" />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.noResultsText}>No subjects found</Text>
                  )}
                </View>
              </View>
            )}

            {/* Added Subjects List */}
            {addedSubjects.length > 0 && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Added Subjects ({addedSubjects.length})</Text>
                <View style={styles.addedContainer}>
                  {addedSubjects.map((subjectName, index) => (
                    <View key={index} style={styles.addedItem}>
                      <Text style={styles.addedItemText}>{subjectName}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveAddedSubject(subjectName)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Target Percentage */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Target Attendance (%)</Text>
              <TextInput
                style={styles.input}
                value={targetPercentage}
                onChangeText={setTargetPercentage}
                placeholder="75"
                placeholderTextColor="#666666"
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>

          {/* Add Button */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <TouchableOpacity 
              style={[styles.addButton, addedSubjects.length === 0 && styles.addButtonDisabled]} 
              onPress={handleConfirmAdd} 
              activeOpacity={0.7}
              disabled={addedSubjects.length === 0}
            >
              <Text style={styles.addButtonText}>
                Add {addedSubjects.length > 0 ? `${addedSubjects.length} ` : ''}Subject{addedSubjects.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-start',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flex: 1,
    flexDirection: 'column',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Stark',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    flex: 1,
    paddingBottom: 80,
  },
  inputContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0A0',
    marginBottom: 8,
    fontFamily: 'Stark',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 12,
    fontFamily: 'Stark',
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    maxHeight: 200,
    padding: 8,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2A2A2A',
  },
  resultItemText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    fontFamily: 'Stark',
  },
  noResultsText: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: 'Stark',
  },
  addedContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    padding: 8,
    maxHeight: 200,
  },
  addedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2A2A2A',
  },
  addedItemText: {
    fontSize: 14,
    color: '#FF6500',
    flex: 1,
    fontFamily: 'Stark',
  },
  removeButton: {
    padding: 4,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    fontFamily: 'Stark',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#FFFFFF',
    backgroundColor: '#1A1A1A',
  },
  addButton: {
    backgroundColor: '#FF6500',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#2A2A2A',
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Stark',
  },
});
