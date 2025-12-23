import prisma from '@/lib/prisma';
import { BadgeAwardedError, InsufficientXPError } from './errors';

export class GamificationService {
  // XP and Level Management
  static async addXP(userId, xpAmount, source) {
    return await prisma.$transaction(async (tx) => {
      // Get current user data
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpAmount },
          lastActiveDate: new Date()
        },
        select: {
          xp: true,
          level: true,
          currentStreak: true,
          longestStreak: true,
          lastActiveDate: true
        }
      });

      // Check for level up
      const xpForNextLevel = this.calculateXPForLevel(user.level + 1);
      if (user.xp >= xpForNextLevel) {
        await tx.user.update({
          where: { id: userId },
          data: { level: { increment: 1 } }
        });
      }

      // Update streak
      const currentDate = new Date();
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
      const isNewDay = !lastActive || 
        lastActive.getDate() !== currentDate.getDate() ||
        lastActive.getMonth() !== currentDate.getMonth() ||
        lastActive.getFullYear() !== currentDate.getFullYear();

      if (isNewDay) {
        const yesterday = new Date(currentDate);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const isConsecutiveDay = lastActive && 
          lastActive.getDate() === yesterday.getDate() &&
          lastActive.getMonth() === yesterday.getMonth() &&
          lastActive.getFullYear() === yesterday.getFullYear();

        const newStreak = isConsecutiveDay ? user.currentStreak + 1 : 1;
        
        await tx.user.update({
          where: { id: userId },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(user.longestStreak, newStreak)
          }
        });
      }

      // Log XP gain
      await tx.xpHistory.create({
        data: {
          userId,
          amount: xpAmount,
          source,
          newTotal: user.xp + xpAmount
        }
      });

      return user;
    });
  }

  // Badge Management
  static async awardBadge(userId, badgeId, progress = null) {
    return await prisma.$transaction(async (tx) => {
      // Check if badge exists
      const badge = await tx.badge.findUnique({
        where: { id: badgeId }
      });

      if (!badge) {
        throw new Error(`Badge with ID ${badgeId} not found`);
      }

      // Check if user already has this badge
      const existingBadge = await tx.userBadge.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId
          }
        }
      });

      if (existingBadge) {
        if (existingBadge.isUnlocked) {
          throw new BadgeAwardedError('User already has this badge');
        }
        
        // Update progress if badge is not yet unlocked
        if (progress !== null && badge.requiredValue && progress < badge.requiredValue) {
          return await tx.userBadge.update({
            where: { id: existingBadge.id },
            data: { progress }
          });
        }
      }

      // Award the badge
      return await tx.userBadge.upsert({
        where: {
          userId_badgeId: {
            userId,
            badgeId
          }
        },
        update: {
          isUnlocked: true,
          earnedAt: new Date(),
          progress: badge.requiredValue || null
        },
        create: {
          userId,
          badgeId,
          isUnlocked: true,
          progress: badge.requiredValue || null
        }
      });
    });
  }

  // Leaderboard Management
  static async updateLeaderboard(userId, score, subjectId = null) {
    return await prisma.$transaction(async (tx) => {
      // Update overall leaderboard
      await this.updateLeaderboardEntry(userId, score, null, tx);
      
      // Update subject-specific leaderboard if subjectId is provided
      if (subjectId) {
        await this.updateLeaderboardEntry(userId, score, subjectId, tx);
      }

      // Check for leaderboard badges
      await this.checkLeaderboardBadges(userId, tx);
    });
  }

  // Daily Challenges
  static async getDailyChallenges(userId, date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const challenges = await prisma.dailyChallenge.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        userChallenges: {
          where: { userId },
          take: 1
        },
        badgeReward: true,
        subject: true
      }
    });

    return challenges.map(challenge => ({
      ...challenge,
      userProgress: challenge.userChallenges[0] || null,
      userChallenges: undefined // Remove the array
    }));
  }

  static async updateChallengeProgress(userId, challengeId, progressDelta = 1) {
    return await prisma.$transaction(async (tx) => {
      const challenge = await tx.dailyChallenge.findUnique({
        where: { id: challengeId }
      });

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      const userChallenge = await tx.userChallenge.upsert({
        where: {
          userId_challengeId: {
            userId,
            challengeId
          }
        },
        update: {
          progress: {
            increment: progressDelta
          }
        },
        create: {
          userId,
          challengeId,
          progress: progressDelta
        },
        include: {
          challenge: true
        }
      });

      // Check if challenge is completed
      if (!userChallenge.isCompleted && 
          userChallenge.progress >= userChallenge.challenge.requiredValue) {
        
        await tx.userChallenge.update({
          where: { id: userChallenge.id },
          data: {
            isCompleted: true,
            completedAt: new Date()
          }
        });

        // Award XP
        if (userChallenge.challenge.xpReward > 0) {
          await this.addXP(
            userId, 
            userChallenge.challenge.xpReward,
            `challenge_completion:${challengeId}`
          );
        }

        // Award badge if specified
        if (userChallenge.challenge.badgeRewardId) {
          await this.awardBadge(
            userId, 
            userChallenge.challenge.badgeRewardId
          );
        }
      }

      return userChallenge;
    });
  }

  // Helper Methods
  static calculateXPForLevel(level) {
    // Exponential curve for level progression
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  static async updateLeaderboardEntry(userId, score, subjectId, tx) {
    const existingEntry = await tx.leaderboardEntry.findFirst({
      where: {
        userId,
        subjectId
      }
    });

    const testCount = (existingEntry?.testCount || 0) + 1;
    const totalScore = (existingEntry?.totalScore || 0) + score;
    const averageScore = Math.round(totalScore / testCount);

    await tx.leaderboardEntry.upsert({
      where: {
        id: existingEntry?.id || 'new-entry',
      },
      update: {
        testCount,
        totalScore,
        averageScore,
        lastUpdated: new Date()
      },
      create: {
        userId,
        subjectId,
        testCount: 1,
        totalScore: score,
        averageScore: score,
        lastUpdated: new Date()
      }
    });
  }

  static async checkLeaderboardBadges(userId, tx) {
    // Example: Award badges based on leaderboard position
    const overallRank = await this.getUserRank(userId, null, tx);
    
    if (overallRank <= 1) {
      await this.awardBadge(userId, 'top_1_global', tx);
    } else if (overallRank <= 3) {
      await this.awardBadge(userId, 'top_3_global', tx);
    } else if (overallRank <= 10) {
      await this.awardBadge(userId, 'top_10_global', tx);
    }
  }

  static async getUserRank(userId, subjectId = null, tx = prisma) {
    const leaderboard = await tx.leaderboardEntry.findMany({
      where: { subjectId },
      orderBy: [
        { totalScore: 'desc' },
        { lastUpdated: 'asc' }
      ],
      select: { userId: true }
    });

    return leaderboard.findIndex(entry => entry.userId === userId) + 1;
  }
}

export default GamificationService;
