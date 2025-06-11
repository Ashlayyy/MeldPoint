import { Request, Response } from 'express';
import { CsrfRequest } from '../../../types/request';
import logger from '../../../helpers/loggerInstance';
import getCSRFToken from '../service/CSRFService';

const getToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const csrfReq = req as CsrfRequest;
    const result = getCSRFToken(csrfReq);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
      logger.error(`CSRF-Controller: ${error.message} - ${error.stack}`);
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
      logger.error('CSRF-Controller: An unknown error occurred');
    }
  }
};

export default getToken;
