export interface GymDay {
  date: string;
}

export interface Stats {
  totalDays: number;
  currentStreak: number;
  currentMonthCount: number;
}

export interface Subject {
  id: string;
  username: string;
  subject_name: string;
  total_classes: number;
  absent_classes: number;
  created_at: string;
  updated_at: string;
}

export interface SubjectInput {
  subject_name: string;
  total_classes?: number;
  absent_classes?: number;
}
