const User = require('../models/User');

/**
 * Returns 'YYYY-MM-DD' in local time (not UTC).
 * Using toISOString() would give UTC midnight which is wrong for
 * users in UTC+N timezones — their local day starts before UTC rolls over.
 */
const getTodayString = (dateObj = new Date()) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getYesterdayString = (dateObj = new Date()) => {
  const yesterday = new Date(dateObj);
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, '0');
  const d = String(yesterday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Record study activity for a user and calculate streak + longestStreak
 */
const recordUserActivity = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const todayStr = getTodayString();
    const yesterdayStr = getYesterdayString();

    let newStreak = user.studyStreak || 0;

    // Check streak status
    if (user.lastStudyDate === todayStr) {
      // Already studied today, keep current streak
    } else if (user.lastStudyDate === yesterdayStr) {
      // Studied yesterday — extend streak
      newStreak = newStreak + 1;
    } else {
      // Missed a day or first time — reset streak to 1
      newStreak = 1;
    }

    user.lastStudyDate = todayStr;
    user.studyStreak = newStreak;

    // Update longestStreak if current streak surpasses it
    if (newStreak > (user.longestStreak || 0)) {
      user.longestStreak = newStreak;
    }

    // Update studyActivity array for today
    if (!user.studyActivity) {
      user.studyActivity = [];
    }

    const todayEntryIndex = user.studyActivity.findIndex(a => a.date === todayStr);
    if (todayEntryIndex >= 0) {
      user.studyActivity[todayEntryIndex].count += 1;
    } else {
      user.studyActivity.push({ date: todayStr, count: 1 });
    }

    // Keep last 365 days of activity to prevent infinite document growth
    if (user.studyActivity.length > 365) {
      user.studyActivity = user.studyActivity.slice(-365);
    }

    await user.save();

    return {
      studyStreak: user.studyStreak,
      longestStreak: user.longestStreak,
      lastStudyDate: user.lastStudyDate,
      todayCount: user.studyActivity.find(a => a.date === todayStr)?.count || 1
    };
  } catch (err) {
    console.error('Failed to record user activity:', err);
    return null;
  }
};

module.exports = {
  recordUserActivity,
  getTodayString
};
