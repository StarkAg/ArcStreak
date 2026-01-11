import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { Subject } from '../types';
import { getAttendancePercentage } from '../utils/subjectStorage';
import * as Haptics from 'expo-haptics';

interface SubjectCardProps {
  subject: Subject;
  onMarkPresent: (subjectId: string) => void;
  onMarkAbsent: (subjectId: string) => void;
}

export default function SubjectCard({ subject, onMarkPresent, onMarkAbsent }: SubjectCardProps) {
  const pan = React.useRef(new Animated.ValueXY()).current;
  const SWIPE_THRESHOLD = 50;

  const attendancePercentage = getAttendancePercentage(subject);
  const presentCount = subject.total_classes - subject.absent_classes;
  const absentCount = subject.absent_classes;
  
  // Calculate required and margin classes
  const targetPercentage = 75; // Default, can be made configurable
  const requiredClasses = Math.ceil((targetPercentage / 100) * subject.total_classes - presentCount);
  const marginClasses = Math.floor(presentCount - (targetPercentage / 100) * subject.total_classes);

  // Determine color based on attendance percentage
  const getPercentageColor = () => {
    if (attendancePercentage >= 75) return '#FF6500'; // orange (premium theme)
    if (attendancePercentage >= 65) return '#FF9800'; // amber
    return '#FF6B6B'; // red
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe right - Present
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
          triggerHaptic('light');
          onMarkPresent(subject.id);
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe left - Absent
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
          triggerHaptic('light');
          onMarkAbsent(subject.id);
        } else {
          // Reset position
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy') => {
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
      }
    } catch (error) {
      // Silently fail if haptics not available
    }
  };

  const handlePresent = () => {
    triggerHaptic('light');
    onMarkPresent(subject.id);
  };

  const handleAbsent = () => {
    triggerHaptic('light');
    onMarkAbsent(subject.id);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateX: pan.x }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.cardContent}>
        {/* Top Row: Subject Name and Percentage */}
        <View style={styles.topRow}>
          <View style={styles.subjectNameContainer}>
            <Text style={styles.subjectName} numberOfLines={2}>
              {subject.subject_name}
            </Text>
          </View>
          <Text style={[styles.percentage, { color: getPercentageColor() }]}>
            {attendancePercentage.toFixed(2)}%
          </Text>
        </View>

        {/* Decision Line */}
        <View style={styles.decisionLine}>
          <Text style={styles.decisionLabel}>Must attend </Text>
          <Text style={[styles.decisionValue, requiredClasses > 0 && styles.decisionValueRed]}>
            {Math.max(0, requiredClasses)} class{requiredClasses !== 1 ? 'es' : ''}
          </Text>
          <Text style={styles.decisionSeparator}> • </Text>
          <Text style={styles.decisionLabel}>Can skip </Text>
          <Text style={[styles.decisionValue, marginClasses >= 1 && styles.decisionValueGreen]}>
            {Math.max(0, marginClasses)} class{marginClasses !== 1 ? 'es' : ''}
          </Text>
        </View>

        {/* Stats Line */}
        <View style={styles.statsLine}>
          <Text style={styles.statsText}>
            Present: {presentCount} • Absent: {absentCount} • Total: {subject.total_classes}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.presentButton]}
            onPress={handlePresent}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>✅ Mark Present</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.absentButton]}
            onPress={handleAbsent}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>❌ Mark Absent</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
  },
  cardContent: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
    fontFamily: 'Stark',
  },
  percentage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6500',
    fontFamily: 'Stark',
  },
  decisionLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  decisionLabel: {
    fontSize: 13,
    color: '#A0A0A0',
    fontFamily: 'Stark',
  },
  decisionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A0A0',
    fontFamily: 'Stark',
  },
  decisionValueRed: {
    color: '#FF6B6B',
  },
  decisionValueGreen: {
    color: '#FF6500',
  },
  decisionSeparator: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'Stark',
  },
  statsLine: {
    marginBottom: 12,
  },
  statsText: {
    fontSize: 11,
    color: '#A0A0A0',
    fontFamily: 'Stark',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presentButton: {
    backgroundColor: '#2A2A2A',
    borderWidth: 0.5,
    borderColor: '#FF6500',
  },
  absentButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 0.5,
    borderColor: '#FF6B6B',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Stark',
  },
});

