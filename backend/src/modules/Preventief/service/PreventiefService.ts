/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/return-await */
import { Preventief } from '@prisma/client';
import logger from '../../../helpers/loggerInstance';
import {
  createPreventief,
  getSinglePreventief,
  getAllPreventief,
  updatePreventief,
  addTeamlid,
  reWriteTeamlid,
  removeTeamlid,
  addCorrespondenceIDPreventief,
  removeCorrespondenceIDPreventief,
  CreatePreventief
} from '../../../db/queries';

type UpdatePreventiefInput = Parameters<typeof updatePreventief>[1];

export async function create(data: CreatePreventief, userId: string): Promise<Preventief> {
  try {
    logger.info('Preventief-Service: Creating new preventief record');
    return await createPreventief(data, userId);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Service: Create failed - ${err}`);
    throw err;
  }
}

export async function getSingle(id: string): Promise<Preventief | null> {
  try {
    logger.info(`Preventief-Service: Getting preventief record ${id}`);
    return await getSinglePreventief(id);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Service: Get single failed - ${err}`);
    throw err;
  }
}

export async function getAll(): Promise<Preventief[]> {
  try {
    logger.info('Preventief-Service: Getting all preventief records');
    return await getAllPreventief();
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Service: Get all failed - ${err}`);
    throw err;
  }
}

export async function update(id: string, data: UpdatePreventiefInput): Promise<Preventief | null> {
  try {
    logger.info(`Preventief-Service: Updating preventief record ${id}`);
    return await updatePreventief(id, data);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Service: Update failed - ${err}`);
    throw err;
  }
}

export async function addTeamlidToPreventief(id: string, teamlidID: string): Promise<Preventief | null> {
  try {
    logger.info(`Preventief-Service: Adding teamlid ${teamlidID} to preventief record ${id}`);
    return await addTeamlid(id, teamlidID);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Service: Add teamlid failed - ${err}`);
    throw err;
  }
}

export async function rewriteTeamlidInPreventief(id: string, teamleden: string[]): Promise<Preventief | null> {
  try {
    logger.info(`Preventief-Service: Rewriting teamleden for preventief record ${id}`);
    return await reWriteTeamlid(id, teamleden);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Service: Rewrite teamlid failed - ${err}`);
    throw err;
  }
}

export async function removeTeamlidFromPreventief(id: string, teamlidID: string): Promise<Preventief | null> {
  try {
    logger.info(`Preventief-Service: Removing teamlid ${teamlidID} from preventief record ${id}`);
    return await removeTeamlid(id, teamlidID);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Service: Remove teamlid failed - ${err}`);
    throw err;
  }
}

export async function addCorrespondenceToPreventief(id: string, correspondenceID: string): Promise<Preventief | null> {
  try {
    logger.info(`Preventief-Service: Adding correspondence ${correspondenceID} to preventief record ${id}`);
    return await addCorrespondenceIDPreventief(id, correspondenceID);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Service: Add correspondence failed - ${err}`);
    throw err;
  }
}

export async function removeCorrespondenceFromPreventief(
  id: string,
  correspondenceID: string
): Promise<{ updatedRecord: Preventief | null; deletedItem: any }> {
  try {
    logger.info(`Preventief-Service: Removing correspondence ${correspondenceID} from preventief record ${id}`);
    const result = await removeCorrespondenceIDPreventief(id, correspondenceID);
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Preventief-Service: Remove correspondence failed - ${err}`);
    throw err;
  }
}
