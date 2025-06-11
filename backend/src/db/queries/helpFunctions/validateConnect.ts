/* eslint-disable import/prefer-default-export */
import { Prisma } from '@prisma/client';
import prisma from '../../prismaClient';

type PrismaModels = Prisma.ModelName;

export async function validateAndConnect(id: string, model: PrismaModels) {
  if (id === undefined || id === null || id === '') {
    return null;
  }

  const exists = await (prisma[model.toLowerCase() as keyof typeof prisma] as any).findUnique({
    where: { id }
  });

  if (!exists) {
    throw new Error(`${model} with id ${id} does not exist`);
  }

  return { connect: { id } };
}
