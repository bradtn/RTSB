import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const defaultShiftCodes = [
  { code: '06BC', beginTime: '06:30', endTime: '17:30', category: 'Days', hoursLength: 10.5 },
  { code: '06BD', beginTime: '06:30', endTime: '17:45', category: 'Days', hoursLength: 10.75 },
  { code: '06BG', beginTime: '06:30', endTime: '18:30', category: 'Days', hoursLength: 11.5 },
  { code: '06BI', beginTime: '06:30', endTime: '18:45', category: 'Days', hoursLength: 11.75 },
  { code: '06BL', beginTime: '06:45', endTime: '17:15', category: 'Days', hoursLength: 10.0 },
  { code: '06BM', beginTime: '06:45', endTime: '17:15', category: 'Days', hoursLength: 10.0 },
  { code: '06BO', beginTime: '06:45', endTime: '18:00', category: 'Days', hoursLength: 10.75 },
  { code: '06CG', beginTime: '06:45', endTime: '19:00', category: 'Days', hoursLength: 11.75 },
  { code: '06CJ', beginTime: '06:54', endTime: '16:00', category: 'Days', hoursLength: 8.6 },
  { code: '06CK', beginTime: '06:54', endTime: '16:30', category: 'Days', hoursLength: 9.1 },
  { code: '07AJ', beginTime: '07:00', endTime: '15:00', category: 'Days', hoursLength: 7.5 },
  { code: '07AQ', beginTime: '07:00', endTime: '17:30', category: 'Days', hoursLength: 10.0 },
  { code: '07AW', beginTime: '07:00', endTime: '17:30', category: 'Days', hoursLength: 10.0 },
  { code: '07BB', beginTime: '07:00', endTime: '19:00', category: 'Days', hoursLength: 11.5 },
  { code: '08BS', beginTime: '08:30', endTime: '19:00', category: 'Late Days', hoursLength: 10.0 },
  { code: '08FN', beginTime: '08:45', endTime: '19:15', category: 'Late Days', hoursLength: 10.0 },
  { code: '08FZ', beginTime: '08:45', endTime: '19:15', category: 'Late Days', hoursLength: 10.0 },
  { code: '09AN', beginTime: '09:00', endTime: '21:00', category: 'Mid Days', hoursLength: 11.5 },
  { code: '09BQ', beginTime: '09:30', endTime: '20:30', category: 'Mid Days', hoursLength: 10.5 },
  { code: '09FM', beginTime: '09:30', endTime: '20:45', category: 'Mid Days', hoursLength: 10.75 },
  { code: '10AL', beginTime: '10:00', endTime: '20:30', category: 'Mid Days', hoursLength: 10.0 },
  { code: '10BB', beginTime: '10:30', endTime: '21:00', category: 'Mid Days', hoursLength: 10.0 },
  { code: '10BG', beginTime: '10:45', endTime: '21:15', category: 'Mid Days', hoursLength: 10.0 },
  { code: '11AT', beginTime: '11:30', endTime: '21:00', category: 'Mid Days', hoursLength: 9.0 },
  { code: '11BY', beginTime: '11:24', endTime: '21:00', category: 'Mid Days', hoursLength: 9.1 },
  { code: '12BD', beginTime: '12:30', endTime: '23:30', category: 'Afternoons', hoursLength: 10.5 },
  { code: '12BE', beginTime: '12:45', endTime: '00:00', category: 'Afternoons', hoursLength: 10.75 },
  { code: '12CN', beginTime: '12:45', endTime: '23:15', category: 'Afternoons', hoursLength: 10.0 },
  { code: '12CT', beginTime: '12:54', endTime: '22:00', category: 'Afternoons', hoursLength: 8.6 },
  { code: '12CW', beginTime: '12:45', endTime: '01:00', category: 'Afternoons', hoursLength: 11.75 },
  { code: '12DT', beginTime: '12:30', endTime: '23:45', category: 'Afternoons', hoursLength: 10.75 },
  { code: '13AC', beginTime: '13:00', endTime: '01:00', category: 'Afternoons', hoursLength: 11.5 },
  { code: '13AS', beginTime: '13:30', endTime: '00:00', category: 'Afternoons', hoursLength: 10.0 },
  { code: '13AZ', beginTime: '13:45', endTime: '00:15', category: 'Afternoons', hoursLength: 10.0 },
  { code: '13BB', beginTime: '13:45', endTime: '00:15', category: 'Afternoons', hoursLength: 10.0 },
  { code: '14AS', beginTime: '14:24', endTime: '00:00', category: 'Afternoons', hoursLength: 9.1 },
  { code: '14AT', beginTime: '14:30', endTime: '00:00', category: 'Afternoons', hoursLength: 9.0 },
  { code: '14AV', beginTime: '14:30', endTime: '01:00', category: 'Afternoons', hoursLength: 10.0 },
  { code: '14CQ', beginTime: '14:30', endTime: '01:30', category: 'Afternoons', hoursLength: 10.5 },
  { code: '14EC', beginTime: '14:30', endTime: '01:45', category: 'Afternoons', hoursLength: 10.75 },
  { code: '15AN', beginTime: '15:00', endTime: '23:00', category: 'Afternoons', hoursLength: 7.5 },
  { code: '15BV', beginTime: '15:54', endTime: '01:00', category: 'Afternoons', hoursLength: 8.6 },
  { code: '15CP', beginTime: '15:45', endTime: '02:15', category: 'Afternoons', hoursLength: 10.0 },
  { code: '15AZ', beginTime: '15:30', endTime: '02:00', category: 'Afternoons', hoursLength: 10.0 },
  { code: '18AQ', beginTime: '18:45', endTime: '07:00', category: 'Midnights', hoursLength: 11.75 },
  { code: '19AF', beginTime: '19:00', endTime: '07:00', category: 'Midnights', hoursLength: 11.5 },
  { code: '19AO', beginTime: '19:30', endTime: '07:30', category: 'Midnights', hoursLength: 11.5 },
  { code: '19AR', beginTime: '19:45', endTime: '07:00', category: 'Midnights', hoursLength: 10.75 },
  { code: '19CJ', beginTime: '19:15', endTime: '07:30', category: 'Midnights', hoursLength: 11.75 },
  { code: '20AN', beginTime: '20:15', endTime: '07:30', category: 'Midnights', hoursLength: 10.75 },
  { code: '20AR', beginTime: '20:30', endTime: '07:00', category: 'Midnights', hoursLength: 10.0 },
  { code: '20AT', beginTime: '20:30', endTime: '07:00', category: 'Midnights', hoursLength: 10.0 },
  { code: '20AU', beginTime: '20:45', endTime: '07:15', category: 'Midnights', hoursLength: 10.0 },
  { code: '20CD', beginTime: '20:15', endTime: '07:15', category: 'Midnights', hoursLength: 10.5 },
  { code: 'OFF', beginTime: '00:00', endTime: '00:00', category: 'Off', hoursLength: 0 },
];

export async function seedShiftCodes() {
  console.log('Seeding shift codes...');
  
  for (const shiftCode of defaultShiftCodes) {
    await prisma.shiftCode.upsert({
      where: { code: shiftCode.code },
      update: {
        beginTime: shiftCode.beginTime,
        endTime: shiftCode.endTime,
        category: shiftCode.category,
        hoursLength: shiftCode.hoursLength,
        isActive: true
      },
      create: shiftCode
    });
  }
  
  console.log(`Seeded ${defaultShiftCodes.length} shift codes`);
}

if (require.main === module) {
  seedShiftCodes()
    .then(() => {
      console.log('Shift codes seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding shift codes:', error);
      process.exit(1);
    });
}