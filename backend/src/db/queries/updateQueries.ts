/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/return-await */
import type { Prisma } from '@prisma/client';
import prisma from '../prismaClient';
import type { Melding, UserDepartment, Correctief, SmartItem, Effectiviteit } from '../../types/queryTypes';

export async function updateSingleReport(id: string, data: Partial<Melding>) {
  return await prisma.$transaction(async (tx) => {
    const updateData: any = {
      ...(data.Obstakel !== undefined && { Obstakel: data.Obstakel }),
      ...(data.Type !== undefined && { Type: data.Type }),
      ...(data.Deelorder !== undefined && { Deelorder: data.Deelorder }),
      ...(data.PDCA !== undefined && { PDCA: data.PDCA }),
      ...(data.Archived !== undefined && { Archived: data.Archived, ...(data.Archived && { ArchivedAt: new Date() }) }),
      ...(data.VolgNummer !== undefined && { VolgNummer: data.VolgNummer }),
      ...(data.Title !== undefined && { Title: data.Title }),
      ...(data.Category !== undefined && { Category: data.Category }),
      ...(data.ClonedTo !== undefined && { ClonedTo: data.ClonedTo }),
      ...(data.CloneIds !== undefined && { CloneIds: data.CloneIds }),
      ...(data.ProjectID && {
        Project: { connect: { id: data.ProjectID } }
      }),
      ...(data.ActiehouderID && {
        Actiehouder: { connect: { id: data.ActiehouderID } }
      }),
      ...(data.UserID && {
        User: { connect: { id: data.UserID } }
      }),
      ...(data.StatusID && {
        Status: { connect: { id: data.StatusID } }
      }),
      ...(data.CorrectiefID && {
        Correctief: { connect: { id: data.CorrectiefID } }
      }),
      ...(data.PreventiefID && {
        Preventief: { connect: { id: data.PreventiefID } }
      }),
      ...(data.Preventief && { PDCA: true })
    };

    const melding = await tx.melding.update({
      where: { id },
      data: updateData,
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
        ChatRoom: true,
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
          include: {
            User: true,
            Status: true
          }
        }
      }
    });

    if (data.Preventief) {
      if (melding.Preventief) {
        await tx.preventief.update({
          where: { id: melding.Preventief.id },
          data: {
            ...(data.Preventief.Deadline && { Deadline: data.Preventief.Deadline }),
            ...(data.Preventief.ActiehouderID && {
              User: { connect: { id: data.Preventief.ActiehouderID } }
            }),
            ...(data.Preventief.BegeleiderID && {
              Begeleider: { connect: { id: data.Preventief.BegeleiderID } }
            }),
            ...(data.Preventief.StatusID && {
              Status: { connect: { id: data.Preventief.StatusID } }
            })
          }
        });
      }
    }

    if (data.Correctief) {
      if (melding.Correctief) {
        await tx.correctief.update({
          where: { id: melding.Correctief.id },
          data: {
            ...(data.Correctief.Deadline && { Deadline: data.Correctief.Deadline }),
            ...(data.Correctief.Oplossing !== undefined && { Oplossing: data.Correctief.Oplossing }),
            ...(data.Correctief.Faalkosten !== undefined && { Faalkosten: data.Correctief.Faalkosten }),
            ...(data.Correctief.AkoordOPS !== undefined && { AkoordOPS: data.Correctief.AkoordOPS }),
            ...(data.Correctief.ActiehouderID && {
              User: { connect: { id: data.Correctief.ActiehouderID } }
            }),
            ...(data.Correctief.StatusID && {
              Status: { connect: { id: data.Correctief.StatusID } }
            })
          }
        });
      }
    }

    return melding;
  });
}

export async function updateSingleProject(
  id: string,
  data: {
    ProjectNaam?: string;
    NumberID?: number;
    ProjectleiderId?: string;
    Deelorders?: string[];
    ProjectLocatie?: string; // Location = Longitude, Latitude
    StartDate?: string;
    EndDate?: string;
    Beschrijving?: string;
  }
) {
  return await prisma.project.update({
    where: { id },
    data: {
      ...(data.ProjectNaam && { ProjectNaam: data.ProjectNaam }),
      ...(data.NumberID && { NumberID: Number(data.NumberID) }),
      ...(data.Deelorders && { Deelorders: data.Deelorders }),
      ...(data.ProjectleiderId && {
        ProjectLeider: { connect: { id: data.ProjectleiderId } }
      }),
      ...(data.ProjectLocatie && { ProjectLocatie: data.ProjectLocatie }),
      ...(data.StartDate && { StartDate: new Date(data.StartDate) }),
      ...(data.EndDate && { EndDate: new Date(data.EndDate) }),
      ...(data.Beschrijving && { Beschrijving: data.Beschrijving })
    },
    include: {
      ProjectLeider: true
    }
  });
}

export async function updateSingleProjectleider(id: string, data: { Name?: string }) {
  return await prisma.projectleider.update({
    where: { id },
    data: {
      ...(data.Name && { Name: data.Name })
    }
  });
}

export async function updateCorrectief(id: string, data: Partial<Correctief>) {
  return await prisma.$transaction(async (tx) => {
    const previousState = await tx.correctief.findUnique({
      where: { id },
      include: {
        User: true,
        Status: true
      }
    });

    if (!previousState) {
      throw new Error('Correctief not found');
    }

    const updatedCorrectief = await tx.correctief.update({
      where: { id },
      data: {
        ...(data.Deadline && { Deadline: data.Deadline }),
        ...(data.Oplossing !== undefined && { Oplossing: data.Oplossing }),
        ...(data.Faalkosten !== undefined && { Faalkosten: Number(data.Faalkosten) }),
        ...(data.AkoordOPS !== undefined && { AkoordOPS: data.AkoordOPS }),
        ...(data.ActiehouderID && {
          User: { connect: { id: data.ActiehouderID } }
        }),
        ...(data.StatusID && {
          Status: { connect: { id: data.StatusID } }
        })
      },
      include: {
        User: true,
        Status: true,
        Melding: true,
        tasks: true
      }
    });

    return updatedCorrectief;
  });
}

export async function updatePreventief(
  id: string,
  data: {
    Deadline?: string;
    Title?: string;
    Kernoorzaak?: string;
    Why?: Prisma.JsonValue;
    Smart?: Prisma.InputJsonValue & {
      Specifiek?: SmartItem;
      Meetbaar?: SmartItem;
      Haalbaar?: SmartItem;
      Relevant?: SmartItem;
      Tijdgebonden?: SmartItem;
    };
    Steps?: Prisma.InputJsonValue & {
      Obstakel?: { Deadline?: Date; Finished?: boolean };
      Plan?: { Deadline?: Date; Finished?: boolean };
      Do?: { Deadline?: Date; Finished?: boolean };
      Check?: { Deadline?: Date; Finished?: boolean };
      Act?: { Deadline?: Date; Finished?: boolean };
    };
    Strategie?: Prisma.InputJsonValue & {
      KPI?: string;
      Comments?: string;
    };
    Conclusie?: string;
    TodoItems?: Array<String>;
    TrainingNeeded?: boolean;
    TrainingNeededType?: string;
    Documentation?: string;
    Monitoring?: string;
    FollowUpDate?: string;
    Responsible?: string;
    FailureAnalysis?: string;
    NewPDCAPlanning?: string;
    PDCAStatus?: 'Wel' | 'Deels' | 'Niet';
    ActJSON?: Prisma.JsonValue;
    User?: any;
    Begeleider?: any;
    StatusID?: string;
    Teamleden?: { IDs: string[] };
  }
) {
  return await prisma.$transaction(async (tx) => {
    const preventief = await tx.preventief.update({
      where: { id },
      data: {
        ...(data.Deadline && { Deadline: data.Deadline }),
        ...(data.Title && { Title: data.Title }),
        ...(data.Kernoorzaak && { Kernoorzaak: data.Kernoorzaak }),
        ...(data.Why && { Why: data.Why }),
        ...(data.Smart && { Smart: { set: data.Smart } }),
        ...(data.Steps && { Steps: { set: data.Steps } }),
        ...(data.Strategie && { Strategie: { set: data.Strategie } }),
        ...(data.Conclusie && { Conclusie: data.Conclusie }),
        ...(data.TodoItems && { TodoItems: { set: data.TodoItems } }),
        ...(data.PDCAStatus && { PDCAStatus: data.PDCAStatus }),
        ...(data.ActJSON && { ActJSON: data.ActJSON }),
        ...(data.Teamleden && { Teamleden: { set: { IDs: data.Teamleden.IDs } } }),
        ...(data.TrainingNeeded && { TrainingNeeded: data.TrainingNeeded }),
        ...(data.TrainingNeededType && { TrainingNeededType: data.TrainingNeededType }),
        ...(data.Documentation && { Documentation: data.Documentation }),
        ...(data.Monitoring && { Monitoring: data.Monitoring }),
        ...(data.FollowUpDate && { FollowUpDate: data.FollowUpDate }),
        ...(data.Responsible && { Responsible: data.Responsible }),
        ...(data.FailureAnalysis && { FailureAnalysis: data.FailureAnalysis }),
        ...(data.NewPDCAPlanning && { NewPDCAPlanning: data.NewPDCAPlanning }),
        ...(data.User?.id && {
          User: { connect: { id: data.User.id } }
        }),
        ...(data.Begeleider?.id && {
          Begeleider: { connect: { id: data.Begeleider.id } }
        }),
        ...(data.StatusID && {
          Status: { connect: { id: data.StatusID } }
        })
      },
      include: {
        User: true,
        Begeleider: true,
        Status: true,
        Melding: true
      }
    });

    return preventief;
  });
}

export async function updateUser(
  id: string,
  data: {
    Name?: string;
    Email?: string;
    MicrosoftId?: string;
    lastLogin?: Date;
    Department?: UserDepartment;
  }
) {
  return await prisma.user.update({
    where: { id },
    data: {
      ...(data.Name && { Name: data.Name }),
      ...(data.Email && { Email: data.Email }),
      ...(data.MicrosoftId && { MicrosoftId: data.MicrosoftId }),
      ...(data.lastLogin && { lastLogin: data.lastLogin.toISOString() }),
      ...(data.Department && { Department: { connect: { id: data.Department } } })
    }
  });
}

export async function updateUserGroup(id: string, data: { groupID: string }) {
  return await prisma.$transaction(async (tx) => {
    const existingConnection = await tx.usersOnPermissionGroups.findUnique({
      where: {
        userId_groupId: {
          userId: id,
          groupId: data.groupID
        }
      }
    });

    if (!existingConnection) {
      return await tx.usersOnPermissionGroups.create({
        data: {
          user: { connect: { id } },
          group: { connect: { id: data.groupID } }
        }
      });
    }
    return existingConnection;
  });
}
