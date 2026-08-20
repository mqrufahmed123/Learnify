const QuizAttempt = require('../models/QuizAttempt');
const Flashcard = require('../models/Flashcard');
const Subject = require('../models/Subject');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/analytics/:subjectId
// Returns aggregated learning analytics: quiz trend, card state distribution,
// and a data-driven Ebbinghaus forgetting curve based on the user's actual FSRS stability.
const getSubjectAnalytics = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const userId = req.user.id;

  // Verify subject ownership
  const subject = await Subject.findOne({ _id: subjectId, userId });
  if (!subject) return res.status(404).json({ message: 'Subject not found' });

  // ── 1. Quiz Score Trend ────────────────────────────────────────────────────
  const attempts = await QuizAttempt.find({ subjectId, userId })
    .sort({ createdAt: 1 })
    .select('score totalQuestions createdAt');

  const quizTrend = attempts.map((a) => ({
    label: a.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    date: a.createdAt.toISOString().split('T')[0],
    percentage: Math.round((a.score / a.totalQuestions) * 100),
    score: a.score,
    total: a.totalQuestions,
  }));

  // ── 2. Card State Distribution & SRS Metrics ──────────────────────────────
  const allCards = await Flashcard.find({ subjectId, userId })
    .select('state stability interval reps lapses lastReviewed dueDate');

  const cardStates = { new: 0, learning: 0, review: 0, relearning: 0 };
  let totalStability = 0;
  let stabilityCount = 0;
  let totalInterval = 0;
  let intervalCount = 0;
  let totalLapses = 0;

  allCards.forEach((card) => {
    cardStates[card.state] = (cardStates[card.state] || 0) + 1;
    totalLapses += card.lapses || 0;

    if (card.stability > 0) {
      totalStability += card.stability;
      stabilityCount++;
    }
    if (card.interval > 0) {
      totalInterval += card.interval;
      intervalCount++;
    }
  });

  // Average FSRS stability — the core parameter for the forgetting curve
  const avgStability = stabilityCount > 0
    ? parseFloat((totalStability / stabilityCount).toFixed(2))
    : 4.0; // Sensible default: 4 days

  // Average scheduled interval (where next review fires)
  const avgInterval = intervalCount > 0
    ? Math.round(totalInterval / intervalCount)
    : 7;

  // ── 3. Forgetting Curve via Ebbinghaus/FSRS Formula: R(t) = e^(-t / S) ───
  // R = estimated retention (%), t = days since last review, S = avg stability
  const CURVE_DAYS = 30;
  const forgettingCurve = [];
  for (let day = 0; day <= CURVE_DAYS; day++) {
    const retention = parseFloat((Math.exp(-day / avgStability) * 100).toFixed(1));
    forgettingCurve.push({ day, retention });
  }

  // ── 4. Summary Stats ──────────────────────────────────────────────────────
  const totalCards = allCards.length;
  // "Mastered" = review-state cards with ≥3 successful repetitions
  const masteredCards = allCards.filter((c) => c.state === 'review' && c.reps >= 3).length;
  const quizCount = attempts.length;
  const avgScore = quizCount > 0
    ? Math.round(
        attempts.reduce((sum, a) => sum + Math.round((a.score / a.totalQuestions) * 100), 0) /
          quizCount
      )
    : 0;

  const bestScore = quizCount > 0
    ? Math.max(...attempts.map((a) => Math.round((a.score / a.totalQuestions) * 100)))
    : 0;

  res.json({
    subjectName: subject.name,
    quizTrend,
    cardStates,
    forgettingCurve,
    avgStability,
    avgInterval,
    totalCards,
    masteredCards,
    quizCount,
    avgScore,
    bestScore,
    totalLapses,
  });
});

module.exports = { getSubjectAnalytics };
