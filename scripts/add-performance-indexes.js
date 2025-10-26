const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addPerformanceIndexes() {
  console.log('Adding performance indexes...');
  
  try {
    // Add indexes using raw SQL
    await prisma.$executeRaw`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bidline_status_operation ON "BidLine" (status, "operationId")`;
    console.log('✓ Added idx_bidline_status_operation');
    
    await prisma.$executeRaw`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bidline_operation_linenumber ON "BidLine" ("operationId", "lineNumber")`;
    console.log('✓ Added idx_bidline_operation_linenumber');
    
    await prisma.$executeRaw`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bidline_schedule ON "BidLine" ("scheduleId") WHERE "scheduleId" IS NOT NULL`;
    console.log('✓ Added idx_bidline_schedule');
    
    await prisma.$executeRaw`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favoriteline_user_bidline ON "FavoriteLine" ("userId", "bidLineId")`;
    console.log('✓ Added idx_favoriteline_user_bidline');
    
    await prisma.$executeRaw`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scheduleshift_schedule_day ON "ScheduleShift" ("scheduleId", "dayNumber")`;
    console.log('✓ Added idx_scheduleshift_schedule_day');
    
    await prisma.$executeRaw`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operation_active_name ON "Operation" ("isActive", name) WHERE "isActive" = true`;
    console.log('✓ Added idx_operation_active_name');
    
    console.log('All performance indexes added successfully!');
    
  } catch (error) {
    console.error('Error adding indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPerformanceIndexes();