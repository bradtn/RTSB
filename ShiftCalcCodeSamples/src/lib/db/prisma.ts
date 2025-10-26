import { PrismaClient } from '@prisma/client';

// For debugging purposes
console.log('DATABASE_URL from env:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));

// Configure Prisma client options
const prismaClientOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
};

// Create a global singleton to avoid too many connections in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Initialize Prisma client with explicit configuration
export const prisma = globalForPrisma.prisma || new PrismaClient(prismaClientOptions);

// Keep the same instance for development hot reloading
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;