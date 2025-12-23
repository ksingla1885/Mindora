-- Create DPP configuration table
CREATE TABLE "DPPConfig" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "subjects" JSONB NOT NULL, -- Array of subject IDs
  "classLevels" JSONB NOT NULL, -- Array of class levels (9, 10, 11, 12)
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create DPP schedule table
CREATE TABLE "DPPSchedule" (
  "id" SERIAL PRIMARY KEY,
  "dppConfigId" INTEGER NOT NULL,
  "dayOfWeek" INTEGER NOT NULL, -- 0 (Sunday) to 6 (Saturday)
  "subjectId" INTEGER NOT NULL,
  "classLevel" INTEGER NOT NULL,
  "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
  "questionCount" INTEGER NOT NULL DEFAULT 1,
  "topics" JSONB, -- Optional: Specific topics to include
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  FOREIGN KEY ("dppConfigId") REFERENCES "DPPConfig"("id") ON DELETE CASCADE,
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE
);

-- Create DPP assignments table
CREATE TABLE "DPPAssignment" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "questionId" INTEGER NOT NULL,
  "scheduledFor" DATE NOT NULL,
  "completedAt" TIMESTAMP(3),
  "isCorrect" BOOLEAN,
  "timeSpent" INTEGER, -- in seconds
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX "DPPAssignment_userId_scheduledFor_idx" ON "DPPAssignment" ("userId", "scheduledFor");
CREATE INDEX "DPPAssignment_userId_completedAt_idx" ON "DPPAssignment" ("userId", "completedAt");

-- Add DPP streak tracking to User model
ALTER TABLE "User" 
ADD COLUMN "dppCurrentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "dppMaxStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "dppLastCompletedAt" TIMESTAMP(3);
