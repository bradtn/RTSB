const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateEmails() {
  try {
    console.log('📧 Updating all officer emails to bradnohra@gmail.com...');
    
    // Update all seniority list emails
    const result = await prisma.seniorityList.updateMany({
      data: {
        personalEmail: 'bradnohra@gmail.com',
        workEmail: 'bradnohra@gmail.com',
      },
    });
    
    console.log(`✅ Updated ${result.count} officer email addresses`);
    
    // Also set up mixed languages for testing
    const officers = await prisma.seniorityList.findMany({
      orderBy: { seniorityRank: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });
    
    // Update users with mixed languages for testing
    const languageUpdates = [
      { rank: 1, language: 'FR' },  // First officer French
      { rank: 2, language: 'EN' },  // Second officer English  
      { rank: 3, language: 'FR' },  // Third officer French
      { rank: 4, language: 'EN' },  // Fourth officer English
      { rank: 5, language: 'FR' },  // Fifth officer French
      { rank: 6, language: 'EN' },  // Sixth officer English
      { rank: 7, language: 'FR' },  // Seventh officer French
    ];
    
    for (const update of languageUpdates) {
      const officer = officers.find(o => o.seniorityRank === update.rank);
      if (officer) {
        await prisma.user.update({
          where: { id: officer.user.id },
          data: { notificationLanguage: update.language },
        });
        console.log(`🌍 Set ${officer.user.firstName} ${officer.user.lastName} (rank ${update.rank}) to ${update.language}`);
      }
    }
    
    // Show final status
    console.log('\n📋 Updated Officer Status:');
    const updatedOfficers = await prisma.seniorityList.findMany({
      orderBy: { seniorityRank: 'asc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            notificationLanguage: true,
          }
        }
      }
    });
    
    updatedOfficers.forEach(officer => {
      console.log(`  Rank ${officer.seniorityRank}: ${officer.user.firstName} ${officer.user.lastName} (${officer.user.notificationLanguage}) - ${officer.personalEmail} - ${officer.currentBiddingStatus}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEmails();