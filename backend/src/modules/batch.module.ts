/* eslint-disable import/prefer-default-export */
import logger from '../helpers/loggerInstance';
import prisma from '../db/prismaClient';

export const batchArchiveItems = async (ids: string[], archived: boolean) => {
  try {
    const updates = await prisma.melding.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        Archived: archived
      }
    });

    logger.debug(`Batch archived ${updates.count} items`);
    return {
      success: true,
      message: `Batch archived ${updates.count} items`,
      count: updates.count
    };
  } catch (error) {
    logger.error(String(error));
    throw error;
  }
};
