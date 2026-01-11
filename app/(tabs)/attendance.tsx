import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subject } from '../../types';
import {
  getCloudSubjects,
  createCloudSubject,
  incrementTotalClasses,
  incrementAbsentClasses,
  deleteCloudSubject,
} from '../../utils/subjectStorage';
import SubjectCard from '../../components/SubjectCard';
import AddSubjectModal from '../../components/AddSubjectModal';
import * as Haptics from 'expo-haptics';

export default function AttendanceScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCloudSubjects();
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
      Alert.alert('Error', 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success') => {
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
      }
    } catch (error) {
      // Silently fail if haptics not available
    }
  };

  const handleMarkPresent = async (subjectId: string) => {
    try {
      await incrementTotalClasses(subjectId);
      await loadSubjects();
        triggerHaptic('success');
    } catch (error) {
      console.error('Error marking present:', error);
      Alert.alert('Error', 'Failed to mark present');
    }
  };

  const handleMarkAbsent = async (subjectId: string) => {
    try {
      // First increment total classes, then increment absent
      await incrementTotalClasses(subjectId);
      await incrementAbsentClasses(subjectId);
      await loadSubjects();
        triggerHaptic('success');
    } catch (error) {
      console.error('Error marking absent:', error);
      Alert.alert('Error', 'Failed to mark absent');
    }
  };

  const handleAddSubject = async (subjectName: string, targetPercentage: number) => {
    try {
      await createCloudSubject({
        subject_name: subjectName,
        total_classes: 0,
        absent_classes: 0,
      });
      await loadSubjects();
      triggerHaptic('success');
    } catch (error) {
      console.error('Error adding subject:', error);
      Alert.alert('Error', 'Failed to add subject');
    }
  };

  const handleDeleteSubject = (subjectId: string) => {
                Alert.alert(
      'Delete Subject',
      'Are you sure you want to delete this subject?',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
          text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
            try {
              await deleteCloudSubject(subjectId);
              await loadSubjects();
              triggerHaptic('medium');
            } catch (error) {
              console.error('Error deleting subject:', error);
              Alert.alert('Error', 'Failed to delete subject');
            }
                      },
                    },
                  ]
                );
  };

  const existingSubjectNames = subjects.map((s) => s.subject_name);
  
  // Define predefined subjects to identify custom ones
  const PREDEFINED_SUBJECTS = [
    'Public Speaking & Creative Writing (PSCW)',
    'Web Application of Business (WAB)',
    'Emotional Intelligence (EI)',
    'Qualitative Data Analysis (QDA)',
    'Marketing Management (MM)',
    'Business Economics (BE)',
    'Organizational Behavior (OB)',
  ];
  
  // Calculate custom subjects (those not in predefined list)
  const customSubjects = existingSubjectNames.filter(
    (name) => !PREDEFINED_SUBJECTS.includes(name)
  );

  if (loading) {
                        return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading subjects...</Text>
                          </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Title and Add Button */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>SUBJECTS</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            triggerHaptic('light');
            setShowAddModal(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Subjects List */}
      {subjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#666666" />
          <Text style={styles.emptyText}>No subjects yet</Text>
          <Text style={styles.emptySubtext}>Tap + to add your first subject</Text>
              </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SubjectCard
              subject={item}
              onMarkPresent={handleMarkPresent}
              onMarkAbsent={handleMarkAbsent}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Subject Modal */}
      <AddSubjectModal
        visible={showAddModal}
        onClose={() => {
          triggerHaptic('light');
          setShowAddModal(false);
        }}
        onAddSubject={handleAddSubject}
        existingSubjects={existingSubjectNames}
        customSubjects={customSubjects}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#A0A0A0',
    fontFamily: 'Stark',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Stark',
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 80, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Stark',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    fontFamily: 'Stark',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FF6500',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
