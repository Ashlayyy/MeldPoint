/* eslint-disable @typescript-eslint/return-await */
import prisma from '../../prismaClient';

export async function setCloneIDs(meldingID: string, cloneIds: string[]) {
  return prisma.melding.update({
    where: { id: meldingID },
    data: {
      CloneIds: {
        IDs: cloneIds
      }
    }
  });
}

export async function addCloneID(meldingID: string, cloneID: string) {
  const ids = await prisma.melding.findUnique({ where: { id: meldingID } });
  return await prisma.melding.update({
    where: {
      id: meldingID
    },
    data: {
      CloneIds: {
        IDs: ids?.CloneIds?.IDs ? [...ids.CloneIds.IDs, cloneID] : [cloneID]
      }
    }
  });
}

export async function removeCloneID(meldingID: string, cloneID: string) {
  const melding = await prisma.melding.findUnique({
    where: {
      id: meldingID,
      CloneIds: {
        IDs: [cloneID]
      }
    }
  });
  if (melding) {
    const ids = melding.CloneIds?.IDs.filter((id) => id !== cloneID);
    return await prisma.melding.update({
      where: {
        id: meldingID
      },
      data: {
        CloneIds: {
          set: {
            IDs: ids
          }
        }
      }
    });
  }
  return null;
}

export async function deleteCloneIDs(meldingID: string) {
  return prisma.melding.update({
    where: { id: meldingID },
    data: {
      CloneIds: null
    }
  });
}
