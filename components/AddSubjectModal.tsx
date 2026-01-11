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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [targetPercentage, setTargetPercentage] = useState('75');
  const [showCustomInput, setShowCustomInput] = useState(false);

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

  const handleAdd = () => {
    const subjectName = showCustomInput ? customSubjectName.trim() : selectedSubject;
    const target = parseInt(targetPercentage, 10);

    if (!subjectName) {
      triggerHaptic('warning');
      Alert.alert('Error', 'Please select or enter a subject name');
      return;
    }

    if (existingSubjects.includes(subjectName)) {
      triggerHaptic('warning');
      Alert.alert('Error', 'This subject already exists');
      return;
    }

    if (isNaN(target) || target < 0 || target > 100) {
      triggerHaptic('warning');
      Alert.alert('Error', 'Target percentage must be between 0 and 100');
      return;
    }

    triggerHaptic('success');
    onAddSubject(subjectName, target);
    handleClose();
  };

  const handleClose = () => {
    setSelectedSubject('');
    setCustomSubjectName('');
    setTargetPercentage('75');
    setShowCustomInput(false);
    onClose();
  };

  const handleDropdownChange = (value: string) => {
    triggerHaptic('light');
    if (value === 'custom') {
      setShowCustomInput(true);
      setSelectedSubject('');
    } else {
      setShowCustomInput(false);
      setSelectedSubject(value);
      setCustomSubjectName('');
    }
  };

  const availableSubjects = PREDEFINED_SUBJECTS.filter(sub => !existingSubjects.includes(sub));
  const allOptions = [
    ...availableSubjects,
    'Add Custom Subject',
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
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

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Subject Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Subject</Text>
              <View style={styles.dropdownContainer}>
                <ScrollView 
                  style={styles.dropdown}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
                  {allOptions.map((option, index) => {
                    const isCustomOption = option === 'Add Custom Subject';
                    const isSelected = !showCustomInput && selectedSubject === option;
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemActive,
                          isCustomOption && styles.customOption,
                        ]}
                        onPress={() => handleDropdownChange(isCustomOption ? 'custom' : option)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextActive,
                            isCustomOption && styles.customOptionText,
                          ]}
                        >
                          {option}
                        </Text>
                        {isSelected && !isCustomOption && (
                          <Ionicons name="checkmark" size={20} color="#FF6500" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* Custom Subject Input */}
            {showCustomInput && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Custom Subject Name</Text>
                <TextInput
                  style={styles.input}
                  value={customSubjectName}
                  onChangeText={setCustomSubjectName}
                  placeholder="Enter subject name"
                  placeholderTextColor="#666666"
                  maxLength={50}
                  autoFocus={true}
                />
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
          </ScrollView>

          {/* Add Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.7}>
              <Text style={styles.addButtonText}>Add Subject</Text>
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
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
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
    maxHeight: 500,
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
  dropdownContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    maxHeight: 200,
  },
  dropdown: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#FFFFFF',
  },
  dropdownItemActive: {
    backgroundColor: '#2A2A2A',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    fontFamily: 'Stark',
  },
  dropdownItemTextActive: {
    color: '#FF6500',
    fontWeight: '600',
    fontFamily: 'Stark',
  },
  customOption: {
    borderTopWidth: 0.5,
    borderTopColor: '#FFFFFF',
    marginTop: 4,
  },
  customOptionText: {
    color: '#FF6500',
    fontStyle: 'italic',
    fontFamily: 'Stark',
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
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#FFFFFF',
    marginTop: 20,
  },
  addButton: {
    backgroundColor: '#FF6500',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Stark',
  },
});
