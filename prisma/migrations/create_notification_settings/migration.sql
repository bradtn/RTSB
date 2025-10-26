-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "emailProvider" TEXT NOT NULL DEFAULT 'smtp',
    "emailHost" TEXT,
    "emailPort" INTEGER,
    "emailSecure" BOOLEAN DEFAULT false,
    "emailUser" TEXT,
    "emailPassword" TEXT,
    "emailFromAddress" TEXT,
    "emailFromName" TEXT,
    "exchangeUrl" TEXT,
    "exchangeUsername" TEXT,
    "exchangePassword" TEXT,
    "gmailClientId" TEXT,
    "gmailClientSecret" TEXT,
    "gmailRefreshToken" TEXT,
    "twilioEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twilioAccountSid" TEXT,
    "twilioAuthToken" TEXT,
    "twilioFromNumber" TEXT,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationSettings_createdAt_idx" ON "NotificationSettings"("createdAt");