import prisma from '@/lib/prisma';

export const TestAnalyticsService = {
  // Get test results summary
  async getTestResults(testId) {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        attempts: {
          include: {
            user: true
          }
        },
        questions: {
          include: {
            question: true
          }
        }
      }
    });

    if (!test) return null;

    // Calculate basic statistics
    const scores = test.attempts.map(a => a.score);
    const averageScore = scores.length > 0 ? 
      scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    
    const completedAttempts = test.attempts.filter(a => a.finishedAt).length;
    const completionRate = test.attempts.length > 0 ? 
      (completedAttempts / test.attempts.length) * 100 : 0;

    // Calculate time statistics
    const timeSpent = test.attempts
      .filter(a => a.startedAt && a.finishedAt)
      .map(a => (new Date(a.finishedAt) - new Date(a.startedAt)) / 1000 / 60); // in minutes
    
    const avgTimeSpent = timeSpent.length > 0 ? 
      timeSpent.reduce((a, b) => a + b, 0) / timeSpent.length : 0;

    // Calculate score distribution
    const scoreDistribution = this.calculateScoreDistribution(scores);

    return {
      testId: test.id,
      title: test.title,
      totalQuestions: test.questions.length,
      totalAttempts: test.attempts.length,
      completedAttempts,
      completionRate: parseFloat(completionRate.toFixed(2)),
      averageScore: parseFloat(averageScore.toFixed(2)),
      maxScore: parseFloat(maxScore.toFixed(2)),
      minScore: parseFloat(minScore.toFixed(2)),
      avgTimeSpent: parseFloat(avgTimeSpent.toFixed(2)),
      scoreDistribution,
      questionStats: await this.getQuestionStats(testId, test.questions)
    };
  },

  // Get question-level statistics
  async getQuestionStats(testId, testQuestions) {
    const questionStats = [];

    for (const tq of testQuestions) {
      const question = tq.question;
      
      const attempts = await prisma.testAttempt.findMany({
        where: {
          testId,
          details: {
            path: [tq.questionId],
            not: undefined
          }
        },
        select: {
          details: {
            select: {
              [tq.questionId]: true
            }
          },
          score: true
        }
      });

      const questionAttempts = attempts.map(a => ({
        isCorrect: a.details[tq.questionId]?.isCorrect || false,
        timeSpent: a.details[tq.questionId]?.timeSpent || 0,
        score: a.score
      }));

      const correctCount = questionAttempts.filter(a => a.isCorrect).length;
      const totalAttempts = questionAttempts.length;
      const correctPercentage = totalAttempts > 0 ? 
        (correctCount / totalAttempts) * 100 : 0;
      
      const timeSpent = questionAttempts
        .filter(a => a.timeSpent > 0)
        .map(a => a.timeSpent);
      
      const avgTimeSpent = timeSpent.length > 0 ?
        timeSpent.reduce((a, b) => a + b, 0) / timeSpent.length : 0;

      // Calculate discrimination index (basic version)
      const sortedByScore = [...questionAttempts].sort((a, b) => b.score - a.score);
      const top27percent = sortedByScore.slice(0, Math.ceil(sortedByScore.length * 0.27));
      const bottom27percent = sortedByScore.slice(-Math.ceil(sortedByScore.length * 0.27));
      
      const topCorrect = top27percent.filter(a => a.isCorrect).length;
      const bottomCorrect = bottom27percent.filter(a => a.isCorrect).length;
      const discriminationIndex = (topCorrect - bottomCorrect) / top27percent.length;

      questionStats.push({
        questionId: question.id,
        text: question.text,
        type: question.type,
        difficulty: question.difficulty,
        totalAttempts,
        correctCount,
        correctPercentage: parseFloat(correctPercentage.toFixed(2)),
        avgTimeSpent: parseFloat(avgTimeSpent.toFixed(2)),
        discriminationIndex: parseFloat(discriminationIndex.toFixed(3)),
        options: question.options?.map((option, index) => ({
          option: String.fromCharCode(65 + index), // A, B, C, etc.
          text: option,
          selected: questionAttempts
            .filter(a => a.details?.[tq.questionId]?.selectedOption === index)
            .length
        })) || []
      });
    }

    return questionStats;
  },

  // Get attempts over time
  async getAttemptsOverTime(testId, timeRange = '7d') {
    const now = new Date();
    let startDate = new Date();
    
    // Set start date based on time range
    if (timeRange === '24h') {
      startDate.setDate(now.getDate() - 1);
    } else if (timeRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === '90d') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (timeRange === 'all') {
      // Get the date of the first attempt
      const firstAttempt = await prisma.testAttempt.findFirst({
        where: { testId },
        orderBy: { startedAt: 'asc' },
        select: { startedAt: true }
      });
      startDate = firstAttempt?.startedAt || new Date();
    }

    // Get all attempts within the time range
    const attempts = await prisma.testAttempt.findMany({
      where: {
        testId,
        startedAt: {
          gte: startDate
        }
      },
      select: {
        id: true,
        score: true,
        startedAt: true,
        finishedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startedAt: 'asc'
      }
    });

    // Group attempts by time period
    const timeFormat = this.getTimeFormat(timeRange);
    const groupedAttempts = {};

    attempts.forEach(attempt => {
      const date = new Date(attempt.startedAt);
      const timeKey = this.formatDate(date, timeFormat);
      
      if (!groupedAttempts[timeKey]) {
        groupedAttempts[timeKey] = {
          date: timeKey,
          timestamp: date.getTime(),
          attempts: 0,
          completed: 0,
          avgScore: 0,
          scores: [],
          users: new Set()
        };
      }

      const period = groupedAttempts[timeKey];
      period.attempts++;
      period.users.add(attempt.user.id);
      
      if (attempt.finishedAt) {
        period.completed++;
        period.scores.push(attempt.score);
        period.avgScore = period.scores.reduce((a, b) => a + b, 0) / period.scores.length;
      }
    });

    // Convert to array and sort by timestamp
    return Object.values(groupedAttempts)
      .map(period => ({
        ...period,
        uniqueUsers: period.users.size,
        avgScore: parseFloat(period.avgScore.toFixed(2)),
        completionRate: period.attempts > 0 ? 
          parseFloat(((period.completed / period.attempts) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  // Helper: Calculate score distribution
  calculateScoreDistribution(scores, bins = 10) {
    if (scores.length === 0) {
      return Array(bins).fill(0).map((_, i) => ({
        range: `${i * 10}-${(i + 1) * 10}%`,
        count: 0,
        percentage: 0
      }));
    }

    const maxScore = 100; // Assuming max score is 100%
    const binSize = maxScore / bins;
    const distribution = Array(bins).fill(0);

    scores.forEach(score => {
      const bin = Math.min(Math.floor(score / binSize), bins - 1);
      distribution[bin]++;
    });

    return distribution.map((count, i) => ({
      range: `${i * binSize}-${(i + 1) * binSize}%`,
      count,
      percentage: parseFloat(((count / scores.length) * 100).toFixed(2))
    }));
  },

  // Helper: Get appropriate time format for grouping
  getTimeFormat(timeRange) {
    switch (timeRange) {
      case '24h':
        return 'hour';
      case '7d':
        return 'day';
      case '30d':
      case '90d':
        return 'week';
      case 'all':
        return 'month';
      default:
        return 'day';
    }
  },

  // Helper: Format date based on time range
  formatDate(date, format) {
    const d = new Date(date);
    
    switch (format) {
      case 'hour':
        return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', hour12: false });
      case 'day':
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'week':
        // Get the start of the week (Sunday)
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        return `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'month':
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      default:
        return d.toLocaleDateString();
    }
  }
};

export default TestAnalyticsService;
