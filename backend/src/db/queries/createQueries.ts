/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/return-await */
import prisma from '../prismaClient';
import type { Melding } from '../../types/queryTypes';
import { validateAndConnect } from './helpFunctions/validateConnect';
import logger from '../../helpers/loggerInstance';

export async function createReport(data: Melding, userId: string) {
  return await prisma.$transaction(async (tx) => {
    const connections: any = {};

    if (data.ProjectID) {
      const connection = await validateAndConnect(data.ProjectID, 'Project');
      if (connection) {
        connections.Project = connection;
      }
    }

    if (data.StatusID) {
      connections.Status = await validateAndConnect(data.StatusID, 'Status');
    }

    if (data.UserID) {
      connections.User = await validateAndConnect(data.UserID, 'User');
    }

    const melding = await tx.melding.create({
      data: {
        Obstakel: data.Obstakel || '',
        Type: data.Type || 'Melding',
        Deelorder: data.Deelorder || '',
        PDCA: !!data.Preventief,
        Archived: false,
        VolgNummer: data.VolgNummer,
        ...(data.UserID && {
          User: { connect: { id: data.UserID } }
        }),
        ...(data.CorrespondenceIDs && {
          CorrespondenceIDs: { set: data.CorrespondenceIDs }
        }),
        ...connections,
        ...(userId && { CreatedBy: { connect: { id: userId } } })
      }
    });

    if (data.Project) {
      const projectUpdates: any = {};

      let projectID;
      if (!data.ProjectID) {
        const project = await tx.project.findFirst({
          where: { NumberID: data.Project.NumberID }
        });

        if (project) {
          projectID = project;
        } else {
          projectID = await tx.project.create({
            data: {
              ProjectNaam: `Project-${data.Project.NumberID}`,
              NumberID: Number(data.Project.NumberID),
              Deelorders: [],
              Melding: { connect: { id: melding.id } }
            }
          });
        }
      } else {
        projectID = data.ProjectID;
        await tx.project.update({
          where: { id: data.ProjectID },
          data: {
            Melding: { connect: { id: melding.id } }
          }
        });
      }

      if (data.Project?.ProjectleiderId) {
        projectUpdates.ProjectLeider = {
          connect: { id: data.Project.ProjectleiderId }
        };
      }

      if (data.Deelorder) {
        const project = await tx.project.findUnique({
          where: { id: typeof projectID === 'string' ? projectID : projectID.id },
          select: { Deelorders: true }
        });

        if (project && !project.Deelorders.includes(data.Deelorder)) {
          projectUpdates.Deelorders = { push: data.Deelorder };
        }
      }

      if (Object.keys(projectUpdates).length > 0) {
        await tx.project.update({
          where: { id: typeof projectID === 'string' ? projectID : projectID.id },
          data: projectUpdates
        });
      }
    }

    if (data.Preventief) {
      const preventiefConnections: any = {};

      if (data.Preventief.ActiehouderID) {
        preventiefConnections.User = await validateAndConnect(data.Preventief.ActiehouderID, 'User');
      }

      if (data.Preventief.StatusID) {
        preventiefConnections.Status = await validateAndConnect(data.Preventief.StatusID, 'Status');
      }

      await tx.preventief.create({
        data: {
          Deadline: data.Preventief.Deadline,
          Melding: { connect: { id: melding.id } },
          rootCauseLevel: data.Preventief.RootCauseLevel ? 1 : 2,
          ...preventiefConnections,
          ...(userId && { CreatedBy: { connect: { id: userId } } })
        }
      });
    }

    if (data.Correctief) {
      await tx.correctief.create({
        data: {
          Deadline: data.Correctief.Deadline,
          Oplossing: data.Correctief.Oplossing || '',
          Faalkosten: Number(data.Correctief.Faalkosten) || null,
          AkoordOPS: data.Correctief.AkoordOPS || false,
          Melding: { connect: { id: melding.id } },
          ...(data.Correctief.ActiehouderID && {
            User: { connect: { id: data.Correctief.ActiehouderID } }
          }),
          ...(data.Correctief.StatusID && {
            Status: { connect: { id: data.Correctief.StatusID } }
          }),
          ...(userId && { CreatedBy: { connect: { id: userId } } })
        }
      });
    }

    return melding;
  });
}

