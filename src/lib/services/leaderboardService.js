import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { formatDistanceToNow, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

const LEADERBOARD_CACHE_PREFIX = 'leaderboard:';
const CACHE_TTL = 5 * 60; // 5 minutes cache TTL

/**
 * Get date range based on time range filter
 */
function getDateRangeForTimeRange(timeRange) {
  const now = new Date();
  
  switch (timeRange) {
    case 'weekly':
      return {
        start: startOfWeek(now),
        end: endOfWeek(now)
      };
    case 'monthly':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    case 'yearly':
      return {
        start: startOfYear(now),
        end: endOfYear(now)
      };
    case 'all':
    default:
      return null; // No date filter for 'all' time
  }
}

/**
 * Get leaderboard data with optimized queries
 */
export async function getLeaderboard({
  timeRange = 'all',
  limit = 100,
  offset = 0,
  userId = null,
  includeCurrentUser = true,
  cache = true
} = {}) {
  const cacheKey = `${LEADERBOARD_CACHE_PREFIX}${timeRange}:${limit}:${offset}:${userId || 'all'}`;
  
  // Try to get from cache if enabled
  if (cache) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          fromCache: true,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Cache read error:', error);
      // Continue with database query if cache fails
    }
  }

  // Calculate date range
  const dateRange = getDateRangeForTimeRange(timeRange);
  
  // Build the base query for user scores
  const baseQuery = {
    where: {
      ...(dateRange && {
        updatedAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      })
    },
    select: {
      id: true,
      xp: true,
      level: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true
        }
      },
      _count: {
        select: {
          achievements: true,
          completedLessons: true
        }
      }
    },
    orderBy: [
      { level: 'desc' },
      { xp: 'desc' },
      { updatedAt: 'asc' }
    ],
    take: limit,
    skip: offset
  };

  // Execute queries in parallel for better performance
  const [userProfiles, totalCount, currentUserRank] = await Promise.all([
    // Get paginated user profiles with scores
    prisma.userProfile.findMany({
      ...baseQuery,
      // If we're including current user, we might need to adjust the query
      ...(userId && includeCurrentUser ? {
        where: {
          ...baseQuery.where,
          userId: {
            not: userId // We'll add the current user separately if needed
          }
        }
      } : {})
    }),
    
    // Get total count for pagination
    prisma.userProfile.count({
      where: baseQuery.where
    }),
    
    // Get current user's rank if userId is provided
    userId ? getUserRank(userId, dateRange) : Promise.resolve(null)
  ]);

  // If we need to include the current user and they're not in the current page
  let currentUserData = null;
  if (userId && includeCurrentUser && currentUserRank) {
    const userInResults = userProfiles.some(up => up.user.id === userId);
    
    if (!userInResults && currentUserRank.rank > offset + limit) {
      currentUserData = await prisma.userProfile.findUnique({
        where: { userId },
        select: baseQuery.select
      });
      
      if (currentUserData) {
        // Add rank to the user data
        currentUserData.rank = currentUserRank.rank;
      }
    }
  }

  // Process the data
  const leaderboardData = userProfiles.map((profile, index) => ({
    rank: offset + index + 1,
    userId: profile.user.id,
    name: profile.user.name,
    username: profile.user.username,
    avatar: profile.user.image,
    xp: profile.xp,
    level: profile.level,
    achievements: profile._count.achievements,
    completedLessons: profile._count.completedLessons
  }));

  // Add current user data if available
  if (currentUserData) {
    leaderboardData.push({
      ...currentUserData,
      userId: currentUserData.user.id,
      name: currentUserData.user.name,
      username: currentUserData.user.username,
      avatar: currentUserData.user.image,
      achievements: currentUserData._count.achievements,
      completedLessons: currentUserData._count.completedLessons
    });
  }

  // Prepare response
  const response = {
    data: leaderboardData,
    meta: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount,
      timeRange,
      lastUpdated: new Date().toISOString()
    },
    currentUser: currentUserRank
  };

  // Cache the result
  if (cache) {
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  return response;
}

/**
 * Get a user's rank in the leaderboard
 */
export async function getUserRank(userId, dateRange = null) {
  // First, get the user's score
  const userProfile = await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      xp: true,
      level: true,
      updatedAt: true
    }
  });

  if (!userProfile) return null;

  // Count how many users have a higher score
  const rank = await prisma.userProfile.count({
    where: {
      ...(dateRange && {
        updatedAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }),
      OR: [
        { level: { gt: userProfile.level } },
        {
          AND: [
            { level: userProfile.level },
            { xp: { gt: userProfile.xp } }
          ]
        },
        {
          AND: [
            { level: userProfile.level },
            { xp: userProfile.xp },
            { updatedAt: { lt: userProfile.updatedAt } }
          ]
        }
      ]
    }
  });

  return {
    rank: rank + 1, // Add 1 because ranks are 1-based
    xp: userProfile.xp,
    level: userProfile.level,
    percentile: await getUserPercentile(userId, dateRange)
  };
}

/**
 * Calculate user's percentile in the leaderboard
 */
async function getUserPercentile(userId, dateRange = null) {
  const [userRank, totalUsers] = await Promise.all([
    getUserRank(userId, dateRange),
    prisma.userProfile.count({
      where: dateRange ? {
        updatedAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      } : {}
    })
  ]);

  if (!userRank || totalUsers <= 1) return 100;
  
  // Calculate percentile (lower is better, so we invert the calculation)
  const percentile = ((totalUsers - userRank.rank) / (totalUsers - 1)) * 100;
  return Math.round(percentile * 10) / 10; // Round to 1 decimal place
}

/**
 * Get leaderboard for a specific event
 */
export async function getEventLeaderboard({
  eventId,
  limit = 100,
  offset = 0,
  userId = null,
  cache = true
} = {}) {
  if (!eventId) {
    throw new Error('Event ID is required');
  }

  const cacheKey = `event:${eventId}:leaderboard:${limit}:${offset}`;
  
  // Try to get from cache if enabled
  if (cache) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
  }

  // Get event details
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      _count: {
        select: { participants: true }
      }
    }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  // Get participants with their scores
  const participants = await prisma.eventParticipation.findMany({
    where: { eventId },
    select: {
      id: true,
      userId: true,
      score: true,
      progress: true,
      completed: true,
      completedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true
        }
      },
      event: {
        select: {
          id: true,
          title: true
        }
      }
    },
    orderBy: [
      { score: 'desc' },
      { completedAt: 'asc' },
      { updatedAt: 'asc' }
    ],
    take: limit,
    skip: offset
  });

  // Format the response
  const leaderboardData = participants.map((participation, index) => ({
    rank: offset + index + 1,
    userId: participation.user.id,
    name: participation.user.name,
    username: participation.user.username,
    avatar: participation.user.image,
    score: participation.score,
    progress: participation.progress,
    completed: participation.completed,
    completedAt: participation.completedAt
  }));

  // Get current user's rank if userId is provided
  let currentUserRank = null;
  if (userId) {
    const userParticipation = await prisma.eventParticipation.findFirst({
      where: {
        eventId,
        userId
      },
      select: {
        score: true,
        progress: true,
        completed: true,
        completedAt: true
      }
    });

    if (userParticipation) {
      // Count how many participants have a higher score
      const rank = await prisma.eventParticipation.count({
        where: {
          eventId,
          OR: [
            { score: { gt: userParticipation.score } },
            {
              AND: [
                { score: userParticipation.score },
                { completedAt: { lt: userParticipation.completedAt || new Date() } }
              ]
            }
          ]
        }
      });

      currentUserRank = {
        rank: rank + 1,
        score: userParticipation.score,
        progress: userParticipation.progress,
        completed: userParticipation.completed,
        totalParticipants: event._count.participants,
        percentile: Math.round(((event._count.participants - (rank + 1)) / (event._count.participants - 1)) * 100) || 0
      };
    }
  }

  // Prepare response
  const response = {
    event: {
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      totalParticipants: event._count.participants
    },
    data: leaderboardData,
    meta: {
      total: event._count.participants,
      limit,
      offset,
      hasMore: offset + limit < event._count.participants,
      lastUpdated: new Date().toISOString()
    },
    currentUser: currentUserRank
  };

  // Cache the result
  if (cache) {
    try {
      // Cache for shorter duration for event leaderboards (5 minutes)
      await redis.setex(cacheKey, 300, JSON.stringify(response));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  return response;
}

/**
 * Invalidate leaderboard cache
 */
export async function invalidateLeaderboardCache() {
  try {
    // Get all keys matching the leaderboard prefix
    const keys = await redis.keys(`${LEADERBOARD_CACHE_PREFIX}*`);
    
    // Delete all matching keys
    if (keys.length > 0) {
      await redis.del(keys);
    }
    
    return { success: true, count: keys.length };
  } catch (error) {
    console.error('Error invalidating leaderboard cache:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Invalidate event leaderboard cache
 */
export async function invalidateEventLeaderboardCache(eventId) {
  if (!eventId) {
    throw new Error('Event ID is required');
  }

  try {
    // Get all keys matching the event leaderboard prefix
    const keys = await redis.keys(`event:${eventId}:leaderboard:*`);
    
    // Delete all matching keys
    if (keys.length > 0) {
      await redis.del(keys);
    }
    
    return { success: true, count: keys.length };
  } catch (error) {
    console.error('Error invalidating event leaderboard cache:', error);
    return { success: false, error: error.message };
  }
}
