/* eslint-disable import/prefer-default-export */
import prisma from '../prismaClient';

export async function getLengths() {
  const [all, ops, correctief, pdca, archived] = await Promise.all([
    prisma.melding.count({
      where: {
        Type: 'Melding'
      }
    }),
    prisma.melding.count({
      where: {
        Type: 'Melding',
        Archived: false,
        OR: [
          {
            Correctief: {
              AkoordOPS: true
            },
            PDCA: false
          },
          {
            Correctief: {
              AkoordOPS: false
            },
            PDCA: false
          },
          {
            Correctief: {
              AkoordOPS: false
            },
            PDCA: true
          }
        ]
      }
    }),
    prisma.melding.count({
      where: {
        Type: 'Melding',
        Archived: false,
        Correctief: {
          Status: {
            StatusNaam: { not: 'Afgerond' }
          },
          AkoordOPS: true,
          Deadline: { not: undefined }
        }
      }
    }),
    prisma.melding
      .findMany({
        where: {
          Type: 'Melding',
          Archived: false,
          PDCA: true,
          PreventiefID: {
            not: null
          }
        },
        distinct: ['PreventiefID']
      })
      .then((results) => results.length),
    prisma.melding.count({
      where: {
        Archived: true
      }
    })
  ]);

  return {
    all,
    ops,
    correctief,
    pdca,
    archived
  };
}
