/**
 * Script to fix duplicate favorite ranks
 * This script will re-number all favorite rankings for each user to ensure proper sequential ordering
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Starting favorite ranks cleanup...');

    // Get all users who have favorites
    const usersWithFavorites = await prisma.user.findMany({
      where: {
        favoritedLines: {
          some: {}
        }
      },
      select: {
        id: true,
        email: true,
        favoritedLines: {
          select: {
            id: true,
            rank: true,
            createdAt: true,
            bidLineId: true,
          },
          orderBy: [
            { rank: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    console.log(`Found ${usersWithFavorites.length} users with favorites`);

    for (const user of usersWithFavorites) {
      console.log(`Processing user: ${user.email} (${user.favoritedLines.length} favorites)`);

      // Check for duplicates or null ranks
      const rankCounts = {};
      let hasNullRanks = false;
      let hasDuplicates = false;

      user.favoritedLines.forEach(fav => {
        if (fav.rank === null) {
          hasNullRanks = true;
        } else {
          if (rankCounts[fav.rank]) {
            rankCounts[fav.rank]++;
            hasDuplicates = true;
          } else {
            rankCounts[fav.rank] = 1;
          }
        }
      });

      if (hasNullRanks || hasDuplicates) {
        console.log(`  - User has ${hasNullRanks ? 'null ranks' : ''} ${hasDuplicates ? 'duplicate ranks' : ''}`);
        
        // Re-number all favorites for this user
        // Sort by existing rank (nulls last), then by creation date
        const sortedFavorites = user.favoritedLines.sort((a, b) => {
          if (a.rank === null && b.rank === null) {
            return new Date(a.createdAt) - new Date(b.createdAt);
          }
          if (a.rank === null) return 1;
          if (b.rank === null) return -1;
          if (a.rank === b.rank) {
            return new Date(a.createdAt) - new Date(b.createdAt);
          }
          return a.rank - b.rank;
        });

        // Update ranks sequentially
        for (let i = 0; i < sortedFavorites.length; i++) {
          const favorite = sortedFavorites[i];
          const newRank = i + 1;
          
          await prisma.favoriteLine.update({
            where: { id: favorite.id },
            data: { rank: newRank }
          });

          console.log(`  - Updated favorite ${favorite.bidLineId}: rank ${favorite.rank} -> ${newRank}`);
        }
      } else {
        console.log(`  - User has clean ranks, no changes needed`);
      }
    }

    console.log('Favorite ranks cleanup completed!');

    // Verify the fix
    console.log('\nVerifying results...');
    const duplicateRanks = await prisma.$queryRaw`
      SELECT "userId", rank, COUNT(*) as count
      FROM "FavoriteLine"
      WHERE rank IS NOT NULL
      GROUP BY "userId", rank
      HAVING COUNT(*) > 1
    `;

    if (duplicateRanks.length === 0) {
      console.log('✅ No duplicate ranks found - cleanup successful!');
    } else {
      console.log('❌ Still found duplicate ranks:', duplicateRanks);
    }

    const nullRanks = await prisma.favoriteLine.count({
      where: { rank: null }
    });

    if (nullRanks === 0) {
      console.log('✅ No null ranks found - cleanup successful!');
    } else {
      console.log(`❌ Still found ${nullRanks} null ranks`);
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();