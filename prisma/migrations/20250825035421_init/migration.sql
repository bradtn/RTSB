-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPER_ADMIN', 'SUPERVISOR', 'OFFICER');

-- CreateEnum
CREATE TYPE "public"."LineStatus" AS ENUM ('AVAILABLE', 'TAKEN', 'BLACKED_OUT');

-- CreateEnum
CREATE TYPE "public"."Language" AS ENUM ('EN', 'FR');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "badgeNumber" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'OFFICER',
    "language" "public"."Language" NOT NULL DEFAULT 'EN',
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Operation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OperationUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "isSupervisor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BidLine" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "lineNumber" TEXT NOT NULL,
    "shiftStart" TIMESTAMP(3) NOT NULL,
    "shiftEnd" TIMESTAMP(3) NOT NULL,
    "daysOfWeek" TEXT[],
    "location" TEXT,
    "description" TEXT,
    "status" "public"."LineStatus" NOT NULL DEFAULT 'AVAILABLE',
    "takenBy" TEXT,
    "takenAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BidLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FavoriteLine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bidLineId" TEXT NOT NULL,
    "tags" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BidHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bidLineId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BidHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "bidLineId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BidPeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BidPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_badgeNumber_key" ON "public"."User"("badgeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Operation_name_key" ON "public"."Operation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OperationUser_userId_operationId_key" ON "public"."OperationUser"("userId", "operationId");

-- CreateIndex
CREATE INDEX "BidLine_status_idx" ON "public"."BidLine"("status");

-- CreateIndex
CREATE INDEX "BidLine_operationId_idx" ON "public"."BidLine"("operationId");

-- CreateIndex
CREATE UNIQUE INDEX "BidLine_operationId_lineNumber_key" ON "public"."BidLine"("operationId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteLine_userId_bidLineId_key" ON "public"."FavoriteLine"("userId", "bidLineId");

-- CreateIndex
CREATE INDEX "BidHistory_userId_idx" ON "public"."BidHistory"("userId");

-- CreateIndex
CREATE INDEX "BidHistory_bidLineId_idx" ON "public"."BidHistory"("bidLineId");

-- CreateIndex
CREATE INDEX "BidHistory_timestamp_idx" ON "public"."BidHistory"("timestamp");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "public"."Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "public"."ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_bidLineId_idx" ON "public"."ActivityLog"("bidLineId");

-- CreateIndex
CREATE INDEX "ActivityLog_timestamp_idx" ON "public"."ActivityLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- AddForeignKey
ALTER TABLE "public"."OperationUser" ADD CONSTRAINT "OperationUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationUser" ADD CONSTRAINT "OperationUser_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "public"."Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BidLine" ADD CONSTRAINT "BidLine_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "public"."Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavoriteLine" ADD CONSTRAINT "FavoriteLine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavoriteLine" ADD CONSTRAINT "FavoriteLine_bidLineId_fkey" FOREIGN KEY ("bidLineId") REFERENCES "public"."BidLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BidHistory" ADD CONSTRAINT "BidHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BidHistory" ADD CONSTRAINT "BidHistory_bidLineId_fkey" FOREIGN KEY ("bidLineId") REFERENCES "public"."BidLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_bidLineId_fkey" FOREIGN KEY ("bidLineId") REFERENCES "public"."BidLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
