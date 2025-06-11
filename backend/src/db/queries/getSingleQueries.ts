/* eslint-disable no-else-return */
/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/return-await */
import { Melding } from '@prisma/client';
import prisma from '../prismaClient';
import userSelect from './helpFunctions/userSelect';

export async function getSingleReport(id: string): Promise<any> {
  return await prisma.melding.findUnique({
    where: { id },
    include: {
      Status: true,
      User: {
        select: {
          Name: true,
          Email: true,
          id: true,
          Department: true
        }
      },
      ChatRoom: {
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            },
            include: {
              user: {
                select: {
                  Name: true,
                  Email: true,
                  id: true,
                  Department: true
                }
              }
            }
          }
        }
      },
      Project: {
        include: {
          ProjectLeider: true
        }
      },
      Correctief: {
        include: {
          User: true,
          Status: true
        }
      },
      Preventief: {
        select: {
          id: true,
          VolgNummer: true,
          CorrespondenceIDs: true,
          Kernoorzaak: true,
          Why: true,
          Deadline: true,
          Title: true,
          Smart: true,
          rootCauseLevel: true,
          Steps: true,
          Strategie: true,
          Conclusie: true,
          TodoItems: true,
          PDCAStatus: true,
          ActJSON: true,
          Teamleden: {
            select: {
              IDs: true
            }
          },
          Status: {
            select: {
              id: true,
              StatusNaam: true,
              StatusColor: true,
              StatusType: true
            }
          },
          User: {
            select: {
              id: true,
              Name: true,
              Department: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });
}

export async function getSingleReportByVolgnummer(volgnummer: string) {
  return await prisma.melding.findUnique({
    where: { VolgNummer: Math.min(parseInt(volgnummer, 10), Number.MAX_SAFE_INTEGER) },
    include: {
      Status: true,
      User: {
        select: {
          Name: true,
          id: true,
          Department: true
        }
      },
      ChatRoom: {
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            },
            include: {
              user: {
                select: {
                  Name: true,
                  id: true
                }
              }
            }
          }
        }
      },
      Project: {
        include: {
          ProjectLeider: {
            select: {
              id: true,
              Name: true
            }
          }
        }
      },
      Correctief: {
        include: {
          User: {
            select: {
              id: true,
              Name: true
            }
          },
          Status: true
        }
      },
      Preventief: {
        select: {
          VolgNummer: true,
          id: true,
          CorrespondenceIDs: true,
          Kernoorzaak: true,
          Deadline: true,
          Title: true,
          rootCauseLevel: true,
          PDCAStatus: true,
          Teamleden: {
            select: {
              IDs: true
            }
          },
          Melding: true,
          Status: true,
          User: {
            select: {
              id: true,
              Name: true,
              Department: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });
}

export async function getSingleProject(id: string, mode?: string) {
  return await prisma.project.findUnique({
    where: mode ? { NumberID: parseInt(id, 10) } : { id },
    include: {
      ProjectLeider: true
    }
  });
}

export async function getSingleProjectleider(id: string) {
  return await prisma.projectleider.findUnique({
    where: { id }
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { Email: email },
    select: userSelect
  });
}

export async function getUserById(user: any) {
  if (user?.id) {
    return await prisma.user.findUnique({
      where: { id: user.id },
      select: userSelect
    });
  } else {
    return await prisma.user.findUnique({
      where: { id: user },
      select: userSelect
    });
  }
}

export async function getSingleActiehouder(id: string) {
  return await prisma.user.findUnique({
    where: { id }
  });
}

export async function getSinglePreventief(id: string) {
  return await prisma.preventief.findUnique({
    where: { id },
    include: {
      Status: true,
      User: true,
      Begeleider: true,
      Melding: true
    }
  });
}

export async function getSingleCorrectief(id: string) {
  return await prisma.correctief.findUnique({
    where: { id },
    include: {
      Status: true,
      User: true,
      Melding: true,
      tasks: true
    }
  });
}

export async function findReportByPreventiefID(preventiefID: string) {
  return await prisma.melding.findFirst({
    where: { PreventiefID: preventiefID }
  });
}
