import { PrismaClient } from '@prisma/client';
import { diff } from 'deep-diff';
import logger from '../helpers/loggerInstance';

const prisma = new PrismaClient();

export const recordChange = async (
  targetModel: string,
  targetObjectId: string,
  oldVersion: any,
  newVersion: any,
  userId?: string
): Promise<void> => {
  try {
    logger.debug(`Recording version history for ${targetModel} ID ${targetObjectId}`);
    const plainOldVersion = oldVersion ? JSON.parse(JSON.stringify(oldVersion)) : null;
    const plainNewVersion = newVersion ? JSON.parse(JSON.stringify(newVersion)) : null;

    logger.debug(`Plain old version: ${JSON.stringify(plainOldVersion)}`);
    logger.debug(`Plain new version: ${JSON.stringify(plainNewVersion)}`);

    const changes = diff(plainOldVersion, plainNewVersion);

    logger.debug(`Changes: ${JSON.stringify(changes)}`);

    // Don't record if there are no changes
    if (!changes || changes.length === 0) {
      logger.debug(`No changes to record for ${targetModel} ID ${targetObjectId}`);
      return;
    }

    logger.debug(`Creating version history record for ${targetModel} ID ${targetObjectId}`);

    await prisma.versionHistory.create({
      data: {
        targetModel,
        targetObjectId,
        oldVersion: plainOldVersion ?? undefined,
        newVersion: plainNewVersion ?? undefined,
        changes: (changes as any) ?? undefined,
        userId: userId ?? undefined
      }
    });

    logger.debug(`Version history record created for ${targetModel} ID ${targetObjectId}`);
  } catch (error) {
    logger.error(`Failed to record version history for ${targetModel} ID ${targetObjectId}: ${error}`);
  }
};
