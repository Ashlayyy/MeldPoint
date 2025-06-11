/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/return-await */
import { RequestHandler } from 'express';
import logger from '../../../helpers/loggerInstance';
import { logSuccess, logError, logStateChange } from '../../../middleware/handleHistory';
import handleError from '../../../utils/errorHandler';
import * as PreventiefService from '../service/PreventiefService';
import { TaskService } from '../../Task/service/TaskService';
import { deleteFile } from '../../../helpers/uploadthing';
import { handlePreventiefTaskUpdate } from '../../../utils/handlePreventiefTasks';
import { recordChange } from '../../../services/versionHistory.service';
import { getPreventiefVolgNummer } from '../../../db/queries';

export const GetAll: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    logger.info('Preventief-Controller: Getting all preventief records');
    const preventief = await PreventiefService.getAll();

    logSuccess(req, {
      action: 'GET_ALL_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        resultCount: preventief?.length || 0,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ data: preventief });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Controller: Get all failed - ${err}`);

    logError(req, {
      action: 'GET_ALL_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

export const GetSingle: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { id } = req.params;

  try {
    logger.info(`Preventief-Controller: Getting preventief record ${id}`);
    const preventief = await PreventiefService.getSingle(id);

    if (!preventief) {
      throw new Error('Preventief not found');
    }

    logSuccess(req, {
      action: 'GET_SINGLE_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ data: preventief });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Controller: Get single failed - ${err}`);

    logError(req, {
      action: 'GET_SINGLE_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: id,
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

export const Create: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    if (!req.user) {
      throw new Error('User is not authenticated');
    }
    logger.info('Preventief-Controller: Creating new preventief record');
    const preventief = await PreventiefService.create(req.body, req.user.id);

    logSuccess(req, {
      action: 'CREATE_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: preventief.id,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    console.log('PrEvEntIEF before task creation', preventief);

    handlePreventiefTaskCreation(preventief);
    res.status(201).json({ data: preventief });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Controller: Create failed - ${err}`);

    logError(req, {
      action: 'CREATE_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

async function handlePreventiefTaskCreation(preventief: any): Promise<void> {
  try {
    logger.info(`Preventief-Controller: Processing tasks for preventief ${preventief.id}`);

    // For correctief - fetch full report data which should include correctief info
    const preventiefObject = await PreventiefService.getSingle(preventief.id);

    // Use type assertion to access properties that TypeScript doesn't recognize
    const typedPreventief = preventiefObject as any;
    const volgnummer = typedPreventief?.Melding?.[0]?.VolgNummer;

    // console.log("Preventief Object", preventiefObject);

    if (preventiefObject?.id) {
      // Prepare task data with correctief information
      const preventiefTaskData = {
        userId: typedPreventief.User?.id,
        url: `/verbeterplein/melding/${volgnummer}`,
        message: `Preventief deadline (#${volgnummer})`,
        action: `Preventief deadline (#${volgnummer})`,
        deadline: preventiefObject.Deadline,
        actionType: 'traject',
        category: 'preventief',
        preventiefId: preventiefObject.id,
        finished: false,
        level: preventiefObject.rootCauseLevel
      };

      // Fire and forget - don't await this promise
      TaskService.createTask(preventiefTaskData)
        .then((task) => {
          logger.info(
            `Preventief-Controller: Successfully created preventief task ${task.id} for preventief ${preventief.id}`
          );
        })
        .catch((error) => {
          logger.error(
            `Preventief-Controller: Failed to create preventief task for preventief ${preventief.id}:`,
            error instanceof Error ? error : new Error(String(error))
          );
        });
    } else {
      logger.info(`Preventief-Controller: No preventief data found in preventief ${preventief.id}`);
    }
  } catch (error: any) {
    // Catch any errors in the function
    logger.error(
      `Preventief-Controller: Error in handleTaskCreation for preventief ${preventief.id}:`,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

export const Update: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { id } = req.params;

  try {
    logger.info(`Preventief-Controller: Updating preventief record ${id}`);

    // Get previous state before update
    const previousState = await PreventiefService.getSingle(id);
    if (!previousState) {
      throw new Error(`Preventief record ${id} not found for fetching previous state.`);
    }

    const preventief = await PreventiefService.update(id, req.body.data);

    if (!preventief) {
      throw new Error('Preventief update failed or record not found');
    }

    logger.debug(`Preventief-Controller: Calling Version History Service for preventief ${id}`);
    const userId = req.user?.id;
    recordChange('Preventief', id, previousState, preventief, userId)
      .then(() => {
        logger.debug(`Preventief-Controller: Version History Service for preventief ${id} completed`);
      })
      .catch((error) => {
        logger.error(`Preventief-Controller: Version History Service for preventief ${id} failed:`, error);
      });

    handlePreventiefTaskUpdate(preventief, req.body.data);

    logStateChange(req, {
      action: 'UPDATE_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: id,
      previousState: previousState,
      newState: preventief,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ data: preventief });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Controller: Update failed - ${err}`);

    logError(req, {
      action: 'UPDATE_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: id,
      error: err,
      metadata: {
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

export const AddTeamlidToPreventief: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { meldingID, teamlidID } = req.params;

  try {
    logger.info(`Preventief-Controller: Adding teamlid ${teamlidID} to preventief record ${meldingID}`);
    const preventief = await PreventiefService.addTeamlidToPreventief(meldingID, teamlidID);

    if (!preventief) {
      throw new Error('Preventief not found');
    }

    logSuccess(req, {
      action: 'ADD_TEAMLID_TO_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: meldingID,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        teamlidID,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ data: preventief });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Controller: Add teamlid failed - ${err}`);

    logError(req, {
      action: 'ADD_TEAMLID_TO_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: meldingID,
      error: err,
      metadata: {
        teamlidID,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

export const RewriteTeamlidInPreventief: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { meldingID } = req.params;
  const { teamleden } = req.body;

  try {
    logger.info(`Preventief-Controller: Rewriting teamleden for preventief record ${meldingID}`);
    const preventief = await PreventiefService.rewriteTeamlidInPreventief(meldingID, teamleden);

    if (!preventief) {
      throw new Error('Preventief not found');
    }

    logSuccess(req, {
      action: 'REWRITE_TEAMLID_IN_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: meldingID,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        teamledenCount: teamleden?.length || 0,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ data: preventief });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Controller: Rewrite teamlid failed - ${err}`);

    logError(req, {
      action: 'REWRITE_TEAMLID_IN_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: meldingID,
      error: err,
      metadata: {
        teamledenCount: teamleden?.length || 0,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

export const RemoveTeamlidFromPreventief: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { meldingID, teamlidID } = req.params;

  try {
    logger.info(`Preventief-Controller: Removing teamlid ${teamlidID} from preventief record ${meldingID}`);
    const preventief = await PreventiefService.removeTeamlidFromPreventief(meldingID, teamlidID);

    if (!preventief) {
      throw new Error('Preventief not found');
    }

    logSuccess(req, {
      action: 'REMOVE_TEAMLID_FROM_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: meldingID,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        teamlidID,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ data: preventief });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Controller: Remove teamlid failed - ${err}`);

    logError(req, {
      action: 'REMOVE_TEAMLID_FROM_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: meldingID,
      error: err,
      metadata: {
        teamlidID,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

export const AddCorrespondenceToPreventief: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { preventiefID } = req.params;
  const { correspondence } = req.body;

  try {
    logger.info(`Preventief-Controller: Adding correspondence to preventief record ${preventiefID}`);
    const preventief = await PreventiefService.addCorrespondenceToPreventief(preventiefID, correspondence);

    if (!preventief) {
      throw new Error('Preventief not found');
    }

    logSuccess(req, {
      action: 'ADD_CORRESPONDENCE_TO_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: preventiefID,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        correspondence,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ data: preventief });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Controller: Add correspondence failed - ${err}`);

    logError(req, {
      action: 'ADD_CORRESPONDENCE_TO_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: preventiefID,
      error: err,
      metadata: {
        correspondence,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};

export const RemoveCorrespondenceFromPreventief: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { preventiefID, CorrespondenceID } = req.params;

  try {
    logger.info(
      `Preventief-Controller: Removing correspondence ${CorrespondenceID} from preventief record ${preventiefID}`
    );
    // The service function now returns an object with updatedRecord and deletedItem
    const { updatedRecord, deletedItem } = await PreventiefService.removeCorrespondenceFromPreventief(
      preventiefID,
      CorrespondenceID
    );

    if (deletedItem?.key) {
      logger.info('PreventiefService: Deleting correspondence file', { fileKey: deletedItem.key });
      await deleteFile(deletedItem.key);
    }

    if (!updatedRecord) {
      // Handle case where preventief or correspondence wasn't found by the service/DB query
      throw new Error('Preventief record or Correspondence item not found, or deletion failed');
    }

    logSuccess(req, {
      action: 'REMOVE_CORRESPONDENCE_FROM_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: preventiefID,
      metadata: {
        executionTime: Number((process.hrtime(startTime)[0] * 1e9 + process.hrtime(startTime)[1] / 1e6).toFixed(2)),
        correspondenceID: CorrespondenceID,
        correspondence: [deletedItem],
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    res.status(200).json({ data: updatedRecord }); // Return the updated record
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Controller: Remove correspondence failed - ${err}`);

    logError(req, {
      action: 'REMOVE_CORRESPONDENCE_FROM_PREVENTIEF',
      resourceType: 'PREVENTIEF',
      resourceId: preventiefID,
      error: err,
      metadata: {
        correspondenceID: CorrespondenceID,
        environment: process.env.NODE_ENV,
        apiVersion: process.env.API_VERSION || '1.0'
      }
    });

    handleError(err, res);
  }
};
