const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetQueue() {
  try {
    console.log('🔄 Resetting notification queue...');
    
    // Reset all bidding statuses
    await prisma.seniorityList.updateMany({
      data: {
        currentBiddingStatus: 'waiting',
        hasBid: false,
        bidAt: null,
      },
    });
    
    // Get officers in order
    const officers = await prisma.seniorityList.findMany({
      orderBy: { seniorityRank: 'asc' },
      take: 2,
    });
    
    // Set first as up_next
    if (officers.length > 0) {
      await prisma.seniorityList.update({
        where: { id: officers[0].id },
        data: { currentBiddingStatus: 'up_next' },
      });
      console.log(`✅ Set rank ${officers[0].seniorityRank} as up_next`);
    }
    
    // Set second as next_in_line
    if (officers.length > 1) {
      await prisma.seniorityList.update({
        where: { id: officers[1].id },
        data: { currentBiddingStatus: 'next_in_line' },
      });
      console.log(`✅ Set rank ${officers[1].seniorityRank} as next_in_line`);
    }
    
    const totalCount = await prisma.seniorityList.count();
    console.log(`🎯 Queue reset complete! ${totalCount} officers total.`);
    
    // Show current status
    const currentQueue = await prisma.seniorityList.findMany({
      where: {
        currentBiddingStatus: { in: ['up_next', 'next_in_line'] }
      },
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
    
    console.log('\n📋 Current Queue Status:');
    currentQueue.forEach(officer => {
      console.log(`  Rank ${officer.seniorityRank}: ${officer.user.firstName} ${officer.user.lastName} (${officer.user.notificationLanguage}) - ${officer.currentBiddingStatus}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetQueue();