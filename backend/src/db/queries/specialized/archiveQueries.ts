/* eslint-disable @typescript-eslint/return-await */
import prisma from '../../prismaClient';

export async function archiveMultipleReports(ids: string[]) {
  return prisma.melding.updateMany({
    where: {
      id: {
        in: ids
      }
    },
    data: {
      Archived: true,
      ArchivedAt: new Date()
    }
  });
}

export async function archiveSingleReport(id: string) {
  return prisma.melding.update({
    where: { id },
    data: {
      Archived: true,
      ArchivedAt: new Date()
    }
  });
}
