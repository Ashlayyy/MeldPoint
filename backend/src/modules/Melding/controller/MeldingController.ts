/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/return-await */
import { RequestHandler } from 'express';
import { logSuccess, logError, logStateChange } from '../../../middleware/handleHistory';
import handleError from '../../../utils/errorHandler';
import logger from '../../../utils/logger';
import {
  getLengthsService,
  getAllReportsService,
  getSingleReportService,
  createReportService,
  updateReportService,
  addCloneIdService,
  removeCloneIdService,
  addCorrespondenceIdService,
  removeCorrespondenceIdService,
  setCorrespondenceIdsService,
  findReportByPreventiefIdService,
  getSingleReportByVolgnummerService
} from '../service/MeldingService';
import { handleCorrectiefTaskCreationReportSide } from '../../../utils/handleCorrectiefTasks';
import { recordChange } from '../../../services/versionHistory.service';

export const GetLengths: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    logger.info('Melding-Controller: Fetching melding lengths');
    const result = await getLengthsService();

    logSuccess(req, {
      action: 'GET_MELDING_LENGTHS',
      resourceType: 'MELDING',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info('Melding-Controller: Successfully retrieved melding lengths');
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_MELDING_LENGTHS',
        resourceType: 'MELDING',
        error
      });
    }
    logger.error('Failed to get melding lengths:', error);
    handleError(error, res);
  }
};

export const GetAllReports: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    logger.info('Melding-Controller: Fetching all reports');
    const result = await getAllReportsService(req.query);

    logSuccess(req, {
      action: 'GET_ALL_REPORTS',
      resourceType: 'MELDING',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        filters: req.query,
        count: result.length
      }
    });

    logger.info('Melding-Controller: Successfully retrieved all reports');
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_ALL_REPORTS',
        resourceType: 'MELDING',
        error,
        metadata: {
          filters: req.query
        }
      });
    }
    logger.error('Failed to get all reports:', error);
    handleError(error, res);
  }
};

export const GetSingleReport: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { id } = req.params;

  try {
    logger.info(`Melding-Controller: Fetching report ${id}`);
    const result = await getSingleReportService(id);

    logSuccess(req, {
      action: 'GET_SINGLE_REPORT',
      resourceType: 'MELDING',
      resourceId: id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info(`Melding-Controller: Successfully retrieved report ${id}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_SINGLE_REPORT',
        resourceType: 'MELDING',
        resourceId: id,
        error
      });
    }
    logger.error(`Failed to get report ${id}:`, error);
    handleError(error, res);
  }
};

export const GetSingleReportByVolgnummer: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { volgnummer } = req.params;

  try {
    logger.info(`Melding-Controller: Fetching report ${volgnummer}`);
    const result = await getSingleReportByVolgnummerService(volgnummer);

    logSuccess(req, {
      action: 'GET_SINGLE_REPORT_BY_VOLGNUMMER',
      resourceType: 'MELDING',
      resourceId: volgnummer,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info(`Melding-Controller: Successfully retrieved report ${volgnummer}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_SINGLE_REPORT_BY_VOLGNUMMER',
        resourceType: 'MELDING',
        resourceId: volgnummer,
        error
      });
    }
    logger.error(`Failed to get report ${volgnummer}:`, error);
    handleError(error, res);
  }
};

export const CreateReport: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    logger.info('Melding-Controller: Creating new report');
    if (!req.user) {
      throw new Error('User is not authenticated');
    }
    const result = await createReportService(req.body, req.user.id);

    console.log('data melding, correctief, preventief: body', req.body);

    logSuccess(req, {
      action: 'CREATE_REPORT',
      resourceType: 'MELDING',
      resourceId: result.id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        meldingNumber: result.VolgNummer
      }
    });

    logger.info(`Melding-Controller: Successfully created report ${result.id}`);

    handleCorrectiefTaskCreationReportSide(result);
    res.status(201).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'CREATE_REPORT',
        resourceType: 'MELDING',
        error,
        metadata: {
          data: req.body
        }
      });
    }
    logger.error('Failed to create report:', error);
    handleError(error, res);
  }
};

export const UpdateReport: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { id } = req.params;

  try {
    logger.info(`Melding-Controller: Updating report ${id}`);
    const previousState = await getSingleReportService(id);
    const result = await updateReportService(id, req.body);
    logger.debug(`Melding-Controller: Calling Version History Service for melding ${id}`);
    const userId = req.user?.id;
    recordChange('Melding', id, previousState, result, userId)
      .then(() => {
        logger.debug(`Melding-Controller: Version History Service for melding ${id} completed`);
      })
      .catch((error) => {
        logger.error(`Melding-Controller: Version History Service for melding ${id} failed:`, error);
      });

    logStateChange(req, {
      action: 'UPDATE_REPORT',
      resourceType: 'MELDING',
      resourceId: id,
      previousState,
      newState: result,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2))
      }
    });

    logger.info(`Melding-Controller: Successfully updated report ${id}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'UPDATE_REPORT',
        resourceType: 'MELDING',
        resourceId: id,
        error
      });
    }
    logger.error(`Failed to update report ${id}:`, error);
    handleError(error, res);
  }
};

export const AddCloneID: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { meldingID, cloneID } = req.params;

  try {
    logger.info(`Melding-Controller: Adding clone ID ${cloneID} to report ${meldingID}`);
    const result = await addCloneIdService(meldingID, cloneID);

    logSuccess(req, {
      action: 'ADD_CLONE_ID',
      resourceType: 'MELDING',
      resourceId: meldingID,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        cloneID
      }
    });

    logger.info(`Melding-Controller: Successfully added clone ID to report ${meldingID}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'ADD_CLONE_ID',
        resourceType: 'MELDING',
        resourceId: meldingID,
        error,
        metadata: {
          cloneID
        }
      });
    }
    logger.error(`Failed to add clone ID to report ${meldingID}:`, error);
    handleError(error, res);
  }
};

