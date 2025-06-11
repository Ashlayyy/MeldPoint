/* eslint-disable import/prefer-default-export */
import { Request, Response } from 'express';
import { batchArchiveItems } from '../service/BatchService';
import logger from '../../../helpers/loggerInstance';

export const batchArchive = async (req: Request, res: Response) => {
  try {
    const { ids, archived } = req.body;
    const result = await batchArchiveItems(ids, archived);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Batch-Controller: Failed to process batch archive - ${error}`);
    res.status(500).json({ error: 'Failed to process batch archive' });
  }
};
