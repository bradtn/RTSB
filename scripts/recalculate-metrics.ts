#!/usr/bin/env tsx
/**
 * Script to recalculate all schedule metrics using the updated calculation logic
 * This uses the schedule-metrics.ts module which has the corrected Friday-weekend
 * and weekday blocks calculation logic
 */

import { PrismaClient } from '@prisma/client';
import { updateAllBidLineMetricsForPeriod } from '../src/lib/schedule-metrics';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting metrics recalculation with updated logic...');
  
  try {
    // Get all unique bid periods that have bid lines with schedules
    const bidPeriods = await prisma.bidPeriod.findMany({
      where: {
        bidLines: {
          some: {
            scheduleId: { not: null }
          }
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`Found ${bidPeriods.length} bid periods to update`);

    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const bidPeriod of bidPeriods) {
      console.log(`\nUpdating bid period: ${bidPeriod.name}`);
      const result = await updateAllBidLineMetricsForPeriod(bidPeriod.id);
      totalUpdated += result.updated;
      totalSkipped += result.skipped;
      console.log(`  - Updated: ${result.updated}, Skipped: ${result.skipped}`);
    }

    console.log(`\n✅ Metrics recalculation complete!`);
    console.log(`   Total updated: ${totalUpdated}`);
    console.log(`   Total skipped: ${totalSkipped}`);
    
  } catch (error) {
    console.error('Error during metrics recalculation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});