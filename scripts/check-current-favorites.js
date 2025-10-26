/**
 * Script to check current favorites and their ranks
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking current favorites...');

    const allFavorites = await prisma.favoriteLine.findMany({
      include: {
        user: {
          select: { email: true }
        },
        bidLine: {
          select: { lineNumber: true }
        }
      },
      orderBy: [
        { userId: 'asc' },
        { rank: 'asc' }
      ]
    });

    console.log(`Total favorites: ${allFavorites.length}`);
    console.log('\nDetailed breakdown:');
    
    let currentUser = null;
    allFavorites.forEach(fav => {
      if (currentUser !== fav.userId) {
        currentUser = fav.userId;
        console.log(`\n${fav.user.email}:`);
      }
      console.log(`  Line ${fav.bidLine.lineNumber} - Rank ${fav.rank} (ID: ${fav.id})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();