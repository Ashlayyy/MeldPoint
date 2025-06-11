/* eslint-disable import/prefer-default-export */
import logger from '../../../helpers/loggerInstance';
import prisma from '../../../db/prismaClient';

export const batchArchiveItems = async (ids: string[], archived: boolean) => {
  try {
    const updates = await Promise.all(
      ids.map(async (id) => {
        return prisma.melding.update({
          where: { id },
          data: { Archived: archived, ...(archived && { ArchivedAt: new Date() }) }
        });
      })
    );

    return {
      success: true,
      message: `Successfully ${archived ? 'archived' : 'unarchived'} ${updates.length} items`,
      updatedItems: updates
    };
  } catch (error) {
    logger.error(`Batch-Service: Failed to process batch archive - ${error}`);
    throw error;
  }
};
