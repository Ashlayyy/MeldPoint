import { gzip } from 'zlib';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { addDays, startOfDay, subDays, format } from 'date-fns';
import { generateBackupData } from '../db/queries/backup/createBackup';
import logger from '../helpers/loggerInstance';
import { utapi } from '../helpers/uploadthing';
import prisma from '../db/prismaClient';

const gzipAsync = promisify(gzip);

const BACKUP_HOUR = 2; // 2 AM
const LOG_ARCHIVE_DAY = 0; // Sunday
const LOG_ARCHIVE_HOUR = 3; // 3 AM

const LOGS_RETENTION_DAYS = 30; // Keep logs for 30 days
const BACKUP_RETENTION_DAYS = 90; // Keep backups for 90 days

const getNextBackupTime = () => {
  const now = new Date();
  let nextBackup = startOfDay(now);
  nextBackup.setHours(BACKUP_HOUR);

  if (now >= nextBackup) {
    nextBackup = startOfDay(addDays(now, 1));
    nextBackup.setHours(BACKUP_HOUR);
  }

  return nextBackup;
};

const getNextLogArchiveTime = () => {
  const now = new Date();
  let nextArchive = startOfDay(now);
  nextArchive.setHours(LOG_ARCHIVE_HOUR);

  // Move to next Sunday if not already Sunday
  while (nextArchive.getDay() !== LOG_ARCHIVE_DAY || (nextArchive.getDay() === LOG_ARCHIVE_DAY && now >= nextArchive)) {
    nextArchive = startOfDay(addDays(nextArchive, 1));
    nextArchive.setHours(LOG_ARCHIVE_HOUR);
  }

  return nextArchive;
};

const cleanupOldBackups = async () => {
  try {
    const cutoffDate = subDays(new Date(), BACKUP_RETENTION_DAYS);

    // Get old backups
    const oldBackups = await prisma.backup.findMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    // Delete each backup from uploadthing and database
    await Promise.all(
      oldBackups.map(async (backup) => {
        try {
          // Delete from uploadthing
          await utapi.deleteFiles(backup.fileKey);
          // Delete from database
          await prisma.backup.delete({
            where: { id: backup.id }
          });
          logger.info(`Deleted old backup: ${backup.fileName}`);
        } catch (error) {
          logger.error(`Failed to delete backup ${backup.fileName}: ${error}`);
        }
      })
    );

    logger.info(`Cleaned up ${oldBackups.length} old backups`);
  } catch (error) {
    logger.error(`Error cleaning up old backups: ${error}`);
  }
};

export const createAutomaticBackup = async () => {
  const startTime = Date.now();
  logger.info('[Backup Debug] Starting automatic backup process');

  try {
    // Generate backup data
    logger.info('[Backup Debug] Step 1: Generating backup data');
    const backupData = await generateBackupData();
    logger.info('[Backup Debug] Step 1 Complete: Generated backup data');

    const jsonString = JSON.stringify(backupData);
    const base64Data = Buffer.from(jsonString).toString('base64');
    logger.info(`[Backup Debug] Step 2: Compressed data size: ${base64Data.length} bytes`);
    const compressed = await gzipAsync(Buffer.from(base64Data));
    logger.info('[Backup Debug] Step 2 Complete: Data compressed');

    // Upload to UploadThing
    logger.info('[Backup Debug] Step 3: Starting upload to UploadThing');
    const fileName = `backup_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.gz`;
    logger.info(`[Backup Debug] Uploading file: ${fileName}`);

    const uploadResponse = await utapi.uploadFiles([new File([compressed], fileName)], {
      contentDisposition: 'attachment'
    });
    logger.info(`[Backup Debug] Upload response received: ${JSON.stringify(uploadResponse)}`);

    const fileKey = uploadResponse[0]?.data?.key;
    if (!fileKey) {
      throw new Error('Failed to upload backup to UploadThing');
    }
    logger.info(`[Backup Debug] Step 3 Complete: File uploaded with key ${fileKey}`);

    // Create backup record
    logger.info('[Backup Debug] Step 4: Creating database entry');
    await prisma.backup.create({
      data: {
        fileName,
        fileKey,
        size: compressed.length,
        createdBy: 'SYSTEM'
      }
    });
    logger.info('[Backup Debug] Step 4 Complete: Database entry created');

    const totalTime = Date.now() - startTime;
    logger.info(`[Backup Debug] Automatic backup completed successfully in ${totalTime}ms`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`[Backup Debug] Automatic backup failed after ${Date.now() - startTime}ms:`, err);
    throw err;
  }
};

const archiveOldLogs = async () => {
  const cutoffDate = subDays(new Date(), LOGS_RETENTION_DAYS);

  try {
    // Archive and delete old system logs
    const oldSystemLogs = await prisma.systemLog.findMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    if (oldSystemLogs.length > 0) {
      const archiveDir = path.join(process.cwd(), 'archives', 'logs', 'system');
      await fs.mkdir(archiveDir, { recursive: true });

      const archiveFileName = `system_logs_${format(new Date(), 'yyyy-MM-dd')}.json`;
      await fs.writeFile(path.join(archiveDir, archiveFileName), JSON.stringify(oldSystemLogs, null, 2));

      await prisma.systemLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      logger.info(`Archived ${oldSystemLogs.length} system logs`);
    }

    // Archive and delete old permission logs
    const oldPermissionLogs = await prisma.permissionLog.findMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    if (oldPermissionLogs.length > 0) {
      const archiveDir = path.join(process.cwd(), 'archives', 'logs', 'permissions');
      await fs.mkdir(archiveDir, { recursive: true });

      const archiveFileName = `permission_logs_${format(new Date(), 'yyyy-MM-dd')}.json`;
      await fs.writeFile(path.join(archiveDir, archiveFileName), JSON.stringify(oldPermissionLogs, null, 2));

      await prisma.permissionLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      logger.info(`Archived ${oldPermissionLogs.length} permission logs`);
    }

    // Archive and delete old user activity logs
    const oldUserActivities = await prisma.userActivity.findMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    if (oldUserActivities.length > 0) {
      const archiveDir = path.join(process.cwd(), 'archives', 'logs', 'activity');
      await fs.mkdir(archiveDir, { recursive: true });

      const archiveFileName = `user_activity_${format(new Date(), 'yyyy-MM-dd')}.json`;
      await fs.writeFile(path.join(archiveDir, archiveFileName), JSON.stringify(oldUserActivities, null, 2));

      await prisma.userActivity.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      logger.info(`Archived ${oldUserActivities.length} user activities`);
    }
  } catch (error) {
    logger.error(`Error archiving logs: ${error}`);
  }
};

const startBackupScheduler = () => {
  let nextBackupTime = getNextBackupTime();
  let nextArchiveTime = getNextLogArchiveTime();

  // Schedule next backup
  const scheduleNextBackup = () => {
    const now = new Date();
    const timeUntilBackup = nextBackupTime.getTime() - now.getTime();

    setTimeout(async () => {
      try {
        logger.info('Starting scheduled database backup...');
        await createAutomaticBackup();
        await cleanupOldBackups();
        logger.info('Scheduled database backup and cleanup completed successfully');
      } catch (error) {
        logger.error(`Error during scheduled backup: ${error}`);
      }

      nextBackupTime = getNextBackupTime();
      scheduleNextBackup();
    }, timeUntilBackup);
  };

  // Schedule next log archive
  const scheduleNextArchive = () => {
    const now = new Date();
    const timeUntilArchive = nextArchiveTime.getTime() - now.getTime();

    setTimeout(async () => {
      try {
        logger.info('Starting scheduled log archiving...');
        await archiveOldLogs();
        logger.info('Scheduled log archiving completed successfully');
      } catch (error) {
        logger.error(`Error during scheduled log archiving: ${error}`);
      }

      nextArchiveTime = getNextLogArchiveTime();
      scheduleNextArchive();
    }, timeUntilArchive);
  };

  // Start both schedulers
  scheduleNextBackup();
  scheduleNextArchive();

  logger.info(`Backup scheduler started. Next backup at: ${nextBackupTime}`);
  logger.info(`Log archive scheduler started. Next archive at: ${nextArchiveTime}`);
};

export default startBackupScheduler;
