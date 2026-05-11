-- Migration: add_v2_enhancements
-- Adds CourseViewLog, CourseSearchLog, MessageLike, CourseBookmark models
-- Adds grade field to Message
-- Adds back-relations (no SQL needed for back-relations, they are Prisma-only)

-- Add grade column to Message
ALTER TABLE "Message" ADD COLUMN "grade" TEXT;

-- Create CourseViewLog table
CREATE TABLE "CourseViewLog" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseViewLog_pkey" PRIMARY KEY ("id")
);

-- Create CourseSearchLog table
CREATE TABLE "CourseSearchLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "courseId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseSearchLog_pkey" PRIMARY KEY ("id")
);

-- Create MessageLike table
CREATE TABLE "MessageLike" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageLike_pkey" PRIMARY KEY ("id")
);

-- Create CourseBookmark table
CREATE TABLE "CourseBookmark" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseBookmark_pkey" PRIMARY KEY ("id")
);

-- Create indexes for CourseViewLog
CREATE INDEX "CourseViewLog_courseId_idx" ON "CourseViewLog"("courseId");
CREATE INDEX "CourseViewLog_createdAt_idx" ON "CourseViewLog"("createdAt");

-- Create indexes for CourseSearchLog
CREATE INDEX "CourseSearchLog_courseId_idx" ON "CourseSearchLog"("courseId");
CREATE INDEX "CourseSearchLog_createdAt_idx" ON "CourseSearchLog"("createdAt");

-- Create unique constraint and index for MessageLike
CREATE UNIQUE INDEX "MessageLike_messageId_userId_key" ON "MessageLike"("messageId", "userId");
CREATE INDEX "MessageLike_messageId_idx" ON "MessageLike"("messageId");

-- Create unique constraint and index for CourseBookmark
CREATE UNIQUE INDEX "CourseBookmark_courseId_userId_key" ON "CourseBookmark"("courseId", "userId");
CREATE INDEX "CourseBookmark_userId_idx" ON "CourseBookmark"("userId");

-- Add foreign keys for CourseViewLog
ALTER TABLE "CourseViewLog" ADD CONSTRAINT "CourseViewLog_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseViewLog" ADD CONSTRAINT "CourseViewLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add foreign keys for CourseSearchLog
ALTER TABLE "CourseSearchLog" ADD CONSTRAINT "CourseSearchLog_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CourseSearchLog" ADD CONSTRAINT "CourseSearchLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add foreign keys for MessageLike
ALTER TABLE "MessageLike" ADD CONSTRAINT "MessageLike_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageLike" ADD CONSTRAINT "MessageLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign keys for CourseBookmark
ALTER TABLE "CourseBookmark" ADD CONSTRAINT "CourseBookmark_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseBookmark" ADD CONSTRAINT "CourseBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
