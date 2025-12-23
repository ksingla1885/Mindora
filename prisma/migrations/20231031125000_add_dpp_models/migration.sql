-- Create DPPAssignment model
CREATE TABLE "DPPAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "answer" TEXT,
    "isCorrect" BOOLEAN,
    "score" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "DPPAssignment_pkey" PRIMARY KEY ("id")
);

-- Create DPPConfig model
CREATE TABLE "DPPConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjects" JSONB NOT NULL DEFAULT '[]',
    "difficulty" TEXT[] DEFAULT ARRAY['easy', 'medium', 'hard'],
    "dailyLimit" INTEGER NOT NULL DEFAULT 5,
    "timeOfDay" TEXT NOT NULL DEFAULT '09:00',
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DPPConfig_pkey" PRIMARY KEY ("id")
);

-- Create DPPProgress model
CREATE TABLE "DPPProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalAssigned" INTEGER NOT NULL DEFAULT 0,
    "totalCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalIncorrect" INTEGER NOT NULL DEFAULT 0,
    "totalSkipped" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0, -- in seconds
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" DATE,
    "metadata" JSONB,

    CONSTRAINT "DPPProgress_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "DPPConfig_userId_key" ON "DPPConfig"("userId");
CREATE UNIQUE INDEX "DPPProgress_userId_date_key" ON "DPPProgress"("userId", "date");

-- Add foreign key constraints
ALTER TABLE "DPPAssignment" ADD CONSTRAINT "DPPAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DPPAssignment" ADD CONSTRAINT "DPPAssignment_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DPPConfig" ADD CONSTRAINT "DPPConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DPPProgress" ADD CONSTRAINT "DPPProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
