/* eslint-disable @typescript-eslint/return-await */
import { Correctief } from '@prisma/client';
import logger from '../../../helpers/loggerInstance';
import { CorrectiefQuery } from '../validation/schemas';
import {
  createCorrectief as createCorrectiefDb,
  getAllCorrectief as getAllCorrectiefDb,
  getSingleCorrectief as getSingleCorrectiefDb
} from '../../../db/queries';
import prisma from '../../../db/prismaClient';

export interface CorrectiefResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export async function getCorrectief(id: string): Promise<CorrectiefResponse<Correctief>> {
  try {
    logger.info(`Correctief-Service: Getting correctief record ${id}`);
    const correctief = await getSingleCorrectiefDb(id);

    if (!correctief) {
      throw new Error('Correctief not found');
    }

    return { data: correctief as Correctief };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Correctief-Service: Get failed - ${err}`);
    throw err;
  }
}

export async function getAllCorrectief(filters: CorrectiefQuery): Promise<CorrectiefResponse<Correctief[]>> {
  try {
    logger.info('Correctief-Service: Getting all correctief records');
    const correctieven = await getAllCorrectiefDb();

    // Apply filters in memory since the query function doesn't support filters yet
    let filteredCorrectieven = [...correctieven];

    if (filters.StatusID) {
      filteredCorrectieven = filteredCorrectieven.filter((c) => c.StatusID === filters.StatusID);
    }

    if (filters.userId) {
      filteredCorrectieven = filteredCorrectieven.filter((c) => c.userId === filters.userId);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredCorrectieven = filteredCorrectieven.filter(
        (c) =>
          c.Oplossing?.toLowerCase().includes(searchLower) || c.Deadline?.toString().toLowerCase().includes(searchLower)
      );
    }

    return {
      data: filteredCorrectieven as Correctief[],
      meta: {
        total: filteredCorrectieven.length
      }
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Correctief-Service: Get all failed - ${err}`);
    throw err;
  }
}

export async function createCorrectief(payload: any, userId: string): Promise<CorrectiefResponse<Correctief>> {
  try {
    logger.info('Correctief-Service: Creating new correctief record');
    const correctief = await createCorrectiefDb(
      {
        Deadline: payload.Deadline,
        MeldingID: payload.MeldingID,
        Oplossing: payload.Oplossing || '',
        Faalkosten: payload.Faalkosten ? Number(payload.Faalkosten) : undefined,
        AkoordOPS: payload.AkoordOPS || false,
        ActiehouderID: payload.ActiehouderID,
        StatusID: payload.StatusID
      },
      userId
    );

    return { data: correctief as Correctief };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Correctief-Service: Create failed - ${err}`);
    throw err;
  }
}

export async function updateCorrectief(id: string, payload: any): Promise<CorrectiefResponse<Correctief>> {
  console.log('payload', payload);
  try {
    logger.info(`Correctief-Service: Updating correctief record ${id}`);
    if (payload.UserID) {
      payload.User = { connect: { id: payload.UserID } };
      delete payload.UserID;
    }
    if (payload.StatusID) {
      payload.Status = { connect: { id: payload.StatusID } };
      delete payload.StatusID;
    }

    const correctief = await prisma.correctief.update({
      where: { id },
      data: payload,

      include: {
        Status: true,
        User: true,
        Melding: true,
        tasks: true
      }
    });

    return { data: correctief as Correctief };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`Correctief-Service: Update failed - ${err}`);
    throw err;
  }
}