export async function createProject(data: {
  ProjectNaam: string;
  NumberID: number;
  ProjectleiderId?: string;
  StartDate?: string;
  EndDate?: string;
  Beschrijving?: string;
  ProjectLocatie?: string;
}) {
  return await prisma.project.create({
    data: {
      ProjectNaam: data.ProjectNaam,
      NumberID: Number(data.NumberID),
      ...(data.StartDate && { StartDate: new Date(data.StartDate) }),
      ...(data.EndDate && { EndDate: new Date(data.EndDate) }),
      ...(data.Beschrijving && { Beschrijving: data.Beschrijving }),
      ...(data.ProjectLocatie && { ProjectLocatie: data.ProjectLocatie }),
      Deelorders: [],
      ...(data.ProjectleiderId && {
        ProjectLeider: { connect: { id: data.ProjectleiderId } }
      })
    }
  });
}

export async function createProjectleider(data: { Name: string }) {
  return await prisma.projectleider.create({
    data: {
      Name: data.Name
    }
  });
}

export async function createUser(data: {
  Email: string;
  Name: string;
  MicrosoftId: string;
  groupID: string;
  lastLogin: Date;
}) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        Email: data.Email,
        Name: data.Name,
        MicrosoftId: data.MicrosoftId,
        lastLogin: data.lastLogin
      }
    });

    await tx.usersOnPermissionGroups.create({
      data: {
        user: { connect: { id: user.id } },
        group: { connect: { id: data.groupID } }
      }
    });

    const DEFAULT_ROLE = 'Actiehouder';

    const role = await tx.role.findFirst({
      where: {
        name: {
          contains: DEFAULT_ROLE
        }
      }
    });

    if (role) {
      await tx.usersOnRoles.create({
        data: {
          user: { connect: { id: user.id } },
          role: { connect: { id: role.id } }
        }
      });
    } else {
      logger.error(`CreateUser Query: ${DEFAULT_ROLE} role not found. Look into DEBUG log for more information.`);
      logger.debug(
        JSON.stringify({
          userId: user.id,
          email: user.Email,
          roleName: DEFAULT_ROLE,
          error: 'Role not found'
        })
      );
    }

    return user;
  });
}

export interface CreatePreventief {
  Deadline: string;
  Title: string;
  MeldingID: string;
  ActiehouderID?: string;
  StatusID?: string;
  RootCauseLevel?: number;
  VolgNummer?: number;
}

export async function createPreventief(data: CreatePreventief, userId: string) {
  return await prisma.$transaction(async (tx) => {
    // Create the preventief record
    const preventief = await tx.preventief.create({
      data: {
        Deadline: data.Deadline,
        Title: data.Title,
        rootCauseLevel: data.RootCauseLevel,
        VolgNummer: data.VolgNummer,
        Melding: { connect: { id: data.MeldingID } },
        ...(data.ActiehouderID && {
          User: { connect: { id: data.ActiehouderID } }
        }),
        ...(data.StatusID && {
          Status: { connect: { id: data.StatusID } }
        }),
        ...(userId && { CreatedBy: { connect: { id: userId } } })
      }
    });

    // Update the melding's PDCA flag
    await tx.melding.update({
      where: { id: data.MeldingID },
      data: { PDCA: true }
    });

    return preventief;
  });
}

export async function createCorrectief(
  data: {
    Deadline: Date;
    MeldingID: string;
    Oplossing?: string;
    Faalkosten?: number;
    AkoordOPS?: boolean;
    ActiehouderID?: string;
    StatusID?: string;
  },
  userId: string
) {
  return await prisma.correctief.create({
    data: {
      Deadline: data.Deadline.toISOString(),
      Oplossing: data.Oplossing || '',
      Faalkosten: data.Faalkosten || null,
      AkoordOPS: data.AkoordOPS || false,
      Melding: { connect: { id: data.MeldingID } },
      ...(data.ActiehouderID && {
        User: { connect: { id: data.ActiehouderID } }
      }),
      ...(data.StatusID && {
        Status: { connect: { id: data.StatusID } }
      }),
      ...(userId && { CreatedBy: { connect: { id: userId } } })
    }
  });
}
