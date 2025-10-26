import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateShiftCategories() {
  console.log('Updating shift code categories based on start times...\n');
  
  // Get all shift codes
  const shiftCodes = await prisma.shiftCode.findMany({
    orderBy: { code: 'asc' }
  });
  
  let updatedCount = 0;
  const updates: { code: string, oldCategory: string, newCategory: string }[] = [];
  
  for (const shift of shiftCodes) {
    // Skip OFF shifts
    if (shift.code === 'OFF') {
      continue;
    }
    
    // Parse start time
    const [hours, minutes] = shift.beginTime.split(':').map(Number);
    const startTimeMinutes = hours * 60 + minutes;
    
    let newCategory: string;
    
    // Determine category based on start time rules
    if (hours >= 6 && hours < 8) {
      // Days: 06:00-06:59, 07:00, 08:00
      newCategory = 'Days';
    } else if (hours === 8 && minutes === 0) {
      // Days: 08:00 exactly
      newCategory = 'Days';
    } else if (hours === 8 && minutes >= 30 && minutes <= 49) {
      // Late Days: 08:30-08:49
      newCategory = 'Late Days';
    } else if ((hours === 9) || (hours === 10) || (hours === 11 && minutes <= 30)) {
      // Mid Days: 09:00-11:30
      newCategory = 'Mid Days';
    } else if ((hours === 12 && minutes >= 30) || 
               (hours >= 13 && hours <= 14) || 
               (hours === 15 && minutes <= 54)) {
      // Afternoons: 12:30-15:54
      newCategory = 'Afternoons';
    } else if ((hours === 18 && minutes >= 45) || 
               (hours === 19) || 
               (hours === 20 && minutes <= 45)) {
      // Midnights: 18:45-20:45
      newCategory = 'Midnights';
    } else {
      // Default to existing category if outside defined ranges
      console.log(`⚠️  Shift ${shift.code} (${shift.beginTime}) doesn't match any defined time range. Keeping as: ${shift.category}`);
      continue;
    }
    
    // Update if category changed
    if (shift.category !== newCategory) {
      await prisma.shiftCode.update({
        where: { id: shift.id },
        data: { category: newCategory }
      });
      
      updates.push({
        code: shift.code,
        oldCategory: shift.category,
        newCategory: newCategory
      });
      
      updatedCount++;
      console.log(`✅ Updated ${shift.code} (${shift.beginTime}): ${shift.category} → ${newCategory}`);
    } else {
      console.log(`✓  ${shift.code} (${shift.beginTime}): Already correct as ${shift.category}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total shift codes processed: ${shiftCodes.length}`);
  console.log(`Shift codes updated: ${updatedCount}`);
  console.log(`Shift codes unchanged: ${shiftCodes.length - updatedCount}`);
  
  if (updates.length > 0) {
    console.log('\nChanges made:');
    console.log('-'.repeat(60));
    
    // Group by category change
    const changeGroups: { [key: string]: string[] } = {};
    updates.forEach(u => {
      const key = `${u.oldCategory} → ${u.newCategory}`;
      if (!changeGroups[key]) changeGroups[key] = [];
      changeGroups[key].push(u.code);
    });
    
    for (const [change, codes] of Object.entries(changeGroups)) {
      console.log(`${change}: ${codes.join(', ')}`);
    }
  }
  
  // Show category distribution
  const categoryCounts = await prisma.shiftCode.groupBy({
    by: ['category'],
    _count: true,
    orderBy: { category: 'asc' }
  });
  
  console.log('\nFinal category distribution:');
  console.log('-'.repeat(60));
  categoryCounts.forEach(cat => {
    console.log(`${cat.category}: ${cat._count} shift codes`);
  });
}

// Run the update
updateShiftCategories()
  .then(() => {
    console.log('\n✅ Shift category update completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error updating shift categories:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });