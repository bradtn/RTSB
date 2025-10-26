-- Critical Performance Indexes for Bid Lines Dashboard
-- These indexes will dramatically speed up the most common queries

-- BidLine table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bidline_status_operation ON "BidLine" (status, "operationId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bidline_operation_linenumber ON "BidLine" ("operationId", "lineNumber");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bidline_schedule ON "BidLine" ("scheduleId") WHERE "scheduleId" IS NOT NULL;

-- FavoriteLine table indexes  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favoriteline_user_bidline ON "FavoriteLine" ("userId", "bidLineId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favoriteline_bidline ON "FavoriteLine" ("bidLineId");

-- ScheduleShift table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scheduleshift_schedule_day ON "ScheduleShift" ("scheduleId", "dayNumber");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scheduleshift_shiftcode ON "ScheduleShift" ("shiftCodeId") WHERE "shiftCodeId" IS NOT NULL;

-- Operation table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operation_active_name ON "Operation" ("isActive", name) WHERE "isActive" = true;

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bidline_composite_dashboard ON "BidLine" (status, "operationId", "lineNumber");