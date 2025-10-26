-- DropIndex
DROP INDEX "public"."Schedule_bidPeriodId_lineNumber_key";

-- AlterTable
ALTER TABLE "public"."BidLine" ADD COLUMN     "blocks2day" INTEGER,
ADD COLUMN     "blocks3day" INTEGER,
ADD COLUMN     "blocks4day" INTEGER,
ADD COLUMN     "blocks5day" INTEGER,
ADD COLUMN     "blocks6day" INTEGER,
ADD COLUMN     "fridayWeekendBlocks" INTEGER,
ADD COLUMN     "holidaysOff" INTEGER,
ADD COLUMN     "holidaysWorking" INTEGER,
ADD COLUMN     "longestStretch" INTEGER,
ADD COLUMN     "saturdaysOn" INTEGER,
ADD COLUMN     "shiftPattern" TEXT,
ADD COLUMN     "singleDays" INTEGER,
ADD COLUMN     "sundaysOn" INTEGER,
ADD COLUMN     "totalDaysInPeriod" INTEGER,
ADD COLUMN     "totalDaysWorked" INTEGER,
ADD COLUMN     "totalSaturdays" INTEGER,
ADD COLUMN     "totalSaturdaysInPeriod" INTEGER,
ADD COLUMN     "totalSundays" INTEGER,
ADD COLUMN     "totalSundaysInPeriod" INTEGER,
ADD COLUMN     "weekdayBlocks" INTEGER,
ADD COLUMN     "weekendsOn" INTEGER;

-- AlterTable
ALTER TABLE "public"."FavoriteLine" ADD COLUMN     "rank" INTEGER;

-- AlterTable
ALTER TABLE "public"."NotificationSettings" ADD COLUMN     "resendApiKey" TEXT,
ADD COLUMN     "resendFromEmail" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notificationLanguage" "public"."Language" DEFAULT 'EN',
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "smsNotifications" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."SeniorityList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operationId" TEXT,
    "seniorityRank" INTEGER NOT NULL,
    "personalEmail" TEXT,
    "workEmail" TEXT,
    "personalPhone" TEXT,
    "workPhone" TEXT,
    "preferredContact" TEXT,
    "currentBiddingStatus" TEXT NOT NULL DEFAULT 'waiting',
    "hasBid" BOOLEAN NOT NULL DEFAULT false,
    "bidAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeniorityList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "emailBody" TEXT NOT NULL,
    "smsBody" TEXT NOT NULL,
    "variables" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "type" TEXT NOT NULL,
    "deliveryMethod" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sentBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "NotificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DayOffRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dates" TIMESTAMP(3)[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayOffRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetricSettings" (
    "id" TEXT NOT NULL,
    "operationId" TEXT,
    "showWeekends" BOOLEAN NOT NULL DEFAULT true,
    "showSaturdays" BOOLEAN NOT NULL DEFAULT true,
    "showSundays" BOOLEAN NOT NULL DEFAULT true,
    "show5DayBlocks" BOOLEAN NOT NULL DEFAULT true,
    "show4DayBlocks" BOOLEAN NOT NULL DEFAULT true,
    "showHolidays" BOOLEAN NOT NULL DEFAULT true,
    "show3DayBlocks" BOOLEAN NOT NULL DEFAULT false,
    "show2DayBlocks" BOOLEAN NOT NULL DEFAULT false,
    "show6DayBlocks" BOOLEAN NOT NULL DEFAULT false,
    "showSingleDays" BOOLEAN NOT NULL DEFAULT false,
    "showTotalSaturdays" BOOLEAN NOT NULL DEFAULT false,
    "showTotalSundays" BOOLEAN NOT NULL DEFAULT false,
    "showTotalDays" BOOLEAN NOT NULL DEFAULT false,
    "showLongestStretch" BOOLEAN NOT NULL DEFAULT false,
    "showFridayWeekendBlocks" BOOLEAN NOT NULL DEFAULT false,
    "showWeekdayBlocks" BOOLEAN NOT NULL DEFAULT false,
    "metricOrder" TEXT[] DEFAULT ARRAY['weekends', 'saturdays', 'sundays', '5dayBlocks', '4dayBlocks', 'holidays']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeniorityList_userId_key" ON "public"."SeniorityList"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SeniorityList_seniorityRank_key" ON "public"."SeniorityList"("seniorityRank");

-- CreateIndex
CREATE INDEX "SeniorityList_seniorityRank_idx" ON "public"."SeniorityList"("seniorityRank");

-- CreateIndex
CREATE INDEX "SeniorityList_currentBiddingStatus_idx" ON "public"."SeniorityList"("currentBiddingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_name_key" ON "public"."NotificationTemplate"("name");

-- CreateIndex
CREATE INDEX "NotificationTemplate_category_idx" ON "public"."NotificationTemplate"("category");

-- CreateIndex
CREATE INDEX "NotificationHistory_userId_idx" ON "public"."NotificationHistory"("userId");

-- CreateIndex
CREATE INDEX "NotificationHistory_sentBy_idx" ON "public"."NotificationHistory"("sentBy");

-- CreateIndex
CREATE INDEX "NotificationHistory_status_idx" ON "public"."NotificationHistory"("status");

-- CreateIndex
CREATE INDEX "NotificationHistory_sentAt_idx" ON "public"."NotificationHistory"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "public"."PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expires_idx" ON "public"."PasswordResetToken"("expires");

-- CreateIndex
CREATE INDEX "DayOffRequest_userId_idx" ON "public"."DayOffRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DayOffRequest_userId_key" ON "public"."DayOffRequest"("userId");

-- CreateIndex
CREATE INDEX "MetricSettings_operationId_idx" ON "public"."MetricSettings"("operationId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricSettings_operationId_key" ON "public"."MetricSettings"("operationId");

-- AddForeignKey
ALTER TABLE "public"."SeniorityList" ADD CONSTRAINT "SeniorityList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DayOffRequest" ADD CONSTRAINT "DayOffRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
