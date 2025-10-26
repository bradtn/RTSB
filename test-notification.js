const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotification() {
  try {
    console.log('🧪 Testing notification sending...');
    
    // Get the first officer who is up_next
    const firstOfficer = await prisma.seniorityList.findFirst({
      where: { currentBiddingStatus: 'up_next' },
      include: { user: true },
    });
    
    if (!firstOfficer) {
      console.log('❌ No officer found with up_next status');
      return;
    }
    
    console.log(`📋 Found officer: ${firstOfficer.user.firstName} ${firstOfficer.user.lastName} (${firstOfficer.user.notificationLanguage})`);
    console.log(`📧 Email addresses: personal=${firstOfficer.personalEmail}, work=${firstOfficer.workEmail}, user=${firstOfficer.user.email}`);
    
    // Test the notification API directly
    const response = await fetch('http://localhost:3000/api/admin/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // For testing, we'll need a session - this won't work without proper auth
      },
      body: JSON.stringify({
        userId: firstOfficer.userId,
        type: 'your_turn',
        sendMethod: 'email',
      }),
    });
    
    console.log(`📡 API Response Status: ${response.status}`);
    const result = await response.json();
    console.log('📡 API Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotification();