import { PrismaClient, Language } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed (users only)...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      phoneNumber: '+1234567890',
      emailNotifications: true,
      smsNotifications: false,
    },
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      language: Language.EN,
      badgeNumber: '0001',
      mustChangePassword: false,
      phoneNumber: '+1234567890',
      emailNotifications: true,
      smsNotifications: false,
    },
  });
  console.log('Created admin user: admin@example.com');

  // Create supervisor
  const supervisorPassword = await bcrypt.hash('supervisor123', 12);
  const supervisorUser = await prisma.user.upsert({
    where: { email: 'supervisor@example.com' },
    update: {
      phoneNumber: '+1234567891',
      emailNotifications: true,
      smsNotifications: true,
    },
    create: {
      email: 'supervisor@example.com',
      password: supervisorPassword,
      firstName: 'Traffic',
      lastName: 'Supervisor',
      role: 'SUPERVISOR',
      language: Language.EN,
      badgeNumber: '1001',
      mustChangePassword: false,
      phoneNumber: '+1234567891',
      emailNotifications: true,
      smsNotifications: true,
    },
  });
  console.log('Created supervisor user: supervisor@example.com');

  // Create officer users
  const officers = [
    {
      email: 'officer1@example.com',
      firstName: 'John',
      lastName: 'Doe',
      badgeNumber: '2001',
      language: Language.EN,
      phoneNumber: '+1234567892',
      emailNotifications: true,
      smsNotifications: false,
    },
    {
      email: 'officer2@example.com',
      firstName: 'Marie',
      lastName: 'Dubois',
      badgeNumber: '2002',
      language: Language.FR,
      phoneNumber: '+1234567893',
      emailNotifications: true,
      smsNotifications: true,
    },
    {
      email: 'officer3@example.com',
      firstName: 'Sarah',
      lastName: 'Smith',
      badgeNumber: '2003',
      language: Language.EN,
      phoneNumber: '+1234567894',
      emailNotifications: false,
      smsNotifications: true,
    },
  ];

  const officerPassword = await bcrypt.hash('officer123', 12);
  const createdOfficers = [];
  
  for (const officer of officers) {
    const user = await prisma.user.upsert({
      where: { email: officer.email },
      update: {},
      create: {
        ...officer,
        password: officerPassword,
        role: 'OFFICER',
        mustChangePassword: false,
      },
    });
    createdOfficers.push(user);
    console.log(`Created officer: ${user.email}`);
  }

  console.log('Database seeded successfully! (Users only)');
  console.log('');
  console.log('Login credentials:');
  console.log('Admin: admin@example.com / admin123');
  console.log('Supervisor: supervisor@example.com / supervisor123');
  console.log('Officers: officer1@example.com, officer2@example.com, officer3@example.com / officer123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });