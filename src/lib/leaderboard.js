import prisma from './prisma';

/**
 * Updates the leaderboard when a test is completed
 * @param {string} userId - ID of the user who completed the test
 * @param {string} testId - ID of the completed test
 * @param {number} score - Score achieved in the test (0-100)
 * @param {string[]} subjectIds - Array of subject IDs the test covers
 */
export async function updateLeaderboard(userId, testId, score, subjectIds) {
  // Start a transaction to ensure data consistency
  return await prisma.$transaction(async (tx) => {
    // Update or create leaderboard entries for each subject
    for (const subjectId of subjectIds) {
      // Find existing entry for this user and subject
      const existingEntry = await tx.leaderboardEntry.findFirst({
        where: {
          userId,
          subjectId,
        },
      });

      // Calculate new values
      const testCount = (existingEntry?.testCount || 0) + 1;
      const totalScore = (existingEntry?.totalScore || 0) + score;
      const averageScore = Math.round(totalScore / testCount);

      // Update or create the leaderboard entry
      await tx.leaderboardEntry.upsert({
        where: {
          id: existingEntry?.id || 'new-entry',
        },
        update: {
          testCount,
          totalScore,
          averageScore,
          lastUpdated: new Date(),
        },
        create: {
          userId,
          subjectId,
          testCount: 1,
          totalScore: score,
          averageScore: score,
          lastUpdated: new Date(),
        },
      });
    }

    // Update overall leaderboard (no subject)
    const overallEntry = await tx.leaderboardEntry.findFirst({
      where: {
        userId,
        subjectId: null,
      },
    });

    const overallTestCount = (overallEntry?.testCount || 0) + 1;
    const overallTotalScore = (overallEntry?.totalScore || 0) + score;
    const overallAverageScore = Math.round(overallTotalScore / overallTestCount);

    await tx.leaderboardEntry.upsert({
      where: {
        id: overallEntry?.id || 'new-overall-entry',
      },
      update: {
        testCount: overallTestCount,
        totalScore: overallTotalScore,
        averageScore: overallAverageScore,
        lastUpdated: new Date(),
      },
      create: {
        userId,
        subjectId: null, // Null subjectId represents the overall leaderboard
        testCount: 1,
        totalScore: score,
        averageScore: score,
        lastUpdated: new Date(),
      },
    });

    // Log the test attempt for analytics
    await tx.testAttempt.create({
      data: {
        userId,
        testId,
        score,
        completedAt: new Date(),
      },
    });

    // Check for and award badges
    await checkAndAwardBadges(userId, tx);
  });
}

/**
 * Checks and awards badges based on user achievements
 * @param {string} userId - ID of the user to check
 * @param {object} tx - Prisma transaction object
 */
async function checkAndAwardBadges(userId, tx) {
  const userStats = await tx.leaderboardEntry.findMany({
    where: { userId },
    include: {
      subject: true,
    },
  });

  const overallStats = userStats.find(entry => entry.subjectId === null);
  const subjectStats = userStats.filter(entry => entry.subjectId !== null);

  const badgesToAward = [];

  // Check for test count badges
  if (overallStats) {
    if (overallStats.testCount >= 10) {
      badgesToAward.push('DECATHLON');
    }
    if (overallStats.testCount >= 50) {
      badgesToAward.push('MARATHON_RUNNER');
    }
    if (overallStats.testCount >= 100) {
      badgesToAward.push('CENTURION');
    }
  }

  // Check for high score badges
  if (overallStats?.averageScore >= 90) {
    badgesToAward.push('TOP_SCORER');
  }

  // Check for subject mastery badges
  const masteredSubjects = subjectStats.filter(
    stat => stat.averageScore >= 90
  ).length;
  
  if (masteredSubjects >= 3) {
    badgesToAward.push('TRIPLE_THREAT');
  }
  if (masteredSubjects >= 5) {
    badgesToAward.push('PENTAGON');
  }

  // Award any new badges
  if (badgesToAward.length > 0) {
    const existingBadges = await tx.userBadge.findMany({
      where: {
        userId,
        badgeId: {
          in: badgesToAward,
        },
      },
      select: {
        badgeId: true,
      },
    });

    const existingBadgeIds = existingBadges.map(b => b.badgeId);
    const newBadges = badgesToAward.filter(id => !existingBadgeIds.includes(id));

    for (const badgeId of newBadges) {
      await tx.userBadge.create({
        data: {
          userId,
          badgeId,
          awardedAt: new Date(),
        },
      });
    }
  }
}

/**
 * Gets the user's current rank and stats
 * @param {string} userId - ID of the user
 * @param {string} [subjectId] - Optional subject ID to filter by
 * @returns {Promise<object>} User's rank and stats
 */
export async function getUserRank(userId, subjectId = null) {
  // Get user's score
  const userEntry = await prisma.leaderboardEntry.findFirst({
    where: {
      userId,
      ...(subjectId ? { subjectId } : { subjectId: null }),
    },
  });

  if (!userEntry) {
    return null;
  }

  // Get rank by counting users with higher scores
  const rank = await prisma.leaderboardEntry.count({
    where: {
      ...(subjectId ? { subjectId } : { subjectId: null }),
      OR: [
        { totalScore: { gt: userEntry.totalScore } },
        { 
          AND: [
            { totalScore: userEntry.totalScore },
            { lastUpdated: { lt: userEntry.lastUpdated } }
          ]
        }
      ]
    },
  }) + 1; // Add 1 because ranks start at 1

  return {
    rank,
    ...userEntry,
  };
}
