/* eslint-disable @typescript-eslint/return-await */
import prisma from '../../prismaClient';

export async function addTeamlid(preventiefID: string, cloneID: string) {
  const preventief = await prisma.preventief.findUnique({ where: { id: preventiefID } });
  return await prisma.preventief.update({
    where: {
      id: preventiefID
    },
    data: {
      Teamleden: {
        IDs: preventief?.Teamleden?.IDs ? [...preventief.Teamleden.IDs, cloneID] : [cloneID]
      }
    }
  });
}

export async function reWriteTeamlid(preventiefID: string, cloneIDs: string[]) {
  return prisma.preventief.update({
    where: { id: preventiefID },
    data: {
      Teamleden: {
        IDs: cloneIDs
      }
    }
  });
}

export async function removeTeamlid(meldingID: string, cloneID: string) {
  const melding = await prisma.melding.findUnique({
    select: {
      Preventief: {
        select: {
          id: true,
          Teamleden: {
            select: {
              IDs: true
            }
          }
        }
      }
    },
    where: { id: meldingID }
  });

  if (melding?.Preventief && melding.Preventief.Teamleden) {
    const updatedTeamlid = melding.Preventief.Teamleden.IDs.filter((id: string) => id !== cloneID);
    return prisma.preventief.update({
      where: { id: melding.Preventief.id },
      data: {
        Teamleden: {
          IDs: updatedTeamlid
        }
      }
    });
  }
  return null;
}
