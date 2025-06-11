/* eslint-disable consistent-return */
/* eslint-disable no-nested-ternary */
import { Response, RequestHandler } from 'express';
import { ResourceType } from '@prisma/client';
import logger from '../../../helpers/loggerInstance';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import handleError from '../../../utils/errorHandler';
import {
  createBackup,
  uploadBackup,
  downloadBackup,
  listBackups,
  restoreBackup,
  deleteBackup
} from '../service/BackupService';
import { BackupIdParams, BackupProgress } from '../validation/schemas';

const BACKUP_TIMEOUT = 120 * 60 * 1000;

const writeProgress = (res: Response, update: BackupProgress): void => {
  res.write(`data: ${JSON.stringify(update)}\n\n`);
  // Force flush the response
  if (res.flush) {
    res.flush();
  }
};

export const CreateBackup: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const requestId = Math.random().toString(36).substring(7);
  logger.info(`[Backup Debug][${requestId}] Received backup creation request from user ${req.user?.id}`);

  try {
    // Set timeout for the request
    req.setTimeout(BACKUP_TIMEOUT);
    res.setTimeout(BACKUP_TIMEOUT);
    logger.info(`[Backup Debug][${requestId}] Set request timeout to ${BACKUP_TIMEOUT}ms`);

    // Set proper SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });
    logger.info(`[Backup Debug][${requestId}] Set SSE headers`);

    // Disable any response buffering
    res.flushHeaders();
    logger.info(`[Backup Debug][${requestId}] Flushed headers`);

    // Send initial progress
    writeProgress(res, { status: 'started', progress: 0 });
    logger.info(`[Backup Debug][${requestId}] Sent initial progress`);

    const result = await createBackup(req.user?.id || 'system', (progress: number) => {
      const progressUpdate: BackupProgress = {
        status: 'in_progress',
        progress,
        message:
          progress < 70
            ? 'Generating backup data'
            : progress < 80
              ? 'Compressing data'
              : progress < 90
                ? 'Uploading backup'
                : progress < 100
                  ? 'Creating database entry'
                  : 'Completing backup'
      };
      writeProgress(res, progressUpdate);
      logger.info(`[Backup Debug][${requestId}] Progress update: ${JSON.stringify(progressUpdate)}`);
    });
    logger.info(`[Backup Debug][${requestId}] Backup creation completed with result: ${JSON.stringify(result)}`);

    // Send final response
    writeProgress(res, {
      status: 'completed',
      progress: 100,
      backup: result
    });
    logger.info(`[Backup Debug][${requestId}] Sent completion message`);

    logSuccess(req, {
      action: 'CREATE_BACKUP',
      resourceType: ResourceType.MELDING,
      resourceId: result.id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        backupSize: result.size,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0',
        requestId
      }
    });
    logger.info(`[Backup Debug][${requestId}] Logged success`);

    res.end();
    logger.info(`[Backup Debug][${requestId}] Request completed successfully`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`[Backup Debug][${requestId}] Backup creation failed - ${err.message}`, err);

    logError(req, {
      action: 'CREATE_BACKUP',
      resourceType: ResourceType.MELDING,
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0',
        requestId
      }
    });
    logger.info(`[Backup Debug][${requestId}] Logged error`);

    writeProgress(res, {
      status: 'error',
      progress: 0,
      error: err.message
    });
    logger.info(`[Backup Debug][${requestId}] Sent error message to client`);

    res.end();
    logger.info(`[Backup Debug][${requestId}] Request completed with error`);
  }
};

export const UploadBackup: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const result = await uploadBackup(req.user?.id || 'system', req.file);

    logSuccess(req, {
      action: 'UPLOAD_BACKUP',
      resourceType: ResourceType.MELDING,
      resourceId: result.id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        fileName: result.fileName,
        fileSize: result.size,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ data: result });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Backup-Controller: Upload failed - ${err}`);

    logError(req, {
      action: 'UPLOAD_BACKUP',
      resourceType: ResourceType.MELDING,
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

export const DownloadBackup: RequestHandler<BackupIdParams> = async (req, res) => {
  const startTime = process.hrtime();
  const { backupId } = req.params;

  try {
    const { data, fileName } = await downloadBackup(backupId);

    logSuccess(req, {
      action: 'DOWNLOAD_BACKUP',
      resourceType: ResourceType.MELDING,
      resourceId: backupId,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        fileName,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).send(`${JSON.stringify(data)}`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Backup-Controller: Download failed - ${err}`);

    logError(req, {
      action: 'DOWNLOAD_BACKUP',
      resourceType: ResourceType.MELDING,
      resourceId: backupId,
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

export const ListBackups: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const result = await listBackups();

    logSuccess(req, {
      action: 'LIST_BACKUPS',
      resourceType: ResourceType.MELDING,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        resultCount: result?.length || 0,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ data: result });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Backup-Controller: List failed - ${err}`);

    logError(req, {
      action: 'LIST_BACKUPS',
      resourceType: ResourceType.MELDING,
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

export const RestoreBackup: RequestHandler<BackupIdParams> = async (req, res) => {
  const startTime = process.hrtime();
  const { backupId } = req.params;

  try {
    // Set timeout for the restore operation
    req.setTimeout(BACKUP_TIMEOUT);
    res.setTimeout(BACKUP_TIMEOUT);

    // Set proper SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // Disable any response buffering
    res.flushHeaders();

    // Send initial progress
    writeProgress(res, { status: 'started', progress: 0 });

    const result = await restoreBackup(backupId, (progress) => {
      writeProgress(res, {
        status: 'in_progress',
        progress,
        message:
          progress < 30
            ? 'Downloading backup'
            : progress < 50
              ? 'Verifying backup integrity'
              : progress < 70
                ? 'Preparing for restore'
                : progress < 90
                  ? 'Restoring data'
                  : 'Finalizing restore'
      });
    });

    // Send final response
    writeProgress(res, {
      status: 'completed',
      progress: 100,
      backup: result
    });

    logSuccess(req, {
      action: 'RESTORE_BACKUP',
      resourceType: ResourceType.MELDING,
      resourceId: backupId,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.end();
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Backup-Controller: Restore failed - ${err}`);

    logError(req, {
      action: 'RESTORE_BACKUP',
      resourceType: ResourceType.MELDING,
      resourceId: backupId,
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    writeProgress(res, {
      status: 'error',
      progress: 0,
      error: err.message
    });
    res.end();
  }
};

export const DeleteBackup: RequestHandler<BackupIdParams> = async (req, res) => {
  const startTime = process.hrtime();
  const { backupId } = req.params;

  try {
    await deleteBackup(backupId);

    logSuccess(req, {
      action: 'DELETE_BACKUP',
      resourceType: ResourceType.MELDING,
      resourceId: backupId,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ message: 'Backup deleted successfully' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Backup-Controller: Delete failed - ${err}`);

    logError(req, {
      action: 'DELETE_BACKUP',
      resourceType: ResourceType.MELDING,
      resourceId: backupId,
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};
