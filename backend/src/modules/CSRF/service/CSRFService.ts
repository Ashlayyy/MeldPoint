import { CsrfRequest } from '../../../types/request';
import logger from '../../../helpers/loggerInstance';
import { CSRFResponse } from '../types';

const getCSRFToken = (req: CsrfRequest): CSRFResponse => {
  try {
    const token = req.csrfToken();
    return { token };
  } catch (error) {
    logger.error(`CSRFService: Failed to generate CSRF token - ${error}`);
    throw new Error('Failed to generate CSRF token');
  }
};

export default getCSRFToken;
