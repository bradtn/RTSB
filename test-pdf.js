const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://shift_user:shift_password_change_in_production@localhost:5432/shift_bidding"
      }
    }
  });

  try {
    // Get first bid line ID
    const bidLine = await prisma.bidLine.findFirst({
      select: { id: true, lineNumber: true }
    });

    if (bidLine) {
      console.log(`Found bid line: ${bidLine.id} (Line ${bidLine.lineNumber})`);
      
      // Test PDF generation
      const response = await fetch('http://localhost:3004/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidLineId: bidLine.id,
          locale: 'en',
        }),
      });

      if (response.ok) {
        console.log('PDF generated successfully!');
        console.log('Response headers:', Object.fromEntries(response.headers));
      } else {
        console.error('PDF generation failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } else {
      console.log('No bid lines found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();