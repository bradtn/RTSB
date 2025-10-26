import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to calculate hours between two times, accounting for shifts that cross midnight
function calculateHours(beginTime: string, endTime: string): number {
  const [beginHour, beginMinute] = beginTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let beginMinutes = beginHour * 60 + beginMinute;
  let endMinutes = endHour * 60 + endMinute;
  
  // If end time is less than begin time, it crosses midnight
  if (endMinutes <= beginMinutes) {
    endMinutes += 24 * 60; // Add 24 hours
  }
  
  const totalMinutes = endMinutes - beginMinutes;
  
  // Subtract 30 minutes for lunch break for shifts 7+ hours
  const hours = totalMinutes / 60;
  return hours >= 7 ? hours - 0.5 : hours;
}

// Function to categorize shifts based on start time
function categorizeShift(beginTime: string): string {
  const [hour] = beginTime.split(':').map(Number);
  
  if (hour >= 6 && hour < 12) {
    return 'Days';
  } else if (hour >= 12 && hour < 18) {
    return 'Afternoons';
  } else {
    return 'Midnights';
  }
}

// New shift codes to add
const newShiftCodes = [
  { code: '06BC', beginTime: '06:30', endTime: '17:30' },
  { code: '06BD', beginTime: '06:30', endTime: '17:45' },
  { code: '06BG', beginTime: '06:30', endTime: '18:30' },
  { code: '06BI', beginTime: '06:30', endTime: '18:45' },
  { code: '06BL', beginTime: '06:45', endTime: '17:15' },
  { code: '06BM', beginTime: '06:45', endTime: '17:15' },
  { code: '06BO', beginTime: '06:45', endTime: '18:00' },
  { code: '06CG', beginTime: '06:45', endTime: '19:00' },
  { code: '06CJ', beginTime: '06:54', endTime: '16:00' },
  { code: '06CK', beginTime: '06:54', endTime: '16:30' },
  { code: '07AJ', beginTime: '07:00', endTime: '15:00' },
  { code: '07AQ', beginTime: '07:00', endTime: '17:30' },
  { code: '07AW', beginTime: '07:00', endTime: '17:30' },
  { code: '07BB', beginTime: '07:00', endTime: '19:00' },
  { code: '08BS', beginTime: '08:30', endTime: '19:00' },
  { code: '08FN', beginTime: '08:45', endTime: '19:15' },
  { code: '08FZ', beginTime: '08:45', endTime: '19:15' },
  { code: '09AN', beginTime: '09:00', endTime: '21:00' },
  { code: '09BQ', beginTime: '09:30', endTime: '20:30' },
  { code: '09FM', beginTime: '09:30', endTime: '20:45' },
  { code: '10AL', beginTime: '10:00', endTime: '20:30' },
  { code: '10BB', beginTime: '10:30', endTime: '21:00' },
  { code: '10BG', beginTime: '10:45', endTime: '21:15' },
  { code: '11AT', beginTime: '11:30', endTime: '21:00' },
  { code: '11BY', beginTime: '11:24', endTime: '21:00' },
  { code: '12BD', beginTime: '12:30', endTime: '23:30' },
  { code: '12BE', beginTime: '12:45', endTime: '00:00' },
  { code: '12CN', beginTime: '12:45', endTime: '23:15' },
  { code: '12CT', beginTime: '12:54', endTime: '22:00' },
  { code: '12CW', beginTime: '12:45', endTime: '01:00' },
  { code: '12DT', beginTime: '12:30', endTime: '23:45' },
  { code: '13AC', beginTime: '13:00', endTime: '01:00' },
  { code: '13AS', beginTime: '13:30', endTime: '00:00' },
  { code: '13AZ', beginTime: '13:45', endTime: '00:15' },
  { code: '13BB', beginTime: '13:45', endTime: '00:15' },
  { code: '14AS', beginTime: '14:24', endTime: '00:00' },
  { code: '14AT', beginTime: '14:30', endTime: '00:00' },
  { code: '14AV', beginTime: '14:30', endTime: '01:00' },
  { code: '14CQ', beginTime: '14:30', endTime: '01:30' },
  { code: '14EC', beginTime: '14:30', endTime: '01:45' },
  { code: '15AN', beginTime: '15:00', endTime: '23:00' },
  { code: '15AZ', beginTime: '15:30', endTime: '02:00' },
  { code: '15BV', beginTime: '15:54', endTime: '01:00' },
  { code: '15CP', beginTime: '15:45', endTime: '02:15' },
  { code: '18AQ', beginTime: '18:45', endTime: '07:00' },
  { code: '19AF', beginTime: '19:00', endTime: '07:00' },
  { code: '19AO', beginTime: '19:30', endTime: '07:30' },
  { code: '19AR', beginTime: '19:45', endTime: '07:00' },
  { code: '19CJ', beginTime: '19:15', endTime: '07:30' },
  { code: '20AN', beginTime: '20:15', endTime: '07:30' },
  { code: '20AR', beginTime: '20:30', endTime: '07:00' },
  { code: '20AT', beginTime: '20:30', endTime: '07:00' },
  { code: '20AU', beginTime: '20:45', endTime: '07:15' },
  { code: '20CD', beginTime: '20:15', endTime: '07:15' }
];

async function main() {
  console.log('Starting to add shift codes...');
  
  let added = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const shiftData of newShiftCodes) {
    try {
      // Check if shift code already exists
      const existing = await prisma.shiftCode.findUnique({
        where: { code: shiftData.code }
      });
      
      if (existing) {
        console.log(`⚠️  Shift code ${shiftData.code} already exists - skipping`);
        skipped++;
        continue;
      }
      
      // Calculate hours and category
      const hoursLength = calculateHours(shiftData.beginTime, shiftData.endTime);
      const category = categorizeShift(shiftData.beginTime);
      
      // Create the shift code
      const shiftCode = await prisma.shiftCode.create({
        data: {
          code: shiftData.code,
          beginTime: shiftData.beginTime,
          endTime: shiftData.endTime,
          category,
          hoursLength,
          isActive: true
        }
      });
      
      console.log(`✅ Added ${shiftCode.code}: ${shiftCode.beginTime}-${shiftCode.endTime} (${hoursLength}h, ${category})`);
      added++;
      
    } catch (error) {
      console.error(`❌ Error adding shift code ${shiftData.code}:`, error);
      errors++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`✅ Added: ${added}`);
  console.log(`⚠️  Skipped (already exist): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📋 Total processed: ${newShiftCodes.length}`);
}

main()
  .catch((e) => {
    console.error('Error running script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });