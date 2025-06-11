import { Request, Response } from 'express';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import logger from '../../../helpers/loggerInstance';
import getSystemLogsByMeldingId from '../service/SystemLogService';
import { SystemLogParams } from '../types';

const calculateExecutionTime = (startTime: [number, number]): string => {
  return (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);
};

const getSystemLogHistory = async (req: Request, res: Response): Promise<void> => {
  const startTime = process.hrtime();
  const { meldingId, preventiefId, correctiefId } = req.params;

  if (!meldingId || typeof meldingId !== 'string') {
    logger.error('SystemLog-Controller: Invalid ID format');
    logError(req, {
      action: 'GET_SYSTEM_LOGS',
      resourceType: 'SYSTEM_LOG',
      resourceId: meldingId,
      error: new Error('Invalid ID format'),
      metadata: { validationType: 'ID_FORMAT' }
    });
    res.status(400).json({ error: 'MeldingID must be a valid string' });
    return;
  }

  try {
    const params: SystemLogParams = {
      meldingId,
      preventiefId,
      correctiefId
    };

    const logs = await getSystemLogsByMeldingId(params);
    const executionTime = calculateExecutionTime(startTime);

    logSuccess(req, {
      action: 'GET_SYSTEM_LOGS',
      resourceType: 'SYSTEM_LOG',
      resourceId: meldingId,
      metadata: {
        executionTime: Number(executionTime),
        resultCount: logs?.length || 0,
        requestedAt: new Date().toISOString(),
        preventiefId,
        correctiefId
      }
    });

    if (logs && logs.length > 0) {
      res.status(200).json({ data: logs });
    } else {
      logger.warn('SystemLog-Controller: No logs found for this melding');
      res.status(404).json({ error: 'No logs found for this melding' });
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`SystemLog-Controller: Failed to get system logs - ${err}`);

    logError(req, {
      action: 'GET_SYSTEM_LOGS',
      resourceType: 'SYSTEM_LOG',
      resourceId: meldingId,
      error: err,
      metadata: { preventiefId, correctiefId }
    });

    res.status(500).json({ error: err.message });
  }
};

export default getSystemLogHistory;
