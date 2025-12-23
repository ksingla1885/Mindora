import { differenceInDays, addDays } from 'date-fns';

// Constants
const MASTERY_THRESHOLD = 0.8;
const CONFIDENCE_DECAY = 0.1;
const MASTERY_DECAY = 0.05;
const MAX_DIFFICULTY = 5;
const MIN_DIFFICULTY = 1;

/**
 * Calculate mastery score based on past attempts
 * @param {Array} attempts - Array of attempt objects with {isCorrect, timestamp}
 * @param {number} [decayRate=0.05] - Rate at which older attempts are weighted less
 * @returns {number} Mastery score between 0 and 1
 */
export const calculateMastery = (attempts, decayRate = 0.05) => {
  if (!attempts || !attempts.length) return 0;
  
  const now = new Date();
  let weightedSum = 0;
  let weightSum = 0;
  
  attempts.forEach(attempt => {
    const daysAgo = differenceInDays(now, new Date(attempt.timestamp));
    const weight = Math.exp(-decayRate * daysAgo);
    weightedSum += (attempt.isCorrect ? 1 : 0) * weight;
    weightSum += weight;
  });
  
  return weightSum > 0 ? weightedSum / weightSum : 0;
};

/**
 * Calculate next review interval using SM-2 algorithm
 * @param {Object} card - Flashcard data
 * @param {number} performance - Performance score (0-1)
 * @returns {Object} Updated card with new interval and due date
 */
export function calculateNextReview(card, performance) {
  const easeFactor = card.easeFactor || 2.5;
  let { interval = 1, repetitions = 0 } = card;
  
  if (performance >= 0.6) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response - reset repetitions but keep ease factor
    repetitions = 0;
    interval = 1;
  }
  
  // Update ease factor based on performance
  const newEaseFactor = Math.max(
    1.3, 
    easeFactor + (0.1 - (5 - performance * 5) * (0.08 + (5 - performance * 5) * 0.02))
  );
  
  return {
    ...card,
    interval,
    repetitions,
    easeFactor: newEaseFactor,
    dueDate: addDays(new Date(), interval),
    lastReviewed: new Date(),
  };
}

/**
 * Calculate next difficulty level based on performance
 * @param {number} currentDifficulty - Current difficulty (1-5)
 * @param {number} performance - Performance score (0-1)
 * @returns {number} New difficulty level (1-5)
 */
export function calculateNextDifficulty(currentDifficulty, performance) {
  let newDifficulty = currentDifficulty;
  
  if (performance >= 0.8) {
    // Increase difficulty if performing well
    newDifficulty = Math.min(MAX_DIFFICULTY, currentDifficulty + 0.5);
  } else if (performance < 0.4) {
    // Decrease difficulty if struggling
    newDifficulty = Math.max(MIN_DIFFICULTY, currentDifficulty - 0.5);
  }
  
  return Number(newDifficulty.toFixed(1));
}

/**
 * Calculate performance trend based on recent attempts
 * @param {Array} attempts - Array of attempt objects with {isCorrect}
 * @param {number} [windowSize=5] - Number of recent attempts to consider
 * @returns {string} 'improving', 'declining', or 'stable'
 */
export const calculatePerformanceTrend = (attempts, windowSize = 5) => {
  if (!attempts || attempts.length < windowSize) return 'insufficient_data';
  
  const recent = attempts.slice(-windowSize);
  const correct = recent.filter(a => a.isCorrect).length;
  const accuracy = correct / windowSize;
  
  if (accuracy > 0.7) return 'improving';
  if (accuracy < 0.4) return 'declining';
  return 'stable';
};

/**
 * Calculate confidence score for a user's answer
 * @param {Object} params - Parameters for confidence calculation
 * @param {number} params.timeSpent - Time spent on the question in seconds
 * @param {number} params.avgTime - Average time for this question
 * @param {number} params.userAccuracy - User's accuracy on similar questions
 * @returns {number} Confidence score between 0 and 1
 */
export const calculateConfidence = ({ timeSpent, avgTime, userAccuracy }) => {
  // Normalize time factor (closer to average time is better)
  const timeFactor = Math.min(1, Math.max(0, 1 - Math.abs((timeSpent - avgTime) / (avgTime || 1))));
  
  // Combine with user's accuracy (weighted average)
  return (timeFactor * 0.3) + (userAccuracy * 0.7);
};

/**
 * Generate personalized recommendations based on performance
 * @param {Object} user - User data
 * @param {Object} stats - Performance statistics
 * @returns {Array} Array of recommendation objects
 */
export function generateRecommendations(user, stats) {
  const recommendations = [];
  
  // Topic-based recommendations
  if (stats.weakTopics?.length > 0) {
    recommendations.push({
      type: 'topic',
      priority: 'high',
      message: `Focus on ${stats.weakTopics[0].name} - your weakest topic`,
      action: `/practice?topic=${encodeURIComponent(stats.weakTopics[0].id)}`,
    });
  }
  
  // Time-based recommendations
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 22 || hour <= 5) {
    recommendations.push({
      type: 'reminder',
      priority: 'medium',
      message: 'Consider studying earlier in the day for better retention',
      action: '/schedule',
    });
  }
  
  // Performance-based recommendations
  if (stats.accuracy < 0.6) {
    recommendations.push({
      type: 'study_habit',
      priority: 'high',
      message: 'Try reviewing previous questions before attempting new ones',
      action: '/review',
    });
  }
  
  return recommendations;
}

export default {
  calculateMastery,
  calculateNextReview,
  calculateNextDifficulty,
  calculatePerformanceTrend,
  calculateConfidence,
  generateRecommendations,
};
