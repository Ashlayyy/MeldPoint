import { PrismaClient } from '@prisma/client';
import loggerInstance from '../helpers/loggerInstance';

const inDev = process.env.ENABLE_DEV_DATABASE === 'true';

const prisma = new PrismaClient({
  datasourceUrl: inDev ? (process.env.DATABASE_URL_DEV as string) : (process.env.DATABASE_URL as string)
});

export async function initializePrisma() {
  try {
    await prisma.$connect();
    loggerInstance.info('✅ Database connection established successfully');
  } catch (error) {
    loggerInstance.error(`❌ Database connection failed: ${error}`);
    process.exit(1);
  }

  // Handle disconnection on process termination
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
    loggerInstance.info('Database connection closed');
  });
}

export default prisma;
