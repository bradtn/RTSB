import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOff() {
  const offs = await prisma.shiftCode.findMany({ 
    where: { code: 'OFF' } 
  });
  
  console.log('OFF shift codes:', offs);
  
  if (offs.length === 0) {
    console.log('No OFF shift codes found. Creating one...');
    await prisma.shiftCode.create({
      data: {
        code: 'OFF',
        beginTime: '00:00',
        endTime: '00:00',
        category: 'Off',
        hoursLength: 0
      }
    });
    console.log('OFF shift code created.');
  }
}

checkOff()
  .then(() => prisma.$disconnect())
  .catch(error => {
    console.error(error);
    process.exit(1);
  });