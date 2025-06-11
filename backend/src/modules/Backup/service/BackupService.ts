import { gunzip, gzip } from 'zlib';
import { promisify } from 'util';
import { generateBackupData } from '../../../db/queries/backup/createBackup';
import {
  createBackupEntry,
  getBackups,
  getBackupById,
  restoreBackup as restoreBackupQuery,
  deleteBackup as deleteBackupQuery
} from '../../../db/queries';
import { utapi } from '../../../helpers/uploadthing';
import logger from '../../../helpers/loggerInstance';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

const BACKUP_TIMEOUT = 60 * 60 * 1000;

interface ProgressCallback {
  (progress: number): void;
}

export interface BackupData {
  id: string;
  fileName: string;
  size?: number;
  createdAt: Date;
  fileKey?: string;
  createdBy?: string;
}

export const createBackup = async (userId: string, onProgress: ProgressCallback): Promise<BackupData> => {
  const startTime = Date.now();
  logger.info(`[Backup Debug] Starting backup creation for user ${userId}`);

  try {
    logger.info('[Backup Debug] Step 1: Generating backup data');
    const backupData = await generateBackupData((progress) => {
      onProgress(progress);
      logger.info(`[Backup Debug] Data generation progress: ${progress}%`);
    });
    logger.info(`[Backup Debug] Step 1 Complete - Data generation took ${Date.now() - startTime}ms`);

    logger.info('[Backup Debug] Step 2: Starting compression');
    onProgress(70);
    const jsonString = JSON.stringify(backupData);
    const base64Data = Buffer.from(jsonString).toString('base64');
    logger.info(`[Backup Debug] Base64 data size: ${base64Data.length} bytes`);

    const compressed = await gzipAsync(Buffer.from(base64Data));
    logger.info(`[Backup Debug] Step 2 Complete - Compressed size: ${compressed.length} bytes`);

    logger.info('[Backup Debug] Step 3: Starting upload to UploadThing');
    onProgress(80);
    const fileName = `backup_${new Date().toISOString()}.gz`;
    logger.info(`[Backup Debug] Uploading file: ${fileName}`);

    const uploadResponse = await utapi.uploadFiles([new File([compressed], fileName)], {
      contentDisposition: 'attachment'
    });
    logger.info(`[Backup Debug] Upload response received: ${JSON.stringify(uploadResponse)}`);

    onProgress(90);
    const fileKey = uploadResponse[0]?.data?.key;
    if (!fileKey) {
      const error = new Error('Failed to upload file to UploadThing - No file key received');
      logger.error(`[Backup Debug] ${error.message} ${uploadResponse}`);
      throw error;
    }
    logger.info(`[Backup Debug] Step 3 Complete - File uploaded with key: ${fileKey}`);

    logger.info('[Backup Debug] Step 4: Creating database entry');
    const backup = await createBackupEntry({
      fileName,
      fileKey,
      size: compressed.length,
      createdBy: userId || 'system'
    });
    logger.info(`[Backup Debug] Step 4 Complete - Database entry created with ID: ${backup.id}`);

    onProgress(100);
    const totalTime = Date.now() - startTime;
    logger.info(`[Backup Debug] Backup creation completed successfully in ${totalTime}ms`);

    return {
      id: backup.id,
      fileName: backup.fileName,
      size: backup.size,
      createdAt: backup.createdAt,
      fileKey: backup.fileKey,
      createdBy: backup.createdBy
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`[Backup Debug] Backup creation failed after ${Date.now() - startTime}ms`, err);
    throw err;
  }
};

export const uploadBackup = async (userId: string, file: Express.Multer.File): Promise<BackupData> => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Parse and validate the JSON first
    const jsonData = JSON.parse(file.buffer.toString());
    const jsonString = JSON.stringify(jsonData);
    const base64Data = Buffer.from(jsonString).toString('base64');
    const compressed = await gzipAsync(Buffer.from(base64Data));

    const uploadResponse = await utapi.uploadFiles([
      new File([compressed], `backup_${new Date().toISOString()}.gz`, {
        type: 'application/gzip'
      })
    ]);

    const fileKey = uploadResponse[0]?.data?.key;
    if (!fileKey) {
      throw new Error('Failed to upload file to UploadThing');
    }

    const backup = await createBackupEntry({
      fileName: file.originalname.replace('.json', '.gz'),
      fileKey,
      size: compressed.length,
      createdBy: userId || 'system'
    });

    return {
      id: backup.id,
      fileName: backup.fileName,
      size: backup.size,
      createdAt: backup.createdAt,
      fileKey: backup.fileKey,
      createdBy: backup.createdBy
    };
  } catch (error) {
    logger.error(`Backup-Service: Upload failed - ${error}`);
    throw error;
  }
};

export const downloadBackup = async (backupId: string): Promise<{ data: any; fileName: string }> => {
  try {
    const backup = await getBackupById(backupId);
    if (!backup || !backupId) {
      throw new Error('Backup not found');
    }

    const url = `https://utfs.io/f/${backup.fileKey}`;
    const response = await fetch(url);
    const compressedBuffer = await response.arrayBuffer();
    const decompressed = await gunzipAsync(Buffer.from(compressedBuffer));
    const jsonString = Buffer.from(decompressed.toString(), 'base64').toString();
    const jsonData = JSON.parse(jsonString);

    return {
      data: jsonData,
      fileName: backup.fileName.replace('.gz', '.json')
    };
  } catch (error) {
    logger.error(`Backup-Service: Download failed - ${error}`);
    throw error;
  }
};

export const listBackups = async (): Promise<BackupData[]> => {
  try {
    const backups = await getBackups();
    logger.info(`Backup-Service: List backups - ${backups}`);
    if (!backups || backups.length === 0) {
      return [];
    }

    return backups.map((b) => ({
      id: b.id,
      fileName: b.fileName,
      size: b.size,
      createdAt: b.createdAt,
      createdBy: b.createdBy
    }));
  } catch (error) {
    logger.error(`Backup-Service: List failed - ${error}`);
    throw error;
  }
};

export const restoreBackup = async (backupId: string, onProgress: (progress: number) => void): Promise<BackupData> => {
  try {
    onProgress(10); // Starting restore
    const backup = await getBackupById(backupId);
    if (!backup || !backupId) {
      throw new Error('Backup not found');
    }

    onProgress(20); // Downloading backup
    const url = `https://utfs.io/f/${backup.fileKey}`;
    const response = await fetch(url);
    const compressedBuffer = await response.arrayBuffer();

    onProgress(40); // Decompressing
    const decompressed = await gunzipAsync(Buffer.from(compressedBuffer));
    const jsonString = Buffer.from(decompressed.toString(), 'base64').toString();
    const backupData = JSON.parse(jsonString);

    onProgress(60); // Starting database restore
    await restoreBackupQuery(backupData, (progress: number) => {
      onProgress(60 + progress * 0.4);
    });

    onProgress(100); // Complete
    return {
      id: backup.id,
      fileName: backup.fileName,
      createdAt: backup.createdAt,
      createdBy: backup.createdBy
    };
  } catch (error) {
    logger.error(`Backup-Service: Restore failed - ${error}`);
    throw error;
  }
};

export const deleteBackup = async (backupId: string): Promise<void> => {
  try {
    const backup = await getBackupById(backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }

    // Delete the file from UploadThing if it exists
    if (backup.fileKey) {
      try {
        await utapi.deleteFiles([backup.fileKey]);
      } catch (uploadThingError) {
        // Log but don't fail if file deletion fails (file might already be gone)
        logger.warn(`Failed to delete file from UploadThing: ${uploadThingError}`);
      }
    }

    // Delete the database entry
    await deleteBackupQuery(backupId);
  } catch (error) {
    logger.error(`Backup-Service: Delete failed - ${error}`);
    throw error;
  }
};
