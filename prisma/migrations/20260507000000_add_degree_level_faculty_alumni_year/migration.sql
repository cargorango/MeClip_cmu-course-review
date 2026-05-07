-- Add DegreeLevel enum
CREATE TYPE "DegreeLevel" AS ENUM ('BACHELOR', 'MASTER', 'DOCTORAL');

-- Add new columns to User
ALTER TABLE "User"
  ADD COLUMN "degreeLevel" "DegreeLevel",
  ADD COLUMN "faculty"     TEXT,
  ADD COLUMN "alumniYear"  INTEGER;

-- Add snapshot columns to Message
ALTER TABLE "Message"
  ADD COLUMN "senderDegreeLevel" "DegreeLevel",
  ADD COLUMN "senderFaculty"     TEXT,
  ADD COLUMN "senderAlumniYear"  INTEGER;
