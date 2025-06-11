/* eslint-disable import/prefer-default-export */
import type { Request, Response, RequestHandler } from 'express';
import { handleScreenshotUpload, validateFileType } from '../service/ScreenshotService';
import { ScreenshotUploadSchema } from '../validation/schemas';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import logger from '../../../utils/logger';

export const UploadScreenshot: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const startTime = process.hrtime();

  try {
    logger.info('Screenshot-Controller: Processing screenshot upload');

    if (!req.file) {
      logger.warn('Screenshot-Controller: No file provided in upload request');
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    const validationResult = ScreenshotUploadSchema.safeParse({
      file: req.file
    });

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid file upload',
        errors: validationResult.error.errors
      });
      return;
    }

    if (!validateFileType(req.file.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PNG, JPEG, and WebP images are allowed.'
      });
      return;
    }

    const result = await handleScreenshotUpload(req.file);
    const executionTime = Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2));

    logSuccess(req, {
      action: 'CREATE_SCREENSHOT',
      resourceType: 'SCREENSHOT',
      resourceId: result.url,
      previousState: null,
      newState: { url: result.url },
      changedFields: ['url'],
      metadata: {
        executionTime,
        ...result.metadata,
        requestBody: { fileSize: req.file.size, mimeType: req.file.mimetype }
      }
    });

    logger.info(`Screenshot-Controller: Successfully uploaded screenshot to ${result.url}`);
    res.status(200).json({
      success: true,
      data: {
        url: result.url
      }
    });
  } catch (error) {
    const executionTime = Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2));
    logger.error(`Screenshot-Controller: Failed to upload screenshot - ${error}`);

    logError(req, {
      action: 'CREATE_SCREENSHOT',
      resourceType: 'SCREENSHOT',
      error: error instanceof Error ? error : new Error('Unknown error'),
      metadata: {
        executionTime,
        uploadProvider: 'uploadthing'
      }
    });

    res.status(500).json({
      success: false,
      message: 'Failed to upload screenshot'
    });
  }
};
