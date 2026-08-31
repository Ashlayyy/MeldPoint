import { PrismaClient } from '@prisma/client';
import loggerInstance from '../helpers/loggerInstance';
import { getMongoUrl } from '../config/loadEnv';

const prisma = new PrismaClient({
  datasourceUrl: getMongoUrl()
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
