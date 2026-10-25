-- Create roles table
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- Create unique index on roles.name
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- Insert the 6 roles
INSERT INTO "roles" ("id", "name", "description") VALUES
    ('general-manager-id', 'GENERAL_MANAGER', 'General Manager'),
    ('project-manager-id', 'PROJECT_MANAGER', 'Project Manager'),
    ('hr-manager-id', 'HR_MANAGER', 'HR Manager'),
    ('site-engineer-id', 'SITE_ENGINEER', 'Site Engineer'),
    ('procurement-officer-id', 'PROCUREMENT_OFFICER', 'Procurement Officer'),
    ('accountant-id', 'ACCOUNTANT', 'Accountant');

-- Add roleId column to users with a default value
ALTER TABLE "users" ADD COLUMN "roleId" TEXT;

-- Update existing users to map their role enum to the new roleId
UPDATE "users" SET "roleId" = 'general-manager-id' WHERE "role" = 'GENERAL_MANAGER';
UPDATE "users" SET "roleId" = 'project-manager-id' WHERE "role" = 'PROJECT_MANAGER';
UPDATE "users" SET "roleId" = 'hr-manager-id' WHERE "role" = 'HR_MANAGER';
UPDATE "users" SET "roleId" = 'site-engineer-id' WHERE "role" = 'SITE_ENGINEER';
UPDATE "users" SET "roleId" = 'procurement-officer-id' WHERE "role" = 'PROCUREMENT_OFFICER';
UPDATE "users" SET "roleId" = 'accountant-id' WHERE "role" = 'ACCOUNTANT';

-- Make roleId NOT NULL
ALTER TABLE "users" ALTER COLUMN "roleId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add email verification columns
ALTER TABLE "users" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "users" ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3);

-- Create index on emailVerificationToken
CREATE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");

-- Drop the old role column
ALTER TABLE "users" DROP COLUMN "role";

-- Create index on roleId
CREATE INDEX "users_roleId_idx" ON "users"("roleId");
