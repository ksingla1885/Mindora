-- Add new tables for enhanced gamification

-- Badge categories
CREATE TYPE "BadgeCategory" AS ENUM ('PERFORMANCE', 'MILESTONE', 'MASTERY', 'SPECIAL', 'STREAK');

-- Enhanced badges table
CREATE TABLE "Badge" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "category" "BadgeCategory" NOT NULL,
  "tier" INTEGER NOT NULL DEFAULT 1,
  "requiredValue" INTEGER,
  "subjectId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Badge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Badge_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL
);

-- User badges with progress tracking
CREATE TABLE "UserBadge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "badgeId" TEXT NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "progress" INTEGER,
  "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
  "notified" BOOLEAN NOT NULL DEFAULT false,
  
  CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE
);

-- User XP and levels
ALTER TABLE "User" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "User" ADD COLUMN "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "longestStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastActiveDate" TIMESTAMP(3);

-- User stats
CREATE TABLE "UserStats" (
  "userId" TEXT NOT NULL,
  "testsCompleted" INTEGER NOT NULL DEFAULT 0,
  "perfectScores" INTEGER NOT NULL DEFAULT 0,
  "totalQuestionsAttempted" INTEGER NOT NULL DEFAULT 0,
  "correctAnswers" INTEGER NOT NULL DEFAULT 0,
  "totalStudyTime" INTEGER NOT NULL DEFAULT 0, -- in minutes
  "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "UserStats_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Daily challenges
CREATE TABLE "DailyChallenge" (
  "id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "xpReward" INTEGER NOT NULL,
  "badgeRewardId" TEXT,
  "subjectId" TEXT,
  "requiredAction" TEXT NOT NULL,
  "requiredValue" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DailyChallenge_badgeRewardId_fkey" FOREIGN KEY ("badgeRewardId") REFERENCES "Badge"("id") ON DELETE SET NULL,
  CONSTRAINT "DailyChallenge_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL
);

-- User progress on challenges
CREATE TABLE "UserChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "claimedReward" BOOLEAN NOT NULL DEFAULT false,
  
  CONSTRAINT "UserChallenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "UserChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DailyChallenge"("id") ON DELETE CASCADE,
  CONSTRAINT "UserChallenge_user_challenge_unique" UNIQUE ("userId", "challengeId")
);

-- Leaderboard snapshots
CREATE TABLE "LeaderboardSnapshot" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
  "subjectId" TEXT,
  "classLevel" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "data" JSONB NOT NULL, -- Snapshot of the leaderboard data
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LeaderboardSnapshot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");
CREATE INDEX "UserBadge_badgeId_idx" ON "UserBadge"("badgeId");
CREATE INDEX "DailyChallenge_date_idx" ON "DailyChallenge"("date");
CREATE INDEX "UserChallenge_userId_idx" ON "UserChallenge"("userId");
CREATE INDEX "UserChallenge_challengeId_idx" ON "UserChallenge"("challengeId");
CREATE INDEX "LeaderboardSnapshot_type_idx" ON "LeaderboardSnapshot"("type");
CREATE INDEX "LeaderboardSnapshot_subjectId_idx" ON "LeaderboardSnapshot"("subjectId");
CREATE INDEX "LeaderboardSnapshot_classLevel_idx" ON "LeaderboardSnapshot"("classLevel");
