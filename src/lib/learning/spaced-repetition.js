import { addDays } from 'date-fns';

/**
 * Calculate the next optimal review date using a spaced repetition algorithm
 * @param {Object} params - Performance parameters
 * @param {boolean} params.isCorrect - Whether the answer was correct
 * @param {number} [params.confidence=0.5] - User's confidence in their answer (0-1)
 * @param {number} [params.previousInterval=1] - Previous interval in days
 * @param {number} [params.easiness=2.5] - Ease factor (1.3-2.5)
 * @returns {Object} { nextReviewDate, nextInterval, easeFactor }
 */
export const calculateNextOptimalReview = ({
  isCorrect,
  confidence = 0.5,
  previousInterval = 1,
  easiness = 2.5
}) => {
  // Adjust ease factor based on performance
  let newEasiness = easiness;
  
  if (isCorrect) {
    // Correct answer: increase ease factor slightly based on confidence
    newEasiness = Math.min(2.5, easiness + (0.1 - (1 - confidence) * 0.2));
    
    // Calculate next interval (SM-2 algorithm inspired)
    let nextInterval;
    if (previousInterval <= 1) {
      nextInterval = 1; // First review after 1 day
    } else if (previousInterval === 1) {
      nextInterval = 6; // Second review after 6 days
    } else {
      // Subsequent reviews: multiply by ease factor
      nextInterval = Math.ceil(previousInterval * newEasiness);
    }
    
    // Adjust based on confidence
    nextInterval = Math.max(1, Math.ceil(nextInterval * (0.8 + (confidence * 0.4))));
    
    return {
      nextReviewDate: addDays(new Date(), nextInterval),
      nextInterval,
      easeFactor: newEasiness
    };
  } else {
    // Incorrect answer: reset interval but keep the ease factor
    return {
      nextReviewDate: addDays(new Date(), 1), // Review again tomorrow
      nextInterval: 1,
      easeFactor: Math.max(1.3, easiness - 0.15) // Reduce ease factor but keep it above minimum
    };
  }
};

/**
 * Calculate initial mastery parameters for a new topic
 * @returns {Object} Initial mastery state
 */
export const getInitialMasteryState = () => ({
  easeFactor: 2.5,
  interval: 1,
  nextReview: addDays(new Date(), 1),
  reviewCount: 0,
  consecutiveCorrect: 0,
  lastReviewed: null,
  history: []
});
