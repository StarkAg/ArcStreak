// Subject storage using Supabase
// Tracks subjects with total and absent classes for each user

import { supabase } from '../config/supabase';
import { Subject, SubjectInput } from '../types';
import { getStoredUsername } from './usernameStorage';

// Get current username from AsyncStorage
const getCurrentUsername = async (): Promise<string | null> => {
  return await getStoredUsername();
};

// Get all subjects for current username
export const getCloudSubjects = async (): Promise<Subject[]> => {
  try {
    const username = await getCurrentUsername();
    if (!username) {
      console.warn('No username set, cannot fetch cloud subjects');
      return [];
    }

    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('username', username)
      .order('subject_name', { ascending: true });

    if (error) {
      console.error('Error getting cloud subjects:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting cloud subjects:', error);
    return [];
  }
};

// Get a single subject by ID
export const getCloudSubject = async (subjectId: string): Promise<Subject | null> => {
  try {
    const username = await getCurrentUsername();
    if (!username) {
      console.warn('No username set, cannot fetch cloud subject');
      return null;
    }

    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return null;
      }
      console.error('Error getting cloud subject:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting cloud subject:', error);
    return null;
  }
};

// Create a new subject
export const createCloudSubject = async (subject: SubjectInput): Promise<Subject | null> => {
  try {
    const username = await getCurrentUsername();
    if (!username) {
      console.warn('No username set, cannot create cloud subject');
      return null;
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert({
        username,
        subject_name: subject.subject_name,
        total_classes: subject.total_classes || 0,
        absent_classes: subject.absent_classes || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cloud subject:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating cloud subject:', error);
    throw error;
  }
};

// Update an existing subject
export const updateCloudSubject = async (
  subjectId: string,
  updates: Partial<SubjectInput>
): Promise<Subject | null> => {
  try {
    const username = await getCurrentUsername();
    if (!username) {
      console.warn('No username set, cannot update cloud subject');
      return null;
    }

    const updateData: any = {};
    if (updates.subject_name !== undefined) updateData.subject_name = updates.subject_name;
    if (updates.total_classes !== undefined) updateData.total_classes = updates.total_classes;
    if (updates.absent_classes !== undefined) updateData.absent_classes = updates.absent_classes;

    const { data, error } = await supabase
      .from('subjects')
      .update(updateData)
      .eq('id', subjectId)
      .eq('username', username)
      .select()
      .single();

    if (error) {
      console.error('Error updating cloud subject:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating cloud subject:', error);
    throw error;
  }
};

// Delete a subject
export const deleteCloudSubject = async (subjectId: string): Promise<void> => {
  try {
    const username = await getCurrentUsername();
    if (!username) {
      console.warn('No username set, cannot delete cloud subject');
      return;
    }

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subjectId)
      .eq('username', username);

    if (error) {
      console.error('Error deleting cloud subject:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting cloud subject:', error);
    throw error;
  }
};

// Increment total classes for a subject
export const incrementTotalClasses = async (subjectId: string): Promise<Subject | null> => {
  try {
    const subject = await getCloudSubject(subjectId);
    if (!subject) {
      return null;
    }

    return await updateCloudSubject(subjectId, {
      total_classes: subject.total_classes + 1,
    });
  } catch (error) {
    console.error('Error incrementing total classes:', error);
    throw error;
  }
};

// Increment absent classes for a subject
export const incrementAbsentClasses = async (subjectId: string): Promise<Subject | null> => {
  try {
    const subject = await getCloudSubject(subjectId);
    if (!subject) {
      return null;
    }

    return await updateCloudSubject(subjectId, {
      absent_classes: subject.absent_classes + 1,
    });
  } catch (error) {
    console.error('Error incrementing absent classes:', error);
    throw error;
  }
};

// Get attendance percentage for a subject
export const getAttendancePercentage = (subject: Subject): number => {
  if (subject.total_classes === 0) {
    return 0;
  }
  const present = subject.total_classes - subject.absent_classes;
  return Math.round((present / subject.total_classes) * 100);
};

// Get all subjects for a specific user (for viewing other users)
export const getOtherUserSubjects = async (targetUsername: string): Promise<Subject[]> => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('username', targetUsername)
      .order('subject_name', { ascending: true });

    if (error) {
      console.error('Error getting other user subjects:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting other user subjects:', error);
    return [];
  }
};

