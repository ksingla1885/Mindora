/**
 * Utility functions for test-related operations
 */

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} - A new shuffled array
 */
export const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Randomizes questions and their options
 * @param {Array} questions - Array of question objects
 * @param {Object} options - Configuration options
 * @param {boolean} options.shuffleQuestions - Whether to shuffle questions
 * @param {boolean} options.shuffleOptions - Whether to shuffle options
 * @param {number} options.maxQuestions - Maximum number of questions to include
 * @returns {Array} - Randomized array of questions
 */
export const randomizeTest = (questions, options = {}) => {
  const {
    shuffleQuestions = true,
    shuffleOptions = true,
    maxQuestions = null,
  } = options;

  // Create a deep copy of questions to avoid mutating the original
  let randomizedQuestions = JSON.parse(JSON.stringify(questions));

  // Shuffle questions if needed
  if (shuffleQuestions) {
    randomizedQuestions = shuffleArray(randomizedQuestions);
  }

  // Limit number of questions if specified
  if (maxQuestions && randomizedQuestions.length > maxQuestions) {
    randomizedQuestions = randomizedQuestions.slice(0, maxQuestions);
  }

  // Process each question
  return randomizedQuestions.map(question => {
    const processedQuestion = { ...question };
    
    // Shuffle options if it's an MCQ and shuffleOptions is true
    if (question.type === 'mcq' && shuffleOptions && question.options) {
      // Store the original index of the correct answer
      const originalCorrectIndex = question.correctAnswer;
      
      // Create an array of indices to shuffle
      const optionIndices = question.options.map((_, index) => index);
      const shuffledIndices = shuffleArray(optionIndices);
      
      // Find the new index of the correct answer
      const newCorrectIndex = shuffledIndices.indexOf(originalCorrectIndex);
      
      // Reorder options and update correct answer
      processedQuestion.options = shuffledIndices.map(index => question.options[index]);
      processedQuestion.correctAnswer = newCorrectIndex;
      
      // If there's a selected answer, update its index
      if (question.selectedAnswer !== undefined) {
        const selectedIndex = question.selectedAnswer;
        processedQuestion.selectedAnswer = shuffledIndices.indexOf(selectedIndex);
      }
    }
    
    return processedQuestion;
  });
};

/**
 * Generates a unique test attempt ID
 * @returns {string} - A unique test attempt ID
 */
export const generateTestAttemptId = () => {
  return `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculates test score based on answers
 * @param {Array} questions - Array of question objects
 * @param {Object} answers - User's answers
 * @returns {Object} - Score information
 */
export const calculateScore = (questions, answers) => {
  let correct = 0;
  let totalMarks = 0;
  let obtainedMarks = 0;
  
  questions.forEach(question => {
    const userAnswer = answers[question.id];
    totalMarks += question.marks || 1;
    
    if (userAnswer !== undefined) {
      if (question.type === 'mcq' && userAnswer === question.correctAnswer) {
        correct++;
        obtainedMarks += question.marks || 1;
      } else if (question.type === 'true_false' && userAnswer === question.correctAnswer) {
        correct++;
        obtainedMarks += question.marks || 1;
      } else if (question.type === 'descriptive') {
        // For descriptive questions, we'd need server-side grading
        // For now, we'll just count it as attempted
        obtainedMarks += 0; // Will be updated after manual grading
      }
    }
  });
  
  const percentage = (obtainedMarks / totalMarks) * 100;
  
  return {
    correct,
    total: questions.length,
    obtainedMarks,
    totalMarks,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
  };
};

/**
 * Validates test attempt data before submission
 * @param {Object} attempt - Test attempt data
 * @returns {Object} - Validation result
 */
export const validateTestAttempt = (attempt) => {
  const { testId, userId, answers, startedAt, completedAt } = attempt;
  const errors = [];
  
  if (!testId) errors.push('Test ID is required');
  if (!userId) errors.push('User ID is required');
  if (!startedAt) errors.push('Start time is required');
  if (!completedAt) errors.push('Completion time is required');
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
  };
};

/**
 * Formats time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds)) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calculates time remaining based on start time and duration
 * @param {Date|string} startTime - Test start time
 * @param {number} duration - Test duration in minutes
 * @returns {number} - Time remaining in seconds
 */
export const calculateTimeRemaining = (startTime, duration) => {
  const start = new Date(startTime).getTime();
  const now = new Date().getTime();
  const elapsedSeconds = Math.floor((now - start) / 1000);
  const totalSeconds = duration * 60;
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  return remaining;
};
