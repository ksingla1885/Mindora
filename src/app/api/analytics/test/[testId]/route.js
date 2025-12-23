import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Helper function to calculate time ranges
function getDateRange(timeRange) {
  const now = new Date();
  
  switch (timeRange) {
    case '24h':
      return {
        start: new Date(now.setDate(now.getDate() - 1)),
        end: new Date()
      };
    case '7d':
      return {
        start: new Date(now.setDate(now.getDate() - 7)),
        end: new Date()
      };
    case '30d':
      return {
        start: new Date(now.setDate(now.getDate() - 30)),
        end: new Date()
      };
    case '90d':
      return {
        start: new Date(now.setDate(now.getDate() - 90)),
        end: new Date()
      };
    default:
      return {
        start: new Date(0), // Beginning of time
        end: new Date()
      };
  }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { testId } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const timeRange = searchParams.get('timeRange') || '7d';
    const userId = searchParams.get('userId') || null;

    // Get test details
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: true,
        testAttempts: {
          where: {
            status: 'COMPLETED',
            ...(userId && { userId })
          },
          include: {
            questionAttempts: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Calculate date range for filtering
    const { start: startDate, end: endDate } = getDateRange(timeRange);
    
    // Filter attempts by date range
    const attemptsInRange = test.testAttempts.filter(attempt => {
      const attemptDate = new Date(attempt.completedAt);
      return attemptDate >= startDate && attemptDate <= endDate;
    });

    // Process data based on request type
    let responseData = {};

    switch (type) {
      case 'overview':
        responseData = await getOverviewData(test, attemptsInRange, userId);
        break;
      case 'question-analysis':
        responseData = await getQuestionAnalysis(test, attemptsInRange);
        break;
      case 'attempts-over-time':
        responseData = await getAttemptsOverTime(test, attemptsInRange, timeRange);
        break;
      case 'user-performance':
        responseData = await getUserPerformance(test, attemptsInRange, userId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        testId,
        testTitle: test.title,
        timeRange,
        startDate,
        endDate,
        totalAttempts: attemptsInRange.length,
        totalQuestions: test.questions.length
      }
    });

  } catch (error) {
    console.error('Error in test analytics API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch test analytics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions for different analytics types
async function getOverviewData(test, attempts, userId) {
  const totalQuestions = test.questions.length;
  const totalAttempts = attempts.length;
  
  // Calculate average score
  const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
  const averageScore = totalAttempts > 0 ? (totalScore / totalAttempts) * 100 : 0;
  
  // Calculate completion rate
  const completedAttempts = attempts.filter(a => a.status === 'COMPLETED').length;
  const completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
  
  // Calculate average time spent
  const totalTimeSpent = attempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0);
  const averageTimeSpent = totalAttempts > 0 ? Math.round(totalTimeSpent / totalAttempts) : 0;
  
  // Get user rank if userId is provided
  let userRank = null;
  if (userId) {
    const userAttempts = attempts.filter(a => a.userId === userId);
    const userScores = attempts
      .map(a => a.score)
      .filter(Boolean)
      .sort((a, b) => b - a);
      
    const userBestScore = userAttempts.length > 0 
      ? Math.max(...userAttempts.map(a => a.score || 0)) 
      : 0;
      
    const rank = userScores.findIndex(score => score <= userBestScore) + 1;
    
    userRank = {
      rank,
      totalParticipants: userScores.length,
      percentile: Math.round(((userScores.length - rank) / userScores.length) * 100) || 0,
      bestScore: userBestScore * 100,
      attempts: userAttempts.length
    };
  }

  return {
    averageScore: Math.round(averageScore * 100) / 100,
    completionRate: Math.round(completionRate * 100) / 100,
    averageTimeSpent,
    totalAttempts,
    totalQuestions,
    userRank,
    // Add more metrics as needed
  };
}

async function getQuestionAnalysis(test, attempts) {
  const questionStats = [];
  const totalAttempts = attempts.length;
  
  // Initialize question stats
  test.questions.forEach((question, index) => {
    questionStats.push({
      questionId: question.id,
      questionNumber: index + 1,
      questionText: question.text,
      difficulty: question.difficulty || 'MEDIUM',
      correctAttempts: 0,
      totalAttempts: 0,
      averageTimeSpent: 0,
      options: question.options.map(option => ({
        id: option.id,
        text: option.text,
        isCorrect: option.isCorrect,
        selectedCount: 0
      }))
    });
  });
  
  // Process each attempt
  attempts.forEach(attempt => {
    attempt.questionAttempts.forEach(qa => {
      const question = questionStats.find(q => q.questionId === qa.questionId);
      if (!question) return;
      
      question.totalAttempts++;
      question.correctAttempts += qa.isCorrect ? 1 : 0;
      question.averageTimeSpent = 
        ((question.averageTimeSpent * (question.totalAttempts - 1)) + (qa.timeSpent || 0)) / question.totalAttempts;
      
      // Track option selection
      if (qa.selectedOptionId) {
        const option = question.options.find(o => o.id === qa.selectedOptionId);
        if (option) option.selectedCount++;
      }
    });
  });
  
  // Calculate percentages and format data
  return questionStats.map(q => ({
    ...q,
    correctPercentage: q.totalAttempts > 0 ? Math.round((q.correctAttempts / q.totalAttempts) * 100) : 0,
    averageTimeSpent: Math.round(q.averageTimeSpent * 10) / 10,
    options: q.options.map(opt => ({
      ...opt,
      selectionPercentage: q.totalAttempts > 0 
        ? Math.round((opt.selectedCount / q.totalAttempts) * 100) 
        : 0
    }))
  }));
}

async function getAttemptsOverTime(test, attempts, timeRange) {
  // Group attempts by time period
  const timeFormat = timeRange === '24h' ? 'hour' : 'day';
  const formatString = timeRange === '24h' ? 'HH:00' : 'MMM d';
  
  const groupedAttempts = attempts.reduce((acc, attempt) => {
    const date = new Date(attempt.completedAt);
    let key;
    
    if (timeFormat === 'hour') {
      // Group by hour
      date.setMinutes(0, 0, 0);
      key = date.toISOString();
    } else {
      // Group by day
      date.setHours(0, 0, 0, 0);
      key = date.toISOString().split('T')[0];
    }
    
    if (!acc[key]) {
      acc[key] = {
        date: new Date(key),
        attempts: 0,
        completed: 0,
        averageScore: 0,
        totalScore: 0
      };
    }
    
    acc[key].attempts++;
    if (attempt.status === 'COMPLETED') {
      acc[key].completed++;
      acc[key].totalScore += attempt.score || 0;
      acc[key].averageScore = acc[key].totalScore / acc[key].completed;
    }
    
    return acc;
  }, {});
  
  // Convert to array and sort by date
  return Object.values(groupedAttempts)
    .sort((a, b) => a.date - b.date)
    .map(item => ({
      timestamp: item.date.toISOString(),
      date: formatDate(item.date, formatString),
      attempts: item.attempts,
      completed: item.completed,
      averageScore: Math.round((item.averageScore || 0) * 100) / 100
    }));
}

async function getUserPerformance(test, attempts, userId) {
  if (!userId) return null;
  
  const userAttempts = attempts.filter(a => a.userId === userId);
  if (userAttempts.length === 0) return null;
  
  // Calculate user statistics
  const scores = userAttempts.map(a => a.score * 100);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const averageScore = totalScore / scores.length;
  
  // Get best and worst performing questions
  const questionPerformance = {};
  
  userAttempts.forEach(attempt => {
    attempt.questionAttempts.forEach(qa => {
      if (!questionPerformance[qa.questionId]) {
        const question = test.questions.find(q => q.id === qa.questionId);
        questionPerformance[qa.questionId] = {
          questionId: qa.questionId,
          questionText: question?.text || 'Unknown',
          difficulty: question?.difficulty || 'MEDIUM',
          attempts: 0,
          correct: 0,
          timeSpent: 0
        };
      }
      
      questionPerformance[qa.questionId].attempts++;
      questionPerformance[qa.questionId].correct += qa.isCorrect ? 1 : 0;
      questionPerformance[qa.questionId].timeSpent += qa.timeSpent || 0;
    });
  });
  
  // Convert to array and calculate metrics
  const questionStats = Object.values(questionPerformance).map(q => ({
    ...q,
    accuracy: q.attempts > 0 ? Math.round((q.correct / q.attempts) * 100) : 0,
    averageTimeSpent: Math.round((q.timeSpent / q.attempts) * 10) / 10 || 0
  }));
  
  // Sort by accuracy (worst to best)
  questionStats.sort((a, b) => a.accuracy - b.accuracy);
  
  return {
    totalAttempts: userAttempts.length,
    averageScore: Math.round(averageScore * 100) / 100,
    bestScore: Math.max(...scores),
    worstScore: Math.min(...scores),
    improvement: calculateImprovement(userAttempts),
    strengths: questionStats.slice(-3).reverse(), // Top 3 best performing questions
    weaknesses: questionStats.slice(0, 3), // Top 3 worst performing questions
    timeDistribution: analyzeTimeSpent(userAttempts)
  };
}

// Helper function to calculate improvement over time
function calculateImprovement(attempts) {
  if (attempts.length < 2) return 0;
  
  const sortedAttempts = [...attempts].sort((a, b) => 
    new Date(a.completedAt) - new Date(b.completedAt)
  );
  
  const firstScore = sortedAttempts[0].score * 100;
  const lastScore = sortedAttempts[sortedAttempts.length - 1].score * 100;
  
  return Math.round(((lastScore - firstScore) / firstScore) * 100) || 0;
}

// Helper function to analyze time spent distribution
function analyzeTimeSpent(attempts) {
  if (attempts.length === 0) return [];
  
  const timeSpent = attempts.map(a => a.timeSpent || 0);
  const totalTime = timeSpent.reduce((sum, t) => sum + t, 0);
  const averageTime = totalTime / attempts.length;
  
  // Categorize time spent
  const timeRanges = [
    { range: '0-30s', min: 0, max: 30, count: 0 },
    { range: '30s-1m', min: 30, max: 60, count: 0 },
    { range: '1-2m', min: 60, max: 120, count: 0 },
    { range: '2-5m', min: 120, max: 300, count: 0 },
    { range: '5m+', min: 300, max: Infinity, count: 0 }
  ];
  
  timeSpent.forEach(time => {
    const range = timeRanges.find(r => time >= r.min && time < r.max) || 
                 timeRanges[timeRanges.length - 1];
    range.count++;
  });
  
  return timeRanges.map(range => ({
    range: range.range,
    count: range.count,
    percentage: Math.round((range.count / attempts.length) * 100)
  }));
}

// Helper function to format dates
function formatDate(date, formatStr) {
  // Simple date formatting function
  const d = new Date(date);
  const pad = num => num.toString().padStart(2, '0');
  
  return formatStr
    .replace('YYYY', d.getFullYear())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('MMM', d.toLocaleString('default', { month: 'short' }))
    .replace('d', d.getDate())
    .replace('h', d.getHours() % 12 || 12)
    .replace('mm', pad(d.getMinutes()))
    .replace('a', d.getHours() < 12 ? 'am' : 'pm');
}
