import { UTApi } from 'uploadthing/server';
import logger from './loggerInstance';

export const utapi = new UTApi();

export const deleteFile = async (fileID: string) => {
  if (!fileID) {
    throw new Error('Invalid file URL');
  }
  await utapi.deleteFiles(fileID);
  logger.debug(`UploadThing-Helper: File deleted: ${fileID}`);
};

export const uploadFile = async (file: Express.Multer.File) => {
  try {
    // Create a Blob from the buffer with the correct mime type
    const blob = new Blob([file.buffer], { type: file.mimetype });

    // Create a File object from the Blob
    const fileData = new File([blob], file.originalname || 'screenshot.png', {
      type: file.mimetype
    });

    const result = await utapi.uploadFiles([fileData]);
    logger.debug(`UploadThing-Helper: File uploaded`);
    return {
      data: result[0]
    };
  } catch (e) {
    logger.error(`UploadThing-Helper: Upload error: ${e}`);
    return {
      error: e instanceof Error ? e : new Error('Unknown upload error')
    };
  }
};
