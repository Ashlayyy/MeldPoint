import type { Request } from 'express';
import { uploadFile } from '../../../helpers/uploadthing';
import type { ScreenshotUploadResult } from '../types';
import logger from '../../../utils/logger';

export async function handleScreenshotUpload(file: NonNullable<Request['file']>): Promise<ScreenshotUploadResult> {
  logger.info(`ScreenshotService: Uploading screenshot (${file.size} bytes)`);

  const result = await uploadFile(file);
  if (!result.data?.data?.url) {
    logger.error('ScreenshotService: Upload failed - no URL returned');
    throw new Error('Failed to upload screenshot');
  }

  const { url } = result.data.data;

  return {
    url,
    metadata: {
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadProvider: 'uploadthing'
    }
  };
}

export function validateFileType(mimetype: string): boolean {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  return allowedTypes.includes(mimetype);
}
