import { createUploadthing, type FileRouter } from 'uploadthing/express';
import logger from '../../../helpers/loggerInstance';

const f = createUploadthing();

export const uploadRouter = {
  videoImgPDF: f({
    image: {
      maxFileSize: '16MB',
      maxFileCount: 100
    },
    pdf: {
      maxFileSize: '16MB',
      maxFileCount: 100
    },
    video: {
      maxFileSize: '64MB',
      maxFileCount: 4
    },
    audio: {
      maxFileSize: '16MB',
      maxFileCount: 100
    },
    blob: {
      maxFileSize: '16MB',
      maxFileCount: 100
    }
  }).onUploadComplete(async ({ metadata, file }) => {
    try {
      logger.info(`UploadThing-Controller: Starting upload process for file: ${file.name}`);
      logger.debug(`UploadThing-Controller: File details - Size: ${file.size}, Type: ${file.type}`);

      if (!file.url) {
        logger.error('UploadThing-Controller: Upload failed - No URL returned');
        throw new Error('Upload failed - No URL returned from storage');
      }

      logger.info(`UploadThing-Controller: Upload completed successfully for file: ${file.name}`);
      logger.debug(`UploadThing-Controller: Upload metadata - ${JSON.stringify(metadata)}`);

      return { uploadedBy: metadata, url: file.url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : '';

      logger.error(`UploadThing-Controller: Upload failed - ${errorMessage}`);
      logger.error(`UploadThing-Controller: Error details - ${errorStack}`);
      logger.error(
        `UploadThing-Controller: Failed file details - Name: ${file.name}, Size: ${file.size}, Type: ${file.type}`
      );

      throw new Error(`Upload failed: ${errorMessage}`);
    }
  })
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