export const RemoveCloneID: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { meldingID, cloneID } = req.params;

  try {
    logger.info(`Melding-Controller: Removing clone ID ${cloneID} from report ${meldingID}`);
    const result = await removeCloneIdService(meldingID, cloneID);

    logSuccess(req, {
      action: 'REMOVE_CLONE_ID',
      resourceType: 'MELDING',
      resourceId: meldingID,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        cloneID
      }
    });

    logger.info(`Melding-Controller: Successfully removed clone ID from report ${meldingID}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'REMOVE_CLONE_ID',
        resourceType: 'MELDING',
        resourceId: meldingID,
        error,
        metadata: {
          cloneID
        }
      });
    }
    logger.error(`Failed to remove clone ID from report ${meldingID}:`, error);
    handleError(error, res);
  }
};

export const AddCorrespondenceID: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { meldingID } = req.params;
  const { correspondence } = req.body;

  try {
    logger.info(`Melding-Controller: Adding correspondence ID ${correspondence} to report ${meldingID}`);
    const result = await addCorrespondenceIdService(meldingID, correspondence);

    logSuccess(req, {
      action: 'ADD_CORRESPONDENCE_ID',
      resourceType: 'MELDING',
      resourceId: meldingID,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        correspondence
      }
    });

    logger.info(`Melding-Controller: Successfully added correspondence ID to report ${meldingID}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'ADD_CORRESPONDENCE_ID',
        resourceType: 'MELDING',
        resourceId: meldingID,
        error,
        metadata: {
          correspondence
        }
      });
    }
    logger.error(`Failed to add correspondence ID to report ${meldingID}:`, error);
    handleError(error, res);
  }
};

export const RemoveCorrespondenceID: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { meldingID, correspondenceID } = req.params;

  try {
    logger.info(`Melding-Controller: Removing correspondence ID ${correspondenceID} from report ${meldingID}`);
    const { updatedRecord, deletedItem } = await removeCorrespondenceIdService(meldingID, correspondenceID);

    console.log('deletedItem', deletedItem);

    logSuccess(req, {
      action: 'REMOVE_CORRESPONDENCE_ID',
      resourceType: 'MELDING',
      resourceId: meldingID,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        correspondenceID: correspondenceID,
        correspondence: [deletedItem]
      }
    });

    logger.info(`Melding-Controller: Successfully removed correspondence ID from report ${meldingID}`);
    res.status(200).json({ data: updatedRecord });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'REMOVE_CORRESPONDENCE_ID',
        resourceType: 'MELDING',
        resourceId: meldingID,
        error,
        metadata: {
          correspondenceID: correspondenceID
        }
      });
    }
    logger.error(`Failed to remove correspondence ID from report ${meldingID}:`, error);
    handleError(error, res);
  }
};

export const SetCorrespondenceIDs: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { meldingID } = req.params;
  const { correspondence } = req.body;

  try {
    logger.info(`Melding-Controller: Setting correspondence IDs for report ${meldingID}`);
    const result = await setCorrespondenceIdsService(meldingID, correspondence);

    logSuccess(req, {
      action: 'SET_CORRESPONDENCE_IDS',
      resourceType: 'MELDING',
      resourceId: meldingID,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        correspondence
      }
    });

    logger.info(`Melding-Controller: Successfully set correspondence IDs for report ${meldingID}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'SET_CORRESPONDENCE_IDS',
        resourceType: 'MELDING',
        resourceId: meldingID,
        error,
        metadata: {
          correspondence
        }
      });
    }
    logger.error(`Failed to set correspondence IDs for report ${meldingID}:`, error);
    handleError(error, res);
  }
};

export const FindReportByPreventiefID: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { preventiefId } = req.params;

  try {
    logger.info(`Melding-Controller: Finding report by preventief ID ${preventiefId}`);
    const result = await findReportByPreventiefIdService(preventiefId);

    logSuccess(req, {
      action: 'FIND_REPORT_BY_PREVENTIEF_ID',
      resourceType: 'MELDING',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        preventiefId
      }
    });

    logger.info(`Melding-Controller: Successfully found report by preventief ID ${preventiefId}`);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'FIND_REPORT_BY_PREVENTIEF_ID',
        resourceType: 'MELDING',
        error,
        metadata: {
          preventiefId
        }
      });
    }
    logger.error(`Failed to find report by preventief ID ${preventiefId}:`, error);
    handleError(error, res);
  }
};
