/* eslint-disable no-promise-executor-return */
/* eslint-disable no-return-await */
import logger from '../../../helpers/loggerInstance';
import prisma from '../../prismaClient';

const BATCH_SIZE = 1000;

interface BatchOptions {
  include?: Record<string, any>;
  where?: Record<string, any>;
}

type ProgressCallback = (progress: number) => void;

async function batchFetchData<T>(model: any, options: BatchOptions = {}): Promise<T[]> {
  const allData: T[] = [];
  let skip = 0;
  let hasMoreData = true;

  while (hasMoreData) {
    const batch = await model.findMany({
      ...options,
      take: BATCH_SIZE,
      skip
    });

    if (batch.length === 0) {
      hasMoreData = false;
      break;
    }

    allData.push(...batch);
    skip += BATCH_SIZE;

    // Add a small delay to prevent overwhelming the database
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allData;
}

export async function generateBackupData(onProgress?: ProgressCallback) {
  const startTime = Date.now();
  const totalSteps = 35;
  let currentStep = 0;
  logger.info('[Backup Debug] Starting backup data generation');

  function updateProgress() {
    if (onProgress) {
      currentStep += 1;
      const progress = Math.round((currentStep / totalSteps) * 60);
      onProgress(progress);
      logger.info(`[Backup Debug] Data generation step ${currentStep}/${totalSteps} complete (${progress}%)`);
    }
  }

  try {
    logger.info('[Backup Debug] Fetching large tables in batches');
    // Fetch data in batches for large tables
    const [meldingen, messages, systemLogs, userActivities] = await Promise.all([
      batchFetchData(prisma.melding, {
        include: {
          User: {
            include: {
              Messages: true,
              Settings: true,
              userPermissions: {
                include: {
                  permission: true
                }
              },
              userRoles: {
                include: {
                  role: true
                }
              },
              userGroups: {
                include: {
                  group: true
                }
              }
            }
          },
          Project: {
            include: {
              ProjectLeider: true
            }
          },
          Status: true,
          Actiehouder: true,
          Correctief: {
            include: {
              Status: true,
              User: true
            }
          },
          Preventief: {
            include: {
              Status: true,
              User: true,
              Begeleider: true,
              Melding: true
            }
          },
          Projectleider: {
            include: {
              Project: true
            }
          },
          ChatRoom: {
            include: {
              messages: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      }).then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} meldingen records`);
        updateProgress();
        return result;
      }),
      batchFetchData(prisma.message).then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} messages records`);
        updateProgress();
        return result;
      }),
      batchFetchData(prisma.systemLog).then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} systemLog records`);
        updateProgress();
        return result;
      }),
      batchFetchData(prisma.userActivity).then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} userActivity records`);
        updateProgress();
        return result;
      })
    ]);

    logger.info('[Backup Debug] Fetching smaller tables');
    // Fetch smaller tables normally
    const results = await Promise.all([
      prisma.project
        .findMany({
          include: {
            ProjectLeider: true,
            Melding: {
              include: {
                Status: true,
                User: true
              }
            }
          }
        })
        .then((result) => {
          logger.info(`[Backup Debug] Fetched ${result.length} project records`);
          updateProgress();
          return result;
        }),
      prisma.status.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} status records`);
        updateProgress();
        return result;
      }),
      prisma.projectleider
        .findMany({
          include: {
            Project: true
          }
        })
        .then((result) => {
          logger.info(`[Backup Debug] Fetched ${result.length} projectleider records`);
          updateProgress();
          return result;
        }),
      prisma.settings
        .findMany({
          include: {
            User: true
          }
        })
        .then((result) => {
          logger.info(`[Backup Debug] Fetched ${result.length} settings records`);
          updateProgress();
          return result;
        }),
      prisma.user
        .findMany({
          include: {
            Settings: true,
            Department: true,
            userPermissions: {
              include: {
                permission: true
              }
            },
            userRoles: {
              include: {
                role: true
              }
            },
            userGroups: {
              include: {
                group: true
              }
            },
            Messages: true,
            PreventiefActiehouder: true,
            PreventiefBegeleider: true,
            Permission: true,
            PermissionGroup: true,
            Role: true,
            Correctief: true,
            devices: true,
            loginHistory: true,
            tokens: true,
            loginAttempts: true,
            notifications: true,
            apiKeys: {
              include: {
                usageLogs: true
              }
            }
          }
        })
        .then((result) => {
          logger.info(`[Backup Debug] Fetched ${result.length} user records`);
          updateProgress();
          return result;
        }),
      prisma.chatRoom
        .findMany({
          include: {
            messages: {
              include: {
                user: true
              }
            }
          }
        })
        .then((result) => {
          logger.info(`[Backup Debug] Fetched ${result.length} chatRoom records`);
          updateProgress();
          return result;
        }),
      prisma.permission.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} permission records`);
        updateProgress();
        return result;
      }),
      prisma.role.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} role records`);
        updateProgress();
        return result;
      }),
      prisma.permissionGroup.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} permissionGroup records`);
        updateProgress();
        return result;
      }),
      prisma.volgNummer.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} volgNummer records`);
        updateProgress();
        return result;
      }),
      prisma.emailTracking.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} emailTracking records`);
        updateProgress();
        return result;
      }),
      prisma.permissionLog.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} permissionLog records`);
        updateProgress();
        return result;
      }),
      prisma.preventief
        .findMany({
          include: {
            Melding: {
              include: {
                Project: true,
                Status: true,
                User: true
              }
            },
            User: true,
            Begeleider: true,
            Status: true
          }
        })
        .then((result) => {
          logger.info(`[Backup Debug] Fetched ${result.length} preventief records`);
          updateProgress();
          return result;
        }),
      prisma.correctief
        .findMany({
          include: {
            Status: true,
            User: true,
            Melding: {
              include: {
                Project: true,
                Status: true,
                User: true
              }
            }
          }
        })
        .then((result) => {
          logger.info(`[Backup Debug] Fetched ${result.length} correctief records`);
          updateProgress();
          return result;
        }),
      prisma.notification.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} notification records`);
        updateProgress();
        return result;
      }),
      prisma.gitHubIssue.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} gitHubIssue records`);
        updateProgress();
        return result;
      }),
      prisma.idee.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} idee records`);
        updateProgress();
        return result;
      }),
      prisma.userDevice.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} userDevice records`);
        updateProgress();
        return result;
      }),
      prisma.loginHistory.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} loginHistory records`);
        updateProgress();
        return result;
      }),
      prisma.loginAttempt.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} loginAttempt records`);
        updateProgress();
        return result;
      }),
      prisma.token.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} token records`);
        updateProgress();
        return result;
      }),
      prisma.scheduledTask
        .findMany({
          include: {
            executions: true
          }
        })
        .then((result) => {
          logger.info(`[Backup Debug] Fetched ${result.length} scheduledTask records`);
          updateProgress();
          return result;
        }),
      prisma.taskExecution.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} taskExecution records`);
        updateProgress();
        return result;
      }),
      prisma.api_key
        .findMany({
          include: {
            usageLogs: true
          }
        })
        .then((result) => {
          logger.info(`[Backup Debug] Fetched ${result.length} api_key records`);
          updateProgress();
          return result;
        }),
      prisma.api_key_usage_log.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} api_key_usage_log records`);
        updateProgress();
        return result;
      }),
      prisma.usersOnPermissions.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} usersOnPermissions records`);
        updateProgress();
        return result;
      }),
      prisma.usersOnRoles.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} usersOnRoles records`);
        updateProgress();
        return result;
      }),
      prisma.usersOnPermissionGroups.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} usersOnPermissionGroups records`);
        updateProgress();
        return result;
      }),
      prisma.rolesOnPermissions.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} rolesOnPermissions records`);
        updateProgress();
        return result;
      }),
      prisma.permissionGroupsOnPermissions.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} permissionGroupsOnPermissions records`);
        updateProgress();
        return result;
      }),
      prisma.rolesOnPermissionGroups.findMany().then((result) => {
        logger.info(`[Backup Debug] Fetched ${result.length} rolesOnPermissionGroups records`);
        updateProgress();
        return result;
      })
    ]);

    const [
      projects,
      statuses,
      projectleiders,
      settings,
      users,
      chatRooms,
      permissions,
      roles,
      permissionGroups,
      volgNummers,
      emailTracking,
      permissionLogs,
      preventief,
      correctief,
      notifications,
      githubIssues,
      idees,
      devices,
      loginHistory,
      loginAttempts,
      tokens,
      scheduledTasks,
      taskExecutions,
      apiKeys,
      apiKeyUsageLogs,
      usersOnPermissions,
      usersOnRoles,
      usersOnPermissionGroups,
      rolesOnPermissions,
      permissionGroupsOnPermissions,
      rolesOnPermissionGroups
    ] = results;

    const backupData = {
      meldingen,
      projects,
      statuses,
      projectleiders,
      settings,
      users,
      chatRooms,
      messages,
      permissions,
      roles,
      permissionGroups,
      volgNummers,
      emailTracking,
      permissionLogs,
      systemLogs,
      userActivities,
      preventief,
      correctief,
      notifications,
      githubIssues,
      idees,
      devices,
      loginHistory,
      loginAttempts,
      tokens,
      scheduledTasks,
      taskExecutions,
      apiKeys,
      apiKeyUsageLogs,
      usersOnPermissions,
      usersOnRoles,
      usersOnPermissionGroups,
      rolesOnPermissions,
      permissionGroupsOnPermissions,
      rolesOnPermissionGroups,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        totalRecords: {
          meldingen: meldingen.length,
          projects: projects.length,
          users: users.length,
          messages: messages.length,
          permissions: permissions.length,
          roles: roles.length,
          emailTracking: emailTracking.length,
          statuses: statuses.length,
          projectleiders: projectleiders.length,
          chatRooms: chatRooms.length,
          permissionGroups: permissionGroups.length,
          volgNummers: volgNummers.length,
          permissionLogs: permissionLogs.length,
          systemLogs: systemLogs.length,
          userActivities: userActivities.length,
          scheduledTasks: scheduledTasks.length,
          taskExecutions: taskExecutions.length,
          apiKeys: apiKeys.length,
          apiKeyUsageLogs: apiKeyUsageLogs.length,
          usersOnPermissions: usersOnPermissions.length,
          usersOnRoles: usersOnRoles.length,
          usersOnPermissionGroups: usersOnPermissionGroups.length,
          rolesOnPermissions: rolesOnPermissions.length,
          permissionGroupsOnPermissions: permissionGroupsOnPermissions.length,
          rolesOnPermissionGroups: rolesOnPermissionGroups.length
        }
      }
    };

    const totalTime = Date.now() - startTime;
    logger.info(`[Backup Debug] Data generation completed in ${totalTime}ms`, {
      totalRecords: backupData.metadata.totalRecords
    });

    return backupData;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    logger.error(`[Backup Debug] Data generation failed after ${Date.now() - startTime}ms`, err);
    throw err;
  }
}

export async function createBackupEntry(data: { fileName: string; fileKey: string; size: number; createdBy: string }) {
  return await prisma.backup.create({
    data: {
      fileName: data.fileName,
      fileKey: data.fileKey,
      size: data.size,
      createdBy: data.createdBy,
      createdAt: new Date()
    }
  });
}
