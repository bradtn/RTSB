-- AlterTable
ALTER TABLE "public"."BidLine" ADD COLUMN     "bidPeriodId" TEXT,
ADD COLUMN     "scheduleId" TEXT,
ALTER COLUMN "shiftStart" DROP NOT NULL,
ALTER COLUMN "shiftEnd" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."BidPeriod" ADD COLUMN     "numCycles" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "public"."ShiftCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "beginTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "hoursLength" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Schedule" (
    "id" TEXT NOT NULL,
    "bidPeriodId" TEXT NOT NULL,
    "lineNumber" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "groupName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduleShift" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shiftCodeId" TEXT,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "ScheduleShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShiftCode_code_key" ON "public"."ShiftCode"("code");

-- CreateIndex
CREATE INDEX "Schedule_bidPeriodId_idx" ON "public"."Schedule"("bidPeriodId");

-- CreateIndex
CREATE INDEX "Schedule_operationId_idx" ON "public"."Schedule"("operationId");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_bidPeriodId_lineNumber_key" ON "public"."Schedule"("bidPeriodId", "lineNumber");

-- CreateIndex
CREATE INDEX "ScheduleShift_scheduleId_idx" ON "public"."ScheduleShift"("scheduleId");

-- CreateIndex
CREATE INDEX "ScheduleShift_date_idx" ON "public"."ScheduleShift"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleShift_scheduleId_dayNumber_key" ON "public"."ScheduleShift"("scheduleId", "dayNumber");

-- CreateIndex
CREATE INDEX "BidLine_bidPeriodId_idx" ON "public"."BidLine"("bidPeriodId");

-- AddForeignKey
ALTER TABLE "public"."BidLine" ADD CONSTRAINT "BidLine_bidPeriodId_fkey" FOREIGN KEY ("bidPeriodId") REFERENCES "public"."BidPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BidLine" ADD CONSTRAINT "BidLine_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_bidPeriodId_fkey" FOREIGN KEY ("bidPeriodId") REFERENCES "public"."BidPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "public"."Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleShift" ADD CONSTRAINT "ScheduleShift_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleShift" ADD CONSTRAINT "ScheduleShift_shiftCodeId_fkey" FOREIGN KEY ("shiftCodeId") REFERENCES "public"."ShiftCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
