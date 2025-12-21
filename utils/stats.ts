import { GymDay, Stats } from '../types';

export const calculateStats = (gymDays: GymDay[]): Stats => {
  const totalDays = gymDays.length;
  
  // Calculate current streak (consecutive days ending on the most recent marked date)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (gymDays.length === 0) {
    return {
      totalDays: 0,
      currentStreak: 0,
      currentMonthCount: 0,
    };
  }
  
  // Create a Set of gym day dates for O(1) lookup
  const gymDaySet = new Set(gymDays.map((day) => day.date));
  
  // Sort gym days by date (newest first) to find the most recent marked date
  const sortedDays = [...gymDays].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Find the streak ending on the most recent marked date
  let currentStreak = 0;
  const mostRecentDate = new Date(sortedDays[0].date);
  mostRecentDate.setHours(0, 0, 0, 0);
  
  let checkDate = new Date(mostRecentDate);
  
  // Count consecutive days backwards from the most recent marked date
  while (true) {
    const dateStr = formatDate(checkDate);
    
    if (gymDaySet.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Streak is broken
      break;
    }
  }
  
  // Calculate current month count
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const currentMonthCount = gymDays.filter((day) => {
    const date = new Date(day.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  
  return {
    totalDays,
    currentStreak,
    currentMonthCount,
  };
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

