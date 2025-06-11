import logger from '../helpers/loggerInstance';
import NotificationChannel from '../services/socket/channels/NotificationChannel';
import prisma from '../db/prismaClient';

// TODO: Implement this
// Deze functie zou 1 mail per week sturen, op maandag half 8 inde ochtend. Hierdoor hebben ze helder wat aankomende week nog moet gebeuren.
// Ook kan ik deze email verlopen meldingen nogmaals benoemen, zodat die hopelijk ook sneller weer worden opgelost.

const checkAndSendEmails = async (notificationChannel: NotificationChannel) => {
  const startTime = Date.now();
  logger.info('[Email Debug] Starting email notifications check');

  try {
    logger.info('[Email Debug] Step 1: Fetching users with pending notifications');
    const users = await prisma.user.findMany({
      // ... existing query ...
    });
    logger.info(`[Email Debug] Found ${users.length} users with pending notifications`);

    logger.info('[Email Debug] Step 2: Processing user notifications');
    for (const user of users) {
      try {
        logger.info(`[Email Debug] Processing notifications for user: ${user.id}`);
        // ... existing email sending logic ...
        logger.info(`[Email Debug] Successfully sent notifications to user: ${user.id}`);
      } catch (error: any) {
        logger.error(`[Email Debug] Failed to process notifications for user ${user.id}:`, error);
      }
    }

    const totalTime = Date.now() - startTime;
    logger.info(`[Email Debug] Email notifications check completed successfully in ${totalTime}ms`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`[Email Debug] Email notifications check failed after ${Date.now() - startTime}ms:`, err);
    throw err;
  }
};

export default checkAndSendEmails;
