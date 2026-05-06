-- CreateIndex
CREATE INDEX "DifficultyRating_courseId_idx" ON "DifficultyRating"("courseId");

-- CreateIndex
CREATE INDEX "Message_roomId_createdAt_idx" ON "Message"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_roomId_isDeleted_createdAt_idx" ON "Message"("roomId", "isDeleted", "createdAt");
