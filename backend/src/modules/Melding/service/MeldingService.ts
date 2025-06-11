import { ParsedQs } from 'qs';
import logger from '../../../utils/logger';
import { deleteFile } from '../../../helpers/uploadthing';
import {
  getLengths,
  getAllReports,
  getSingleReport,
  createReport,
  updateSingleReport,
  archiveMultipleReports,
  archiveSingleReport,
  addCloneID,
  removeCloneID,
  addCorrespondenceID,
  removeCorrespondenceID,
  setCorrespondenceIDs,
  findReportByPreventiefID,
  getSingleReportByVolgnummer
} from '../../../db/queries';
import { Melding } from '@prisma/client';

interface CorrespondenceData {
  key: string;
  FileKey?: string;
}

interface MeldingReport {
  CorrespondenceIDs?: {
    IDs: string; // JSON string of CorrespondenceData[]
  } | null;
}

export const getLengthsService = async () => {
  logger.info('MeldingService: Getting melding lengths');
  return getLengths();
};

export const getAllReportsService = async (query: ParsedQs) => {
  logger.info('MeldingService: Getting all reports', { query });
  return getAllReports();
};

export const getSingleReportService = async (id: string): Promise<any> => {
  logger.info('MeldingService: Getting single report', { id });
  return getSingleReport(id);
};

export const getSingleReportByVolgnummerService = async (volgnummer: string) => {
  logger.info('MeldingService: Getting single report by volgnummer', { volgnummer });
  return getSingleReportByVolgnummer(volgnummer);
};

export const createReportService = async (data: any, userId: string) => {
  logger.info('MeldingService: Creating report', { data });
  return createReport(data, userId);
};

export const updateReportService = async (id: string, data: any) => {
  logger.info('MeldingService: Updating report', { id, data });
  return updateSingleReport(id, data);
};

export const archiveMultipleReportsService = async (ids: string[]) => {
  logger.info('MeldingService: Archiving multiple reports', { ids });
  return archiveMultipleReports(ids);
};

export const archiveSingleReportService = async (id: string) => {
  logger.info('MeldingService: Archiving single report', { id });
  return archiveSingleReport(id);
};

export const addCloneIdService = async (meldingId: string, cloneId: string) => {
  logger.info('MeldingService: Adding clone ID', { meldingId, cloneId });
  return addCloneID(meldingId, cloneId);
};

export const removeCloneIdService = async (meldingId: string, cloneId: string) => {
  logger.info('MeldingService: Removing clone ID', { meldingId, cloneId });
  return removeCloneID(meldingId, cloneId);
};

export const addCorrespondenceIdService = async (meldingId: string, correspondenceId: string) => {
  logger.info('MeldingService: Adding correspondence ID', { meldingId, correspondenceId });
  return addCorrespondenceID(meldingId, correspondenceId);
};

export const removeCorrespondenceIdService = async (meldingId: string, correspondenceId: string) => {
  logger.info('MeldingService: Removing correspondence ID', { meldingId, correspondenceId });
  try {
    // Get the correspondence details *before* removal (already done by removeCorrespondenceID)
    // const report = (await getSingleReport(meldingId)) as MeldingReport;
    // const correspondenceList: CorrespondenceData[] = report?.CorrespondenceIDs?.IDs
    //   ? JSON.parse(report.CorrespondenceIDs.IDs)
    //   : [];
    // const correspondence = correspondenceList.find((c) => c.key === correspondenceId);

    // Remove the correspondence from the database and get the deleted item
    const { updatedRecord, deletedItem } = await removeCorrespondenceID(meldingId, correspondenceId);

    // If there was a file attached, delete it from uploadthing
    if (deletedItem?.key) {
      logger.info('MeldingService: Deleting correspondence file', { fileKey: deletedItem.key });
      await deleteFile(deletedItem.key);
    }

    // Return the details of the deleted item
    return { updatedRecord, deletedItem };
  } catch (error) {
    logger.error('MeldingService: Error removing correspondence', { error, meldingId, correspondenceId });
    throw error;
  }
};

export const setCorrespondenceIdsService = async (meldingId: string, correspondence: any[]) => {
  logger.info('MeldingService: Setting correspondence IDs', { meldingId, correspondence });
  try {
    // Get current correspondence before update
    const report = (await getSingleReport(meldingId)) as MeldingReport;

    // Safely parse current correspondence with proper error handling
    let currentCorrespondence: CorrespondenceData[] = [];
    try {
      currentCorrespondence = report?.CorrespondenceIDs?.IDs ? JSON.parse(report.CorrespondenceIDs.IDs) : [];

      // Handle case where it might be nested in an array
      if (Array.isArray(currentCorrespondence[0])) {
        console.log('correspondance nested in an array');
        currentCorrespondence = currentCorrespondence[0];
      }
    } catch (parseError) {
      console.log('error parsing correspondence IDs', parseError);
      logger.error('MeldingService: Error parsing correspondence IDs', { parseError });
      currentCorrespondence = [];
    }

    console.log('correspondence', correspondence);

    // Ensure correspondence is an array
    const safeCorrespondence = Array.isArray(correspondence) ? correspondence : [];

    console.log('safeCorrespondence', safeCorrespondence);

    // Find correspondence that will be removed (only if we have valid arrays)
    const toBeRemoved = currentCorrespondence.filter(
      (c) => c && c.key && !safeCorrespondence.map((sc) => sc.key).includes(c.key)
    );

    // Delete files for removed correspondence
    await Promise.all(
      toBeRemoved
        .filter((c) => c && c.FileKey)
        .map(async (c) => {
          logger.info('MeldingService: Deleting correspondence file', { fileKey: c.FileKey });
          await deleteFile(c.FileKey!);
        })
    );

    return setCorrespondenceIDs(meldingId, safeCorrespondence);
  } catch (error) {
    logger.error('MeldingService: Error setting correspondence IDs', { error, meldingId, correspondence });
    throw error;
  }
};

export const findReportByPreventiefIdService = async (preventiefId: string) => {
  logger.info('MeldingService: Finding report by preventief ID', { preventiefId });
  return findReportByPreventiefID(preventiefId);
};
