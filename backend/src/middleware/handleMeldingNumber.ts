/* eslint-disable consistent-return */
import { Request, Response, NextFunction } from 'express';
import {
  getVolgNummer,
  updateVolgNummer,
  revertVolgNummer,
  getPreventiefVolgNummer,
  updatePreventiefVolgNummer,
  revertPreventiefVolgNummer
} from '../db/queries';
import logger from '../helpers/loggerInstance';

export async function handleMeldingNumber(req: Request, res: Response, next: NextFunction) {
  try {
    const volgNummer = await getVolgNummer();
    req.body.VolgNummer = volgNummer;
    await updateVolgNummer();
    logger.debug(`HandleMeldingNumber-Middleware: VolgNummer set to ${volgNummer}`);

    // Store the original next function
    const originalNext = next;

    // Wrap the next function to catch errors
    const wrappedNext = (error?: Error) => {
      if (error) {
        logger.error('Error occurred after VolgNummer assignment:', error);
        // Revert the VolgNummer if there's an error
        revertVolgNummer()
          .then(() => {
            logger.debug(`HandleMeldingNumber-Middleware: Successfully reverted VolgNummer ${volgNummer}`);
          })
          .catch((revertError) => {
            logger.error('Failed to revert VolgNummer:', revertError);
          })
          .finally(() => {
            originalNext(error);
          });
        return;
      }
      originalNext();
    };

    // Call the wrapped next function
    return wrappedNext();
  } catch (error) {
    logger.error(`Error in handleMeldingNumber middleware: ${error}`);
    const err = error instanceof Error ? error : new Error('Unknown error in handleMeldingNumber middleware');
    return next(err);
  }
}

export async function handlePreventiefMeldingNumber(req: Request, res: Response, next: NextFunction) {
  try {
    const volgNummer = await getPreventiefVolgNummer();
    req.body.VolgNummer = volgNummer;
    await updatePreventiefVolgNummer();
    logger.debug(`HandlePreventiefMeldingNumber-Middleware: VolgNummer set to ${volgNummer}`);

    // Store the original next function
    const originalNext = next;

    // Wrap the next function to catch errors
    const wrappedNext = (error?: Error) => {
      if (error) {
        logger.error('Error occurred after VolgNummer assignment:', error);
        // Revert the VolgNummer if there's an error
        revertPreventiefVolgNummer()
          .then(() => {
            logger.debug(`HandlePreventiefMeldingNumber-Middleware: Successfully reverted VolgNummer ${volgNummer}`);
          })
          .catch((revertError) => {
            logger.error('Failed to revert VolgNummer:', revertError);
          })
          .finally(() => {
            originalNext(error);
          });
        return;
      }
      originalNext();
    };

    // Call the wrapped next function
    return wrappedNext();
  } catch (error) {
    logger.error(`Error in handleMeldingNumber middleware: ${error}`);
    const err = error instanceof Error ? error : new Error('Unknown error in handleMeldingNumber middleware');
    return next(err);
  }
}
