// Spaced Repetition System (SRS) Engine
// Implements SuperMemo-2 (SM-2) and Free Spaced Repetition Scheduler (FSRS-4.5) algorithms.

// FSRS-4.5 Default Weights
const FSRS_WEIGHTS = [
  0.4, 0.6, 2.4, 5.8, // Initial stabilities for ratings 1..4
  4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61
];

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function formatIntervalLabel(days) {
  if (days <= 0.015) return '10m';
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours || 1}h`;
  }
  if (days < 30) {
    const roundedDays = Math.round(days);
    return `${roundedDays}d`;
  }
  if (days < 365) {
    const months = (days / 30).toFixed(1);
    return `${months}m`;
  }
  const years = (days / 365).toFixed(1);
  return `${years}y`;
}

/**
 * SuperMemo 2 (SM-2) Algorithm
 * @param {Object} card 
 * @param {Number} rating 1: Again, 2: Hard, 3: Good, 4: Easy
 */
function calculateSM2(card, rating) {
  let { reps = 0, lapses = 0, interval = 0, easeFactor = 2.5 } = card;

  // Grade mapping for SM-2 formula: 1 -> 1, 2 -> 3, 3 -> 4, 4 -> 5
  const gradeMap = { 1: 1, 2: 3, 3: 4, 4: 5 };
  const grade = gradeMap[rating] || 3;

  // Calculate new Ease Factor
  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  let newState = 'review';
  let newInterval = 1;

  if (rating === 1) {
    // Again / Fail
    reps = 0;
    lapses += 1;
    newInterval = 0.007; // ~10 minutes
    newState = 'relearning';
  } else {
    // Pass (Hard, Good, Easy)
    if (reps === 0) {
      newInterval = 1;
    } else if (reps === 1) {
      newInterval = rating === 2 ? 2 : 6;
    } else {
      let multiplier = easeFactor;
      if (rating === 2) multiplier *= 0.85; // Hard penalty
      if (rating === 4) multiplier *= 1.3;  // Easy bonus
      newInterval = Math.max(1, Math.round(interval * multiplier));
    }
    reps += 1;
    newState = 'review';
  }

  const now = new Date();
  const dueDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    srsAlgorithm: 'sm2',
    state: newState,
    reps,
    lapses,
    interval: Number(newInterval.toFixed(3)),
    easeFactor: Number(easeFactor.toFixed(3)),
    stability: card.stability || 0.4,
    difficulty: card.difficulty || 5.0,
    lastReviewed: now,
    dueDate
  };
}

/**
 * Free Spaced Repetition Scheduler (FSRS-4.5) Algorithm
 * @param {Object} card 
 * @param {Number} rating 1: Again, 2: Hard, 3: Good, 4: Easy
 * @param {Number} desiredRetention Default: 0.9 (90%)
 */
function calculateFSRS(card, rating, desiredRetention = 0.9) {
  const w = FSRS_WEIGHTS;
  const now = new Date();
  
  let { 
    reps = 0, 
    lapses = 0, 
    stability = w[2], 
    difficulty = 5.0, 
    lastReviewed = null 
  } = card;

  // Calculate elapsed days since last review
  let elapsedDays = 0;
  if (lastReviewed) {
    elapsedDays = (now.getTime() - new Date(lastReviewed).getTime()) / (1000 * 60 * 60 * 24);
    elapsedDays = Math.max(0, elapsedDays);
  }

  let newStability = stability;
  let newDifficulty = difficulty;
  let newState = 'review';

  const isFirstReview = reps === 0 || !lastReviewed || card.state === 'new';

  if (isFirstReview) {
    // Initial card setup
    newStability = w[rating - 1];
    newDifficulty = clamp(w[4] - (rating - 3) * w[5], 1, 10);
    
    if (rating === 1) {
      reps = 0;
      lapses += 1;
      newState = 'learning';
    } else {
      reps = 1;
      newState = 'review';
    }
  } else {
    // Retrievability decay formula: R = (1 + t / (9 * S))^-1
    const retrievability = Math.pow(1 + elapsedDays / (9 * stability), -1);

    // Update Difficulty: D_new = clamp(w[7]*D_0 + (1-w[7])*(D - w[6]*(r-3)), 1, 10)
    const initDiff = w[4]; // D_0(3)
    const rawDiff = difficulty - w[6] * (rating - 3);
    newDifficulty = clamp(w[7] * initDiff + (1 - w[7]) * rawDiff, 1, 10);

    if (rating === 1) {
      // Forgotten / Again
      // S_forget = w[11] * D^-w[12] * ((S + 1)^w[13] - 1) * e^(w[14] * (1 - R))
      newStability = w[11] * 
        Math.pow(newDifficulty, -w[12]) * 
        (Math.pow(stability + 1, w[13]) - 1) * 
        Math.exp(w[14] * (1 - retrievability));
      
      newStability = clamp(newStability, 0.1, 36500);
      reps = 0;
      lapses += 1;
      newState = 'relearning';
    } else {
      // Successful Recall (Hard, Good, Easy)
      let modifier = 1.0;
      if (rating === 2) modifier = w[15]; // Hard penalty
      if (rating === 4) modifier = w[16]; // Easy bonus

      // S_recall = S * (1 + e^w[8] * (11 - D) * S^-w[9] * (e^(w[10]*(1-R)) - 1) * modifier)
      const recallFactor = Math.exp(w[8]) * 
        (11 - newDifficulty) * 
        Math.pow(stability, -w[9]) * 
        (Math.exp(w[10] * (1 - retrievability)) - 1) * 
        modifier;

      newStability = stability * (1 + recallFactor);
      newStability = clamp(newStability, 0.1, 36500);
      reps += 1;
      newState = 'review';
    }
  }

  // Calculate Next Interval: I = S * ln(retention) / ln(0.9)
  let newInterval = newStability * (Math.log(desiredRetention) / Math.log(0.9));
  if (rating === 1) {
    newInterval = 0.007; // ~10 minutes
  } else {
    newInterval = Math.max(1, newInterval);
  }

  const dueDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    srsAlgorithm: 'fsrs',
    state: newState,
    reps,
    lapses,
    interval: Number(newInterval.toFixed(3)),
    easeFactor: card.easeFactor || 2.5,
    stability: Number(newStability.toFixed(3)),
    difficulty: Number(newDifficulty.toFixed(3)),
    lastReviewed: now,
    dueDate
  };
}

/**
 * Preview next review intervals for all 4 ratings (1: Again, 2: Hard, 3: Good, 4: Easy)
 * @param {Object} card 
 * @param {String} algorithm 'sm2' | 'fsrs'
 */
function previewNextIntervals(card, algorithm = 'fsrs') {
  const ratings = [1, 2, 3, 4];
  const previews = {};

  ratings.forEach((rating) => {
    const updated = algorithm === 'sm2' 
      ? calculateSM2(card, rating) 
      : calculateFSRS(card, rating);

    previews[rating] = {
      interval: updated.interval,
      label: formatIntervalLabel(updated.interval)
    };
  });

  return previews;
}

module.exports = {
  calculateSM2,
  calculateFSRS,
  previewNextIntervals,
  formatIntervalLabel
};
