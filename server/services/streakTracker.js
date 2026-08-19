const User = require('../models/User');

const getTodayString = (dateObj = new Date()) => {
  return dateObj.toISOString().split('T')[0];
};

const getYesterdayString = (dateObj = new Date()) => {
  const yesterday = new Date(dateObj);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

/**
 * Record study activity for a user and calculate streak
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
      // Studied yesterday, increment streak
      newStreak = newStreak + 1;
    } else {
      // Missed a day or first time, reset streak to 1
      newStreak = 1;
    }

    user.lastStudyDate = todayStr;
    user.studyStreak = newStreak;

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

    // Keep last 90 days of activity to prevent infinite document growth
    if (user.studyActivity.length > 90) {
      user.studyActivity = user.studyActivity.slice(-90);
    }

    await user.save();
    return {
      studyStreak: user.studyStreak,
      lastStudyDate: user.studyLastStudyDate,
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
