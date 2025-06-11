import prisma from '../prismaClient';

// Map of model names to their Prisma casing
const modelNameToPrismaMap: Record<string, string> = {
  permissiongroup: 'permissionGroup',
  chatroom: 'chatRoom',
  userdevice: 'userDevice',
  loginhistory: 'loginHistory',
  loginattempt: 'loginAttempt',
  githubissue: 'gitHubIssue',
  useractivity: 'userActivity',
  emailtracking: 'emailTracking',
  volgnummer: 'volgNummer',
  systemlog: 'systemLog',
  permissionlog: 'permissionLog',
  api_key: 'apiKey',
  api_key_usage_log: 'apiKeyUsageLog',
  usersonpermissions: 'usersOnPermissions',
  usersonroles: 'usersOnRoles',
  usersonpermissiongroups: 'usersOnPermissionGroups',
  rolesonpermissions: 'rolesOnPermissions',
  permissiongroupsonpermissions: 'permissionGroupsOnPermissions',
  rolesonpermissiongroups: 'rolesOnPermissionGroups',
  projectleider: 'projectleider',
  actiehouder: 'actiehouder',
  melding: 'melding',
  preventief: 'preventief',
  correctief: 'correctief',
  todo: 'todo'
};

// Helper function to get model name
const getModelName = (model: any): string => {
  if (!model) return 'unknown';

  // Try different ways to get the model name
  let modelName = 'unknown';
  if (typeof model === 'object') {
    if (model._name) modelName = model._name;
    else if (model.name) modelName = model.name;
    else if (model.constructor?.name) {
      // Remove 'Client' suffix if it exists (Prisma adds this)
      modelName = model.constructor.name.replace(/Client$/, '');
    }
  }

  // Convert to lowercase for consistent comparison
  const lowercaseModelName = modelName.toLowerCase();

  // Special case handling for projectleider
  if (lowercaseModelName === 'projectleider') {
    return 'projectleider';
  }

  // Return the mapped name if it exists, otherwise return the original
  return modelNameToPrismaMap[lowercaseModelName] || modelName;
};

export interface BackupData {
  metadata: {
    timestamp: string;
    version: string;
    totalRecords: Record<string, number>;
  };
  departments?: any[];
  users?: any[];
  permissions?: any[];
  permissionGroups?: any[];
  roles?: any[];
  settings?: any[];
  projects?: any[];
  projectleiders?: any[];
  actiehouders?: any[];
  statuses?: any[];
  meldingen?: any[];
  preventiefs?: any[];
  correctiefs?: any[];
  chatRooms?: any[];
  messages?: any[];
  todos?: any[];
  notifications?: any[];
  history?: any[];
  permissionLogs?: any[];
  systemLogs?: any[];
  userActivities?: any[];
  emailTracking?: any[];
  githubIssues?: any[];
  volgNummers?: any[];
  idees?: any[];
  devices?: any[];
  loginHistory?: any[];
  tokens?: any[];
  loginAttempts?: any[];
  scheduledTasks?: any[];
  taskExecutions?: any[];
  apiKeys?: any[];
  apiKeyUsageLogs?: any[];
  usersOnPermissions?: any[];
  usersOnRoles?: any[];
  usersOnPermissionGroups?: any[];
  rolesOnPermissions?: any[];
  permissionGroupsOnPermissions?: any[];
  rolesOnPermissionGroups?: any[];
}

// Helper function to get the correct model from transaction context
const getModelFromTx = (modelName: string, tx: any) => {
  const mappedName = modelNameToPrismaMap[modelName.toLowerCase()] || modelName;
  const model = tx[mappedName];
  if (!model) {
    throw new Error(`Model ${modelName} (mapped to ${mappedName}) not found in transaction context`);
  }
  return model;
};

// Add validation function
async function validateRestore(tx: any, backupData: BackupData) {
  const validationResults: Array<{ model: string; expected: number; actual: number }> = [];

  const modelsToValidate = [
    // Core models
    { name: 'user', model: tx.user },
    { name: 'department', model: tx.department },
    { name: 'permission', model: tx.permission },
    { name: 'role', model: tx.role },
    { name: 'permissionGroup', model: tx.permissionGroup },
    { name: 'settings', model: tx.settings },

    // Business models
    { name: 'project', model: tx.project },
    { name: 'projectleider', model: tx.projectleider },
    { name: 'actiehouder', model: tx.actiehouder },
    { name: 'status', model: tx.status },
    { name: 'melding', model: tx.melding },
    { name: 'preventief', model: tx.preventief },
    { name: 'correctief', model: tx.correctief },

    // Communication
    { name: 'chatRoom', model: tx.chatRoom },
    { name: 'message', model: tx.message },
    { name: 'notification', model: tx.notification },

    // Tasks and Tracking
    { name: 'todo', model: tx.todo },
    { name: 'scheduledTask', model: tx.scheduledTask },
    { name: 'taskExecution', model: tx.taskExecution },

    // Logging and History
    { name: 'history', model: tx.history },
    { name: 'permissionLog', model: tx.permissionLog },
    { name: 'systemLog', model: tx.systemLog },
    { name: 'userActivity', model: tx.userActivity },
    { name: 'emailTracking', model: tx.emailTracking },

    // Additional Features
    { name: 'gitHubIssue', model: tx.gitHubIssue },
    { name: 'volgNummer', model: tx.volgNummer },
    { name: 'idee', model: tx.idee },

    // Authentication and Security
    { name: 'userDevice', model: tx.userDevice },
    { name: 'loginHistory', model: tx.loginHistory },
    { name: 'loginAttempt', model: tx.loginAttempt },
    { name: 'token', model: tx.token },
    { name: 'api_key', model: tx.api_key },
    { name: 'api_key_usage_log', model: tx.api_key_usage_log },

    // Junction Tables
    { name: 'usersOnPermissions', model: tx.usersOnPermissions },
    { name: 'usersOnRoles', model: tx.usersOnRoles },
    { name: 'usersOnPermissionGroups', model: tx.usersOnPermissionGroups },
    { name: 'rolesOnPermissions', model: tx.rolesOnPermissions },
    { name: 'permissionGroupsOnPermissions', model: tx.permissionGroupsOnPermissions },
    { name: 'rolesOnPermissionGroups', model: tx.rolesOnPermissionGroups }
  ];

  // Count validation
  for (const { name, model } of modelsToValidate) {
    const actual = await model.count();
    const expected = backupData.metadata.totalRecords[name] || 0;
    validationResults.push({ model: name, expected, actual });
  }

  const discrepancies = validationResults.filter((r) => r.expected !== r.actual);
  if (discrepancies.length > 0) {
    console.log('Validation found count discrepancies:');
    discrepancies.forEach((d) => {
      console.log(`${d.model}: Expected ${d.expected}, got ${d.actual}`);
    });
    return false;
  }

  // Data integrity validation
  try {
    // Validate User relationships
    const userCount = await tx.user.count();
    if (userCount > 0) {
      const userWithRelations = await tx.user.findFirst({
        include: {
          Settings: true,
          userPermissions: true,
          userRoles: true,
          userGroups: true
        }
      });

      if (!userWithRelations) {
        console.log('Warning: Failed to validate user relationships');
        return false;
      }
    }

    // Validate Melding relationships
    const meldingCount = await tx.melding.count();
    if (meldingCount > 0) {
      const meldingWithRelations = await tx.melding.findFirst({
        include: {
          User: true,
          Project: true,
          Status: true,
          Correctief: true,
          Preventief: true
        }
      });

      if (!meldingWithRelations) {
        console.log('Warning: Failed to validate melding relationships');
        return false;
      }
    }

    // Validate custom type data
    const preventiefCount = await tx.preventief.count();
    if (preventiefCount > 0) {
      const preventiefWithCustomTypes = await tx.preventief.findFirst({
        where: {
          OR: [
            { Smart: { not: null } },
            { Steps: { not: null } },
            { Strategie: { not: null } },
            { TodoItems: { not: null } }
          ]
        }
      });

      if (!preventiefWithCustomTypes) {
        console.log('Warning: Failed to validate preventief custom type data');
        return false;
      }
    }

    // Validate junction table relationships
    const junctionTablesValid = await validateJunctionTables(tx);
    if (!junctionTablesValid) {
      console.log('Warning: Failed to validate junction table relationships');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error during data integrity validation:', error);
    return false;
  }
}

async function validateJunctionTables(tx: any) {
  try {
    // Check UsersOnPermissions
    const userPermission = await tx.usersOnPermissions.findFirst({
      include: {
        user: true,
        permission: true
      }
    });
    if (userPermission && (!userPermission.user || !userPermission.permission)) {
      return false;
    }

    // Check UsersOnRoles
    const userRole = await tx.usersOnRoles.findFirst({
      include: {
        user: true,
        role: true
      }
    });
    if (userRole && (!userRole.user || !userRole.role)) {
      return false;
    }

    // Check UsersOnPermissionGroups
    const userGroup = await tx.usersOnPermissionGroups.findFirst({
      include: {
        user: true,
        group: true
      }
    });
    if (userGroup && (!userGroup.user || !userGroup.group)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating junction tables:', error);
    return false;
  }
}

async function handleRelationships(model: any, item: any, createdItem: any, tx: any, relations: any) {
  const modelName = getModelName(model);

  try {
    switch (modelName) {
      case 'User':
      case 'user':
        // Handle devices
        if (item.devices?.length) {
          for (const device of item.devices) {
            await tx.userDevice.create({
              data: {
                ...device,
                user: { connect: { id: createdItem.id } }
              }
            });
          }
        }

        // Handle notifications
        if (item.notifications?.length) {
          await tx.notification.createMany({
            data: item.notifications.map((n: any) => ({
              ...n,
              userId: createdItem.id
            }))
          });
        }

        // Handle todos
        if (item.todos?.length) {
          await tx.todo.createMany({
            data: item.todos.map((t: any) => ({
              ...t,
              userId: createdItem.id
            }))
          });
        }

        if (!item.Settings) delete item.Settings;

        // Handle user relationships (userPermissions, userRoles, userGroups)
        if (item.userPermissions?.length) {
          await tx.usersOnPermissions.createMany({
            data: item.userPermissions.map((up: any) => ({
              id: up.id,
              assignedAt: new Date(up.assignedAt),
              userId: createdItem.id,
              permissionId: up.permissionId
            }))
          });
          item.userPermissions = {
            connect: item.userPermissions.map((up: any) => ({
              id: up.id
            }))
          };
        }
        // Handle userRoles
        if (item.userRoles?.length) {
          await tx.usersOnRoles.createMany({
            data: item.userRoles.map((ur: any) => ({
              id: ur.id,
              userId: createdItem.id,
              roleId: ur.roleId
            }))
          });
          item.userRoles = {
            connect: item.userRoles.map((ur: any) => ({
              id: ur.id
            }))
          };
        }
        // Handle userGroups
        if (item.userGroups?.length) {
          await tx.usersOnPermissionGroups.createMany({
            data: item.userGroups.map((ug: any) => ({
              id: ug.id,
              userId: createdItem.id,
              groupId: ug.groupId
            }))
          });
          item.userGroups = {
            connect: item.userGroups.map((ug: any) => ({
              id: ug.id
            }))
          };
        }
        break;

      case 'preventief':
        // Handle TodoItems (custom type, already part of the model)
        if (item.TodoItems?.length) {
          await tx.preventief.update({
            where: { id: createdItem.id },
            data: { TodoItems: item.TodoItems }
          });
        }
        break;

      case 'chatRoom':
        // Handle messages
        if (item.messages?.length) {
          // First check if messages already exist
          const existingMessages = await tx.message.findMany({
            where: { chatroomId: createdItem.id }
          });

          // Filter out messages that already exist
          const newMessages = item.messages.filter(
            (message: any) => !existingMessages.some((existing: any) => existing.id === message.id)
          );

          if (newMessages.length > 0) {
            await tx.message.createMany({
              data: newMessages.map((message: any) => ({
                ...message,
                chatroomId: createdItem.id
              }))
            });
          }
        }
        break;

      case 'projectleider':
      case 'Projectleider':
        // Remove Project data from projectleider
        delete item.Project;
        delete item.Projects;
        break;

      case 'melding':
      case 'Melding':
        console.log(`\n=== MELDING RELATIONSHIP HANDLING DEBUG ===`);

        // Get the original IDs and data from relations
        const originalIds = relations.originalIds || {};
        const originalData = relations.originalData || {};

        console.log('Available relationships:', {
          hasProject: !!originalData.Project,
          hasCorrectief: !!originalData.Correctief,
          hasPreventief: !!originalData.Preventief,
          hasStatus: !!originalData.Status,
          hasActiehouder: !!originalData.Actiehouder,
          hasUser: !!originalData.User,
          hasProjectleider: !!originalData.Projectleider,
          hasChatRoom: !!originalData.ChatRoom,
          projectId: originalIds.ProjectID,
          correctiefId: originalIds.CorrectiefID,
          preventiefId: originalIds.PreventiefID,
          statusId: originalIds.StatusID,
          actiehouderID: originalIds.ActiehouderID,
          userId: originalIds.UserID,
          projectleiderId: originalIds.projectleiderId,
          chatRoomId: originalIds.ChatRoomId
        });

        // Handle all relationships
        try {
          // Project
          if (originalIds.ProjectID) {
            const exists = await tx.project.findUnique({ where: { id: originalIds.ProjectID } });
            if (exists) {
              await tx.melding.update({
                where: { id: createdItem.id },
                data: { Project: { connect: { id: originalIds.ProjectID } } }
              });
              console.log('✅ Project connection successful:', originalIds.ProjectID);
            }
          }

          // Correctief
          if (originalIds.CorrectiefID) {
            const exists = await tx.correctief.findUnique({ where: { id: originalIds.CorrectiefID } });
            if (exists) {
              await tx.melding.update({
                where: { id: createdItem.id },
                data: { Correctief: { connect: { id: originalIds.CorrectiefID } } }
              });
              console.log('✅ Correctief connection successful:', originalIds.CorrectiefID);
            }
          }

          // Preventief
          if (originalIds.PreventiefID) {
            const exists = await tx.preventief.findUnique({ where: { id: originalIds.PreventiefID } });
            if (exists) {
              await tx.melding.update({
                where: { id: createdItem.id },
                data: { Preventief: { connect: { id: originalIds.PreventiefID } } }
              });
              console.log('✅ Preventief connection successful:', originalIds.PreventiefID);
            }
          }

          // Status
          if (originalIds.StatusID) {
            const exists = await tx.status.findUnique({ where: { id: originalIds.StatusID } });
            if (exists) {
              await tx.melding.update({
                where: { id: createdItem.id },
                data: { Status: { connect: { id: originalIds.StatusID } } }
              });
              console.log('✅ Status connection successful:', originalIds.StatusID);
            }
          }

          // Actiehouder
          if (originalIds.ActiehouderID) {
            const exists = await tx.actiehouder.findUnique({ where: { id: originalIds.ActiehouderID } });
            if (exists) {
              await tx.melding.update({
                where: { id: createdItem.id },
                data: { Actiehouder: { connect: { id: originalIds.ActiehouderID } } }
              });
              console.log('✅ Actiehouder connection successful:', originalIds.ActiehouderID);
            }
          }

          // User
          if (originalIds.UserID) {
            const exists = await tx.user.findUnique({ where: { id: originalIds.UserID } });
            if (exists) {
              await tx.melding.update({
                where: { id: createdItem.id },
                data: { User: { connect: { id: originalIds.UserID } } }
              });
              console.log('✅ User connection successful:', originalIds.UserID);
            }
          }

          // Projectleider
          if (originalIds.projectleiderId) {
            const exists = await tx.projectleider.findUnique({ where: { id: originalIds.projectleiderId } });
            if (exists) {
              await tx.melding.update({
                where: { id: createdItem.id },
                data: { Projectleider: { connect: { id: originalIds.projectleiderId } } }
              });
              console.log('✅ Projectleider connection successful:', originalIds.projectleiderId);
            }
          }

          // ChatRoom
          if (originalIds.ChatRoomId) {
            const exists = await tx.chatRoom.findUnique({ where: { id: originalIds.ChatRoomId } });
            if (exists) {
              await tx.melding.update({
                where: { id: createdItem.id },
                data: { ChatRoom: { connect: { id: originalIds.ChatRoomId } } }
              });
              console.log('✅ ChatRoom connection successful:', originalIds.ChatRoomId);
            }
          }
        } catch (error) {
          console.error('Error handling melding relationships:', error);
        }
        break;

      case 'correctief':
        // Handle Melding connection
        if (item.MeldingID) {
          const meldingExists = await tx.melding.findUnique({
            where: { id: item.MeldingID }
          });

          if (meldingExists) {
            item.Melding = {
              connect: { id: item.MeldingID }
            };
          }
        }

        // Clean up fields
        delete item.MeldingID;
        delete item.Melding;
        break;

      case 'preventief':
        // Handle Melding connection
        if (item.MeldingID) {
          const meldingExists = await tx.melding.findUnique({
            where: { id: item.MeldingID }
          });

          if (meldingExists) {
            item.Melding = {
              connect: { id: item.MeldingID }
            };
          }
        }

        // Clean up fields
        delete item.MeldingID;
        delete item.Melding;
        break;

      case 'message':
        // Check if message already exists
        if (item.id && tx) {
          const existingMessage = await tx.message.findUnique({
            where: { id: item.id }
          });

          if (existingMessage) {
            // If message exists, skip creation
            return;
          }
        }

        // Ensure proper connection to chatroom and user
        if (item.chatroomId) {
          const chatRoomExists = await tx.chatRoom.findUnique({
            where: { id: item.chatroomId }
          });

          if (chatRoomExists) {
            item.chatroom = {
              connect: { id: item.chatroomId }
            };
          }
          delete item.chatroomId;
        }

        if (item.userId) {
          const userExists = await tx.user.findUnique({
            where: { id: item.userId }
          });

          if (userExists) {
            item.user = {
              connect: { id: item.userId }
            };
          }
          delete item.userId;
        }

        // Clean up any unnecessary fields
        delete item.user;
        delete item.chatroom;
        break;

      case 'scheduledTask':
      case 'ScheduledTask':
        // Handle executions
        if (item.executions?.length) {
          for (const execution of item.executions) {
            await tx.taskExecution.create({
              data: {
                ...execution,
                task: {
                  connect: { id: createdItem.id }
                },
                startTime: new Date(execution.startTime),
                endTime: execution.endTime ? new Date(execution.endTime) : null,
                createdAt: execution.createdAt ? new Date(execution.createdAt) : new Date(),
                updatedAt: execution.updatedAt ? new Date(execution.updatedAt) : new Date()
              }
            });
          }
        }
        break;
    }
  } catch (error) {
    console.error(`Error handling relationships for ${modelName}:`, error);
    throw error;
  }
}

interface SystemLogData {
  action: string;
  resourceType: string;
  success: boolean;
  metadata?: any;
  timestamp?: string | Date;
  [key: string]: any;
}

async function transformSystemLog(data: SystemLogData) {
  // Basic validation
  if (!data.action || !data.resourceType || typeof data.success !== 'boolean') {
    throw new Error('Invalid SystemLog data');
  }

  const transformed: SystemLogData = {
    action: data.action,
    resourceType: data.resourceType,
    success: data.success
  };

  // Handle metadata
  if (data.metadata) {
    try {
      transformed.metadata = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata;
    } catch (e) {
      transformed.metadata = {};
    }
  }

  // Handle timestamp
  if (data.timestamp) {
    const timestamp = new Date(data.timestamp);
    transformed.timestamp = isNaN(timestamp.getTime()) ? new Date() : timestamp;
  } else {
    transformed.timestamp = new Date();
  }

  // Copy other fields
  Object.keys(data).forEach((key) => {
    if (key !== 'metadata' && key !== 'timestamp' && data[key] != null) {
      transformed[key] = data[key];
    }
  });

  return transformed;
}

async function transformData(item: any, model: any, options?: { checkDepartments?: boolean; tx?: any }) {
  const modelName = getModelName(model);
  const relations: any = {};

  // Special handling for Todo model
  if (modelName.toLowerCase() === 'todo') {
    const transformed = { ...item };

    // Handle required fields
    if (!transformed.message) {
      console.log(
        `Todo ${transformed.id} missing required message field, skipping. Is possible that this is a Correctief record mistakenly being restored as a Todo`
      );
      return { transformed: null, relations: {}, useUpsert: false };
    }

    // Handle User connection
    if (transformed.userId) {
      const userExists = await options?.tx?.user.findUnique({
        where: { id: transformed.userId }
      });

      if (userExists) {
        transformed.user = {
          connect: { id: transformed.userId }
        };
      } else {
        console.log(`User ${transformed.userId} not found for todo ${transformed.id}, skipping todo`);
        return { transformed: null, relations: {}, useUpsert: false };
      }
    } else {
      console.log(`No userId found for todo ${transformed.id}, skipping todo`);
      return { transformed: null, relations: {}, useUpsert: false };
    }

    // Convert dates
    if (transformed.createdAt) {
      transformed.createdAt = new Date(transformed.createdAt);
    }
    if (transformed.completedAt) {
      transformed.completedAt = new Date(transformed.completedAt);
    }

    // Clean up unnecessary fields
    delete transformed.user;

    return { transformed, relations: {}, useUpsert: false };
  }

  // Special handling for SystemLog
  if (modelName === 'systemLog') {
    const transformed = await transformSystemLog(item);
    return { transformed, relations };
  }

  // Special handling for Message model
  if (modelName.toLowerCase() === 'message') {
    const transformed = { ...item };
    const messageId = transformed.id; // Store the id for the where clause
    delete transformed.id; // Remove id from the data object

    // Ensure proper connection to chatroom and user
    if (transformed.chatroomId) {
      const chatRoomExists = await options?.tx?.chatRoom.findUnique({
        where: { id: transformed.chatroomId }
      });

      if (chatRoomExists) {
        transformed.chatroom = {
          connect: { id: transformed.chatroomId }
        };
      } else {
        console.log(`ChatRoom ${transformed.chatroomId} not found for message ${messageId}, skipping message`);
        return { transformed: null, relations: {}, useUpsert: true };
      }
    } else {
      console.log(`No chatroomId found for message ${messageId}, skipping message`);
      return { transformed: null, relations: {}, useUpsert: true };
    }

    if (transformed.userId) {
      const userExists = await options?.tx?.user.findUnique({
        where: { id: transformed.userId }
      });

      if (userExists) {
        transformed.user = {
          connect: { id: transformed.userId }
        };
      } else {
        console.log(`User ${transformed.userId} not found for message ${messageId}, skipping message`);
        return { transformed: null, relations: {}, useUpsert: true };
      }
    } else {
      console.log(`No userId found for message ${messageId}, skipping message`);
      return { transformed: null, relations: {}, useUpsert: true };
    }

    // Convert dates
    if (transformed.createdAt) {
      transformed.createdAt = new Date(transformed.createdAt);
    }
    if (transformed.updatedAt) {
      transformed.updatedAt = new Date(transformed.updatedAt);
    }

    // Clean up any unnecessary fields
    delete transformed.chatroomId;
    delete transformed.userId;

    // Return with upsert flag and original id for where clause
    return { transformed, relations, useUpsert: true, id: messageId };
  }

  // Special handling for Correctief model
  if (modelName.toLowerCase() === 'correctief') {
    const transformed = { ...item };

    // Convert Deadline to string format if it's a date
    if (transformed.Deadline && transformed.Deadline instanceof Date) {
      transformed.Deadline = transformed.Deadline.toISOString();
    } else if (transformed.Deadline) {
      // If it's already a string or something else, ensure it's a string
      transformed.Deadline = String(transformed.Deadline);
    }

    // Handle Status connection
    if (transformed.StatusID) {
      const statusExists = await options?.tx?.status.findUnique({
        where: { id: transformed.StatusID }
      });

      if (statusExists) {
        transformed.Status = {
          connect: { id: transformed.StatusID }
        };
      }
    }

    // Handle User connection
    if (transformed.userId) {
      const userExists = await options?.tx?.user.findUnique({
        where: { id: transformed.userId }
      });

      if (userExists) {
        transformed.User = {
          connect: { id: transformed.userId }
        };
      }
    }

    // Clean up unnecessary fields
    delete transformed.Status;
    delete transformed.User;
    delete transformed.Melding; // Remove the Melding array as it's a relation

    // Convert dates
    if (transformed.CreatedAt) {
      transformed.CreatedAt = new Date(transformed.CreatedAt);
    }
    if (transformed.UpdatedAt) {
      transformed.UpdatedAt = new Date(transformed.UpdatedAt);
    }

    return { transformed, relations: {}, useUpsert: false };
  }

  // Special handling for TaskExecution model
  if (modelName.toLowerCase() === 'taskexecution') {
    const transformed = { ...item };

    // Handle required startTime field
    if (!transformed.startTime) {
      transformed.startTime = transformed.createdAt || new Date();
    }

    // Convert dates
    transformed.startTime = new Date(transformed.startTime);
    if (transformed.endTime) transformed.endTime = new Date(transformed.endTime);
    if (transformed.createdAt) transformed.createdAt = new Date(transformed.createdAt);
    if (transformed.updatedAt) transformed.updatedAt = new Date(transformed.updatedAt);

    // Handle task relation
    if (transformed.taskId) {
      transformed.task = {
        connect: { id: transformed.taskId }
      };
    }

    // Clean up unnecessary fields
    delete transformed.task;

    return { transformed, relations: {} };
  }

  // Special handling for ScheduledTask model
  if (modelName.toLowerCase() === 'scheduledtask') {
    const transformed = { ...item };

    // Convert dates
    if (transformed.lastRun) transformed.lastRun = new Date(transformed.lastRun);
    if (transformed.nextRun) transformed.nextRun = new Date(transformed.nextRun);
    if (transformed.createdAt) transformed.createdAt = new Date(transformed.createdAt);
    if (transformed.updatedAt) transformed.updatedAt = new Date(transformed.updatedAt);

    // Store executions for later handling if they exist
    if (transformed.executions?.length) {
      relations.executions = transformed.executions;
    }

    // Remove executions from the main object as it needs to be handled separately
    delete transformed.executions;

    return { transformed, relations };
  }

  // Regular transformation for other models
  let transformed = { ...item };

  // Store relations separately
  if (transformed.userPermissions) {
    relations.userPermissions = transformed.userPermissions;
    delete transformed.userPermissions;
  }
  if (transformed.userRoles) {
    relations.userRoles = transformed.userRoles;
    delete transformed.userRoles;
  }
  if (transformed.userGroups) {
    relations.userGroups = transformed.userGroups;
    delete transformed.userGroups;
  }
  if (transformed.devices) {
    relations.devices = transformed.devices;
    delete transformed.devices;
  }
  if (transformed.Messages) {
    relations.Messages = transformed.Messages;
    delete transformed.Messages;
  }
  if (transformed.PreventiefActiehouder) {
    relations.PreventiefActiehouder = transformed.PreventiefActiehouder;
    delete transformed.PreventiefActiehouder;
  }
  if (transformed.PreventiefBegeleider) {
    relations.PreventiefBegeleider = transformed.PreventiefBegeleider;
    delete transformed.PreventiefBegeleider;
  }
  if (transformed.Correctief) {
    relations.Correctief = transformed.Correctief;
    delete transformed.Correctief;
  }
  if (transformed.loginHistory) {
    relations.loginHistory = transformed.loginHistory;
    delete transformed.loginHistory;
  }
  if (transformed.tokens) {
    relations.tokens = transformed.tokens;
    delete transformed.tokens;
  }
  if (transformed.notifications) {
    relations.notifications = transformed.notifications;
    delete transformed.notifications;
  }
  if (transformed.todos) {
    relations.todos = transformed.todos;
    delete transformed.todos;
  }
  if (transformed.apiKeys) {
    relations.apiKeys = transformed.apiKeys;
    delete transformed.apiKeys;
  }

  // Handle basic relations
  if (modelName === 'user') {
    // Department relationship
    if (transformed.departmentId) {
      delete transformed.Department;
      transformed.Department = { connect: { id: transformed.departmentId } };
      delete transformed.departmentId;
    } else if (transformed.Department?.id) {
      const deptId = transformed.Department.id;
      delete transformed.Department;
      transformed.Department = { connect: { id: deptId } };
    }

    // Clean up any remaining department-related fields
    delete transformed.Permission;
    delete transformed.PermissionGroup;
    delete transformed.Role;
    delete transformed.loginAttempts;
  } else if (modelName === 'project' || modelName === 'Project') {
    // Handle ProjectLeider relationship
    if (transformed.ProjectleiderId) {
      // Verify projectleider exists before connecting
      const projectleiderExists = await options?.tx?.projectleider.findUnique({
        where: { id: transformed.ProjectleiderId }
      });

      console.log('Checking projectleider:', transformed.ProjectleiderId);
      console.log('Projectleider exists:', projectleiderExists);

      if (projectleiderExists) {
        transformed.ProjectLeider = {
          connect: { id: transformed.ProjectleiderId }
        };
      } else {
        console.log(`Projectleider ${transformed.ProjectleiderId} not found, skipping connection`);
      }
    }

    // Clean up fields that shouldn't be in create payload
    delete transformed.ProjectleiderId;
    delete transformed.ProjectLeider;
    delete transformed.Melding;

    // Convert dates
    if (transformed.StartDate) transformed.StartDate = new Date(transformed.StartDate);
    if (transformed.EndDate) transformed.EndDate = new Date(transformed.EndDate);
  } else if (modelName === 'projectleider' || modelName === 'Projectleider') {
    // Remove Project data from projectleider
    delete transformed.Project;
    delete transformed.Projects;
  } else if (modelName === 'melding' || modelName === 'Melding') {
    console.log(`\n=== MELDING TRANSFORM DEBUG ===`);

    // Store original IDs in relations for later use
    relations.originalIds = {
      ProjectID: transformed.ProjectID,
      CorrectiefID: transformed.CorrectiefID,
      PreventiefID: transformed.PreventiefID,
      StatusID: transformed.StatusID,
      ActiehouderID: transformed.ActiehouderID,
      UserID: transformed.UserID,
      projectleiderId: transformed.projectleiderId,
      ChatRoomId: transformed.ChatRoomId
    };

    // Log all nested relationships
    if (item.Project) {
      console.log('Has nested Project:', {
        id: item.Project.id,
        name: item.Project.ProjectNaam
      });
    }
    if (item.Correctief) {
      console.log('Has nested Correctief:', {
        id: item.Correctief.id,
        deadline: item.Correctief.Deadline
      });
    }
    if (item.Preventief) {
      console.log('Has nested Preventief:', {
        id: item.Preventief.id
      });
    }
    if (item.Status) {
      console.log('Has nested Status:', {
        id: item.Status.id,
        name: item.Status.StatusNaam
      });
    }
    if (item.User) {
      console.log('Has nested User:', {
        id: item.User.id,
        name: item.User.Name
      });
    }
    if (item.Actiehouder) {
      console.log('Has nested Actiehouder:', {
        id: item.Actiehouder.id,
        name: item.Actiehouder.Name
      });
    }
    if (item.Projectleider) {
      console.log('Has nested Projectleider:', {
        id: item.Projectleider.id,
        name: item.Projectleider.Name
      });
    }
    if (item.ChatRoom) {
      console.log('Has nested ChatRoom:', {
        id: item.ChatRoom.id
      });
    }

    // Prepare connect objects for all relationships
    const connectData: any = {};

    // Project connection
    if (transformed.ProjectID) {
      const projectExists = await options?.tx?.project.findUnique({
        where: { id: transformed.ProjectID }
      });
      if (projectExists) {
        connectData.Project = { connect: { id: transformed.ProjectID } };
        console.log('✅ Project connection prepared:', transformed.ProjectID);
      }
    }

    // Correctief connection
    if (transformed.CorrectiefID) {
      const correctiefExists = await options?.tx?.correctief.findUnique({
        where: { id: transformed.CorrectiefID }
      });
      if (correctiefExists) {
        connectData.Correctief = { connect: { id: transformed.CorrectiefID } };
        console.log('✅ Correctief connection prepared:', transformed.CorrectiefID);
      }
    }

    // Preventief connection
    if (transformed.PreventiefID) {
      const preventiefExists = await options?.tx?.preventief.findUnique({
        where: { id: transformed.PreventiefID }
      });
      if (preventiefExists) {
        connectData.Preventief = { connect: { id: transformed.PreventiefID } };
        console.log('✅ Preventief connection prepared:', transformed.PreventiefID);
      }
    }

    // Status connection
    if (transformed.StatusID) {
      const statusExists = await options?.tx?.status.findUnique({
        where: { id: transformed.StatusID }
      });
      if (statusExists) {
        connectData.Status = { connect: { id: transformed.StatusID } };
        console.log('✅ Status connection prepared:', transformed.StatusID);
      }
    }

    // User connection
    if (transformed.UserID) {
      const userExists = await options?.tx?.user.findUnique({
        where: { id: transformed.UserID }
      });
      if (userExists) {
        connectData.User = { connect: { id: transformed.UserID } };
        console.log('✅ User connection prepared:', transformed.UserID);
      }
    }

    // Actiehouder connection
    if (transformed.ActiehouderID) {
      const actiehouderExists = await options?.tx?.actiehouder.findUnique({
        where: { id: transformed.ActiehouderID }
      });
      if (actiehouderExists) {
        connectData.Actiehouder = { connect: { id: transformed.ActiehouderID } };
        console.log('✅ Actiehouder connection prepared:', transformed.ActiehouderID);
      }
    }

    // Projectleider connection
    if (transformed.projectleiderId) {
      const projectleiderExists = await options?.tx?.projectleider.findUnique({
        where: { id: transformed.projectleiderId }
      });
      if (projectleiderExists) {
        connectData.Projectleider = { connect: { id: transformed.projectleiderId } };
        console.log('✅ Projectleider connection prepared:', transformed.projectleiderId);
      }
    }

    // ChatRoom connection
    if (transformed.ChatRoomId) {
      const chatRoomExists = await options?.tx?.chatRoom.findUnique({
        where: { id: transformed.ChatRoomId }
      });
      if (chatRoomExists) {
        connectData.ChatRoom = { connect: { id: transformed.ChatRoomId } };
        console.log('✅ ChatRoom connection prepared:', transformed.ChatRoomId);
      }
    }

    // Merge the connect data with the transformed data
    transformed = {
      ...transformed,
      ...connectData
    };

    // Store the original data for relationship handling
    relations.originalData = {
      Project: item.Project,
      Correctief: item.Correctief,
      Preventief: item.Preventief,
      Status: item.Status,
      User: item.User,
      Actiehouder: item.Actiehouder,
      Projectleider: item.Projectleider,
      ChatRoom: item.ChatRoom
    };

    // Clean up fields that shouldn't be in create payload
    console.log('\nCleaning up fields...');
    const fieldsToClean = [
      'ProjectID',
      'UserID',
      'ActiehouderID',
      'StatusID',
      'CorrectiefID',
      'PreventiefID',
      'Project',
      'Status',
      'User',
      'Actiehouder',
      'Correctief',
      'Preventief',
      'projectleiderId',
      'Projectleider',
      'ChatRoom',
      'ChatRoomId'
    ];

    fieldsToClean.forEach((field) => {
      if (transformed[field] !== undefined) {
        delete transformed[field];
      }
    });

    console.log('=== Finished processing Melding ===\n');
  } else if (modelName === 'correctief') {
    // Handle Melding connection
    if (transformed.MeldingID) {
      const meldingExists = await options?.tx?.melding.findUnique({
        where: { id: transformed.MeldingID }
      });

      if (meldingExists) {
        transformed.Melding = {
          connect: { id: transformed.MeldingID }
        };
      }
    }

    // Clean up fields
    delete transformed.MeldingID;
    delete transformed.Melding;
  } else if (modelName === 'preventief') {
    // Handle Melding connection
    if (transformed.MeldingID) {
      const meldingExists = await options?.tx?.melding.findUnique({
        where: { id: transformed.MeldingID }
      });

      if (meldingExists) {
        transformed.Melding = {
          connect: { id: transformed.MeldingID }
        };
      }
    }

    // Clean up fields
    delete transformed.MeldingID;
    delete transformed.Melding;
  } else if (modelName === 'chatRoom') {
    // Store messages for later handling
    if (transformed.messages?.length) {
      relations.messages = transformed.messages.map((message: any) => ({
        id: message.id,
        content: message.content,
        userId: message.userId || message.user?.id,
        createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
        updatedAt: message.updatedAt ? new Date(message.updatedAt) : undefined
      }));
    }

    // Check if a ChatRoom already exists for this meldingId
    if (transformed.meldingId && options?.tx) {
      const existingChatRoom = await options.tx.chatRoom.findUnique({
        where: { meldingId: transformed.meldingId }
      });

      if (existingChatRoom) {
        // If it exists, we'll update it instead of creating a new one
        transformed.id = existingChatRoom.id;
      }
    }

    // Clean up fields
    delete transformed.messages;
  } else if (modelName === 'message') {
    // Ensure proper connection to chatroom and user
    if (transformed.chatroomId) {
      const chatRoomExists = await options?.tx?.chatRoom.findUnique({
        where: { id: transformed.chatroomId }
      });

      if (chatRoomExists) {
        transformed.chatroom = {
          connect: { id: transformed.chatroomId }
        };
      }
      delete transformed.chatroomId;
    }

    if (transformed.userId) {
      const userExists = await options?.tx?.user.findUnique({
        where: { id: transformed.userId }
      });

      if (userExists) {
        transformed.user = {
          connect: { id: transformed.userId }
        };
      }
      delete transformed.userId;
    }

    // Clean up any unnecessary fields
    delete transformed.user;
    delete transformed.chatroom;

    // Return the transformed data with a flag indicating it needs upsert
    return { transformed, relations, useUpsert: true };
  } else if (modelName === 'usersOnPermissionGroups') {
    if (!transformed.userId || !transformed.groupId) {
      console.log('Skipping invalid usersOnPermissionGroups record - missing required fields');
      return { transformed: null, relations: {}, useUpsert: false };
    }
    return {
      transformed: {
        userId: transformed.userId,
        groupId: transformed.groupId,
        assignedAt: new Date(transformed.assignedAt)
      },
      relations: {},
      useUpsert: true,
      compoundKey: {
        userId_groupId: {
          userId: transformed.userId,
          groupId: transformed.groupId
        }
      }
    };
  } else if (modelName === 'rolesOnPermissions') {
    // ... existing code ...
  }

  // Convert common dates
  if (transformed.CreatedAt) transformed.CreatedAt = new Date(transformed.CreatedAt);
  if (transformed.UpdatedAt) transformed.UpdatedAt = new Date(transformed.UpdatedAt);
  if (transformed.lastLogin) transformed.lastLogin = new Date(transformed.lastLogin);
  if (transformed.Deadline) transformed.Deadline = new Date(transformed.Deadline);

  return { transformed, relations };
}

export const restoreBackup = async (backupData: BackupData, onProgress: (progress: number) => void) => {
  const totalSteps = 35; // Total number of operations
  let currentStep = 0;

  const updateProgress = () => {
    currentStep++;
    const progress = Math.floor((currentStep / totalSteps) * 100);
    onProgress(Math.min(progress, 99)); // Never reach 100 until completely done
  };

  // Validate backup data structure
  if (!backupData) {
    console.log(backupData);
    throw new Error('Invalid backup data structure: Missing backup data');
  } else if (!backupData.metadata) {
    console.log(backupData);
    throw new Error('Invalid backup data structure: Missing metadata');
  }

  // Initialize empty arrays for missing data to prevent undefined errors
  const safeData = {
    departments: [],
    users: [],
    permissions: [],
    permissionGroups: [],
    roles: [],
    settings: [],
    projects: [],
    projectleiders: [],
    actiehouders: [],
    statuses: [],
    meldingen: [],
    preventiefs: [],
    correctiefs: [],
    chatRooms: [],
    messages: [],
    todos: [],
    notifications: [],
    history: [],
    permissionLogs: [],
    systemLogs: [],
    userActivities: [],
    emailTracking: [],
    githubIssues: [],
    volgNummers: [],
    idees: [],
    devices: [],
    loginHistory: [],
    tokens: [],
    loginAttempts: [],
    usersOnPermissions: [],
    usersOnRoles: [],
    usersOnPermissionGroups: [],
    rolesOnPermissions: [],
    permissionGroupsOnPermissions: [],
    rolesOnPermissionGroups: [],
    scheduledTasks: [],
    taskExecutions: [],
    apiKeys: [],
    apiKeyUsageLogs: [],
    ...backupData
  };

  // Helper function to restore data with original IDs
  const restoreWithIds = async (model: any, data: any[], options?: { checkDepartments?: boolean; tx?: any }) => {
    if (!data || data.length === 0) return;

    const modelName = getModelName(model);
    console.log(`Starting restore of ${modelName} with ${data.length} items`);

    // Add logging for melding data
    if (modelName.toLowerCase() === 'melding') {
      console.log('\n=== MELDING RESTORATION DEBUG ===');
    }

    // Special handling for system logs - use batch processing
    if (modelName === 'systemLog') {
      try {
        const batchSize = 2500;
        const validLogs = [];
        console.log(`Processing ${data.length} SystemLog entries in batches of ${batchSize}`);

        // Process all logs first
        for (const log of data) {
          try {
            const transformedLog = await transformSystemLog(log);

            // Basic required field validation
            if (!transformedLog.action || !transformedLog.resourceType || typeof transformedLog.success !== 'boolean') {
              console.log('Skipping invalid log - missing required fields');
              continue;
            }

            // Clean metadata
            if (transformedLog.metadata) {
              try {
                transformedLog.metadata =
                  typeof transformedLog.metadata === 'string'
                    ? JSON.parse(transformedLog.metadata)
                    : transformedLog.metadata;
              } catch (e) {
                transformedLog.metadata = {};
              }
            }

            // Handle timestamp
            if (transformedLog.timestamp) {
              const timestamp = new Date(transformedLog.timestamp);
              transformedLog.timestamp = isNaN(timestamp.getTime()) ? new Date() : timestamp;
            } else {
              transformedLog.timestamp = new Date();
            }

            // Clean undefined/null
            Object.keys(transformedLog).forEach((key) => {
              if (transformedLog[key] === undefined || transformedLog[key] === null) {
                delete transformedLog[key];
              }
            });

            validLogs.push(transformedLog);
          } catch (error) {
            console.log('Failed to transform log:', error);
            continue; // Skip invalid logs
          }
        }

        console.log(`Validated ${validLogs.length} SystemLog entries, processing in batches...`);

        // Process in batches with improved error handling
        for (let i = 0; i < validLogs.length; i += batchSize) {
          const batch = validLogs.slice(i, i + batchSize);
          try {
            await options?.tx?.systemLog.createMany({
              data: batch
            });
            console.log(
              `Created SystemLog batch ${i / batchSize + 1}/${Math.ceil(validLogs.length / batchSize)} (${batch.length} entries)`
            );
          } catch (error: any) {
            if (error.code === 'P2002') {
              console.log(`Batch ${i / batchSize + 1} had duplicates, processing individually...`);
              for (const log of batch) {
                try {
                  await options?.tx?.systemLog.upsert({
                    where: { id: log.id || 'temp-id' },
                    create: log,
                    update: log
                  });
                } catch (createError: any) {
                  if (createError.code === 'P2002') {
                    console.log(`Skipping duplicate log ${log.id}`);
                    continue;
                  }
                  console.log(`Failed to create SystemLog:`, createError.message);
                }
              }
            } else if (error.code === 'P2028') {
              throw error; // Transaction timeout, throw to trigger retry
            } else {
              console.log(`Error processing batch ${i / batchSize + 1}:`, error);
              // Try individual records
              for (const log of batch) {
                try {
                  await options?.tx?.systemLog.create({
                    data: log
                  });
                } catch (createError: any) {
                  if (createError.code !== 'P2002') {
                    console.log(`Failed to create SystemLog:`, createError.message);
                  }
                }
              }
            }
          }
        }
        return; // Exit after handling system logs
      } catch (error: any) {
        if (error.code === 'P2028') {
          throw error; // Re-throw transaction timeout errors
        }
        console.error('SystemLog batch processing failed:', error);
        throw error;
      }
    }

    // Special handling for junction tables
    if (
      modelName.toLowerCase() === 'usersonpermissions' ||
      modelName.toLowerCase() === 'usersonroles' ||
      modelName.toLowerCase() === 'usersonpermissiongroups' ||
      modelName.toLowerCase() === 'rolesonpermissions' ||
      modelName.toLowerCase() === 'permissiongroupsonpermissions' ||
      modelName.toLowerCase() === 'rolesonpermissiongroups'
    ) {
      console.log(`Validating foreign keys for ${modelName}...`);

      // Filter out items with invalid foreign keys
      const validItems = [];
      for (const item of data) {
        try {
          let isValid = false;

          switch (modelName.toLowerCase()) {
            case 'usersonpermissions':
              const [userExists1, permExists1] = await Promise.all([
                options?.tx?.user.findUnique({ where: { id: item.userId } }),
                options?.tx?.permission.findUnique({ where: { id: item.permissionId } })
              ]);
              isValid = !!userExists1 && !!permExists1;
              if (!isValid) {
                console.log(
                  `Skipping usersOnPermissions due to missing: User: ${!!userExists1}, Permission: ${!!permExists1}`
                );
              }
              break;

            case 'usersonroles':
              const [userExists2, roleExists1] = await Promise.all([
                options?.tx?.user.findUnique({ where: { id: item.userId } }),
                options?.tx?.role.findUnique({ where: { id: item.roleId } })
              ]);
              isValid = !!userExists2 && !!roleExists1;
              if (!isValid) {
                console.log(`Skipping usersOnRoles due to missing: User: ${!!userExists2}, Role: ${!!roleExists1}`);
              }
              break;

            case 'usersonpermissiongroups':
              const [userExists3, groupExists1] = await Promise.all([
                options?.tx?.user.findUnique({ where: { id: item.userId } }),
                options?.tx?.permissionGroup.findUnique({ where: { id: item.groupId } })
              ]);
              isValid = !!userExists3 && !!groupExists1;
              if (!isValid) {
                console.log(
                  `Skipping usersOnPermissionGroups due to missing: User: ${!!userExists3}, Group: ${!!groupExists1}`
                );
              }
              break;

            case 'rolesonpermissions':
              const [roleExists2, permExists2] = await Promise.all([
                options?.tx?.role.findUnique({ where: { id: item.roleId } }),
                options?.tx?.permission.findUnique({ where: { id: item.permissionId } })
              ]);
              isValid = !!roleExists2 && !!permExists2;
              if (!isValid) {
                console.log(
                  `Skipping rolesOnPermissions due to missing: Role: ${!!roleExists2}, Permission: ${!!permExists2}`
                );
              }
              break;

            case 'permissiongroupsonpermissions':
              const [groupExists2, permExists3] = await Promise.all([
                options?.tx?.permissionGroup.findUnique({ where: { id: item.groupId } }),
                options?.tx?.permission.findUnique({ where: { id: item.permissionId } })
              ]);
              isValid = !!groupExists2 && !!permExists3;
              if (!isValid) {
                console.log(
                  `Skipping permissionGroupsOnPermissions due to missing: Group: ${!!groupExists2}, Permission: ${!!permExists3}`
                );
              }
              break;

            case 'rolesonpermissiongroups':
              const [roleExists3, groupExists3] = await Promise.all([
                options?.tx?.role.findUnique({ where: { id: item.roleId } }),
                options?.tx?.permissionGroup.findUnique({ where: { id: item.groupId } })
              ]);
              isValid = !!roleExists3 && !!groupExists3;
              if (!isValid) {
                console.log(
                  `Skipping rolesOnPermissionGroups due to missing: Role: ${!!roleExists3}, Group: ${!!groupExists3}`
                );
              }
              break;
          }

          if (isValid) {
            validItems.push(item);
          }
        } catch (error) {
          console.error(`Error checking foreign keys for ${modelName}:`, error);
          continue;
        }
      }

      console.log(`Found ${validItems.length} valid items out of ${data.length} for ${modelName}`);
      data = validItems;
    }

    // Regular handling for other models
    for (const item of data) {
      try {
        if (modelName === 'department') {
          const createdDepartment = await model.create({
            data: {
              id: item.id,
              name: item.name,
              description: item.description,
              createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined
            }
          });
          console.log('Created department:', JSON.stringify(createdDepartment, null, 2));
        } else if (modelName === 'User' || modelName === 'user') {
          // Create base user data
          const createData: any = {
            id: item.id,
            Email: item.Email,
            Name: item.Name,
            MicrosoftId: item.MicrosoftId,
            lastLogin: item.lastLogin ? new Date(item.lastLogin) : undefined,
            CreatedAt: item.CreatedAt ? new Date(item.CreatedAt) : undefined,
            UpdatedAt: item.UpdatedAt ? new Date(item.UpdatedAt) : undefined
          };

          // Handle Department connection
          if (item.departmentId || item.Department?.id) {
            const departmentId = item.departmentId || item.Department?.id;
            // Verify department exists before connecting
            const departmentExists = await options?.tx?.department.findUnique({
              where: { id: departmentId }
            });

            console.log('Checking department:', departmentId);
            console.log('Department exists:', departmentExists);

            if (departmentExists) {
              createData.Department = {
                connect: { id: departmentId }
              };
            } else {
              console.log(`Department ${departmentId} not found, skipping connection`);
            }
          }

          // Only include Settings if it exists in the original data
          if (item.Settings) {
            createData.Settings = item.Settings;
          }

          console.log('Create data for user:', JSON.stringify(createData, null, 2));
          const createdUser = await model.create({ data: createData });
          console.log('Created user:', JSON.stringify(createdUser, null, 2));

          // Handle relationships after user creation
          if (options?.tx) {
            // Handle devices
            if (item.devices?.length) {
              await options.tx.userDevice.createMany({
                data: item.devices.map((device: any) => ({
                  ...device,
                  userId: createdUser.id
                }))
              });
            }

            // Handle userPermissions
            if (item.userPermissions?.length) {
              await options.tx.usersOnPermissions.createMany({
                data: item.userPermissions.map((up: any) => ({
                  id: up.id,
                  userId: createdUser.id,
                  permissionId: up.permissionId,
                  assignedAt: new Date(up.assignedAt)
                }))
              });
            }

            // Handle userGroups
            if (item.userGroups?.length) {
              await options.tx.usersOnPermissionGroups.createMany({
                data: item.userGroups.map((ug: any) => ({
                  id: ug.id,
                  userId: createdUser.id,
                  groupId: ug.groupId,
                  assignedAt: new Date(ug.assignedAt)
                }))
              });
            }

            // Handle Correctief
            if (item.Correctief?.length) {
              await options.tx.correctief.createMany({
                data: item.Correctief.map((c: any) => ({
                  ...c,
                  userId: createdUser.id
                }))
              });
            }

            // Handle PreventiefActiehouder
            if (item.PreventiefActiehouder?.length) {
              for (const preventief of item.PreventiefActiehouder) {
                await options.tx.preventief.create({
                  data: {
                    ...preventief,
                    ActiehouderID: createdUser.id,
                    Teamleden: preventief.Teamleden,
                    Smart: preventief.Smart,
                    Steps: preventief.Steps,
                    Strategie: preventief.Strategie,
                    TodoItems: preventief.TodoItems
                  }
                });
              }
            }
          }
        } else {
          const { transformed, relations, useUpsert, id } = await transformData(item, model, options);
          if (transformed) {
            try {
              if (!options?.tx) {
                throw new Error('Transaction context missing');
              }

              const txModel = getModelFromTx(modelName, options.tx);
              console.log(`Processing ${modelName} ${id || transformed.id}`);

              let createdItem;
              if (modelName === 'userDevice') {
                // Special handling for userDevice using deviceId as unique identifier
                console.log(`Processing userDevice with deviceId ${transformed.deviceId}`);
                try {
                  const { id, ...dataWithoutId } = transformed; // Remove id from the data
                  createdItem = await txModel.upsert({
                    where: { deviceId: transformed.deviceId },
                    update: {
                      ...dataWithoutId,
                      lastActive: new Date(dataWithoutId.lastActive),
                      createdAt: new Date(dataWithoutId.createdAt),
                      updatedAt: new Date(dataWithoutId.updatedAt)
                    },
                    create: {
                      ...dataWithoutId,
                      lastActive: new Date(dataWithoutId.lastActive),
                      createdAt: new Date(dataWithoutId.createdAt),
                      updatedAt: new Date(dataWithoutId.updatedAt)
                    }
                  });
                } catch (error: any) {
                  if (error.code === 'P2002') {
                    console.log(`Duplicate userDevice found, skipping: ${transformed.deviceId}`);
                    continue;
                  }
                  throw error;
                }
              } else if (useUpsert) {
                console.log(`Upserting ${modelName}`);
                try {
                  // Special handling for junction tables
                  if (modelName === 'usersOnPermissions') {
                    console.log(
                      `Processing usersOnPermissions with userId: ${transformed.userId}, permissionId: ${transformed.permissionId}`
                    );
                    try {
                      // Validate required fields
                      if (!transformed.userId || !transformed.permissionId) {
                        console.log('Skipping invalid usersOnPermissions record - missing required fields');
                        continue;
                      }

                      createdItem = await txModel.upsert({
                        where: {
                          userId_permissionId: {
                            userId: transformed.userId,
                            permissionId: transformed.permissionId
                          }
                        },
                        update: {
                          assignedAt: new Date(transformed.assignedAt)
                        },
                        create: {
                          userId: transformed.userId,
                          permissionId: transformed.permissionId,
                          assignedAt: new Date(transformed.assignedAt)
                        }
                      });
                      console.log(`Successfully processed usersOnPermissions for user ${transformed.userId}`);
                    } catch (error: any) {
                      if (error.code === 'P2002') {
                        console.log(
                          `Duplicate usersOnPermissions found for user ${transformed.userId} and permission ${transformed.permissionId}, skipping`
                        );
                        continue;
                      }
                      if (error.code === 'P2003') {
                        console.log(
                          `Foreign key constraint failed for usersOnPermissions - user or permission may not exist`
                        );
                        continue;
                      }
                      throw error;
                    }
                  } else if (modelName === 'usersOnRoles') {
                    createdItem = await txModel.upsert({
                      where: {
                        userId_roleId: {
                          userId: transformed.userId,
                          roleId: transformed.roleId
                        }
                      },
                      update: {
                        assignedAt: new Date(transformed.assignedAt)
                      },
                      create: transformed
                    });
                  } else if (modelName === 'usersOnPermissionGroups') {
                    createdItem = await txModel.upsert({
                      where: transformed.compoundKey || {
                        userId_groupId: {
                          userId: transformed.userId,
                          groupId: transformed.groupId
                        }
                      },
                      update: {
                        assignedAt: new Date(transformed.assignedAt)
                      },
                      create: {
                        userId: transformed.userId,
                        groupId: transformed.groupId,
                        assignedAt: new Date(transformed.assignedAt)
                      }
                    });
                  } else if (modelName === 'rolesOnPermissions') {
                    createdItem = await txModel.upsert({
                      where: {
                        roleId_permissionId: {
                          roleId: transformed.roleId,
                          permissionId: transformed.permissionId
                        }
                      },
                      update: {
                        assignedAt: new Date(transformed.assignedAt)
                      },
                      create: transformed
                    });
                  } else if (modelName === 'permissionGroupsOnPermissions') {
                    createdItem = await txModel.upsert({
                      where: {
                        groupId_permissionId: {
                          groupId: transformed.groupId,
                          permissionId: transformed.permissionId
                        }
                      },
                      update: {
                        assignedAt: new Date(transformed.assignedAt)
                      },
                      create: transformed
                    });
                  } else if (modelName === 'rolesOnPermissionGroups') {
                    createdItem = await txModel.upsert({
                      where: {
                        roleId_groupId: {
                          roleId: transformed.roleId,
                          groupId: transformed.groupId
                        }
                      },
                      update: {
                        assignedAt: new Date(transformed.assignedAt)
                      },
                      create: transformed
                    });
                  } else {
                    // Regular model handling
                    createdItem = await txModel.upsert({
                      where: { id: id || transformed.id },
                      update: transformed,
                      create: transformed
                    });
                  }
                } catch (upsertError: any) {
                  if (upsertError.code === 'P2002') {
                    console.log(`Duplicate ${modelName} found, skipping: ${id || transformed.id}`);
                    continue;
                  }
                  throw upsertError;
                }
              } else {
                try {
                  console.log(`Creating new ${modelName}`);

                  // Special handling for usersOnPermissions to avoid transaction timeouts
                  if (modelName === 'usersOnPermissions') {
                    try {
                      // Try to find existing record first
                      const existing = await txModel.findFirst({
                        where: {
                          userId: transformed.userId,
                          permissionId: transformed.permissionId
                        }
                      });

                      if (existing) {
                        console.log(`Found existing usersOnPermissions for user ${transformed.userId}, updating`);
                        createdItem = await txModel.update({
                          where: {
                            id: existing.id
                          },
                          data: {
                            assignedAt: new Date(transformed.assignedAt)
                          }
                        });
                      } else {
                        console.log(`Creating new usersOnPermissions for user ${transformed.userId}`);
                        createdItem = await txModel.create({
                          data: {
                            userId: transformed.userId,
                            permissionId: transformed.permissionId,
                            assignedAt: new Date(transformed.assignedAt)
                          }
                        });
                      }
                      continue;
                    } catch (error: any) {
                      if (error.code === 'P2002') {
                        console.log(`Duplicate usersOnPermissions found, skipping`);
                        continue;
                      }
                      if (error.code === 'P2028') {
                        console.log(`Transaction timeout for usersOnPermissions, skipping`);
                        continue;
                      }
                      throw error;
                    }
                  }

                  createdItem = await txModel.create({ data: transformed });
                } catch (createError: any) {
                  if (createError.code === 'P2002' || createError.code === 'P2028') {
                    console.log(`Attempting upsert for ${modelName} after create failure`);
                    const { id, ...dataWithoutId } = transformed;

                    try {
                      createdItem = await txModel.upsert({
                        where: { id: id },
                        update: dataWithoutId,
                        create: dataWithoutId
                      });
                    } catch (upsertError: any) {
                      if (upsertError.code === 'P2002' || upsertError.code === 'P2028') {
                        console.log(`Failed to upsert ${modelName}, skipping`);
                        continue;
                      }
                      throw upsertError;
                    }
                  } else {
                    throw createError;
                  }
                }
              }

              if (options?.tx && relations) {
                await handleRelationships(txModel, relations, createdItem, options.tx, relations);
              }
            } catch (error: any) {
              console.error(`Failed to process ${modelName}:`, error);
              if (error.code === 'P2002') {
                console.log(`Skipping duplicate ${modelName}`);
                continue;
              }
              throw error;
            }
          }
        }
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`Skipping duplicate ${modelName}`);
          continue;
        }
        console.error(`Failed to restore ${modelName}:`, error);
        throw error;
      }
    }
  };

  await prisma.$transaction(
    async (tx) => {
      try {
        // Add transaction timeout warning
        const transactionStart = Date.now();
        const checkTransactionTime = () => {
          const elapsed = Date.now() - transactionStart;
          if (elapsed > 1500000) {
            // 25 minutes (giving 5 minutes buffer)
            console.log('Warning: Transaction running for 25 minutes, approaching timeout');
          }
        };

        // Helper function to handle transaction errors
        const handleTransactionError = (error: any, operation: string) => {
          console.error(`Transaction error during ${operation}:`, error);
          if (error.code === 'P2028') {
            console.log('Transaction aborted, attempting to continue with next operation');
            return true; // Indicates we should continue
          }
          return false; // Indicates we should throw
        };

        // Cleanup phase - Delete in reverse order of dependencies
        console.log('Starting cleanup phase...');
        const cleanupOperations = [
          { model: tx.api_key_usage_log, name: 'api_key_usage_log' },
          { model: tx.api_key, name: 'api_key' },
          { model: tx.taskExecution, name: 'taskExecution' },
          { model: tx.scheduledTask, name: 'scheduledTask' },
          { model: tx.loginAttempt, name: 'loginAttempt' },
          { model: tx.token, name: 'token' },
          { model: tx.loginHistory, name: 'loginHistory' },
          { model: tx.userDevice, name: 'userDevice' },
          { model: tx.idee, name: 'idee' },
          { model: tx.volgNummer, name: 'volgNummer' },
          { model: tx.gitHubIssue, name: 'gitHubIssue' },
          { model: tx.emailTracking, name: 'emailTracking' },
          { model: tx.userActivity, name: 'userActivity' },
          { model: tx.systemLog, name: 'systemLog' },
          { model: tx.permissionLog, name: 'permissionLog' },
          { model: tx.notification, name: 'notification' },
          {
            model: tx.message,
            name: 'message',
            cleanup: async () => {
              console.log('Starting message cleanup...');
              const count = await tx.message.count();
              console.log(`Found ${count} messages to clean up`);
              await tx.message.deleteMany({});
              console.log('Message cleanup completed');
            }
          },
          { model: tx.chatRoom, name: 'chatRoom' },
          { model: tx.correctief, name: 'correctief' },
          { model: tx.preventief, name: 'preventief' },
          { model: tx.melding, name: 'melding' },
          { model: tx.status, name: 'status' },
          { model: tx.projectleider, name: 'projectleider' },
          { model: tx.project, name: 'project' },
          { model: tx.settings, name: 'settings' },
          { model: tx.usersOnPermissions, name: 'usersOnPermissions' },
          { model: tx.usersOnRoles, name: 'usersOnRoles' },
          { model: tx.usersOnPermissionGroups, name: 'usersOnPermissionGroups' },
          { model: tx.rolesOnPermissions, name: 'rolesOnPermissions' },
          { model: tx.permissionGroupsOnPermissions, name: 'permissionGroupsOnPermissions' },
          { model: tx.rolesOnPermissionGroups, name: 'rolesOnPermissionGroups' },
          { model: tx.role, name: 'role' },
          { model: tx.permissionGroup, name: 'permissionGroup' },
          { model: tx.permission, name: 'permission' },
          { model: tx.user, name: 'user' },
          { model: tx.department, name: 'department' }
        ];

        for (const op of cleanupOperations) {
          try {
            if (!tx) {
              throw new Error('Transaction context missing in cleanup');
            }
            if (op.cleanup) {
              await op.cleanup();
            } else {
              await (op.model.deleteMany as any)({});
            }
            updateProgress();
          } catch (error: any) {
            if (!handleTransactionError(error, `cleanup of ${op.name}`)) {
              throw error;
            }
          }
        }

        // Verify cleanup was successful
        const verifyCleanup = async () => {
          console.log('Verifying cleanup...');
          if (!tx) {
            throw new Error('Transaction context missing in cleanup verification');
          }
          const counts = await Promise.all([
            tx.message.count(),
            tx.chatRoom.count(),
            tx.user.count(),
            tx.department.count(),
            tx.usersOnPermissionGroups.count(),
            tx.usersOnPermissions.count(),
            tx.usersOnRoles.count()
          ]);

          const [
            messageCount,
            chatRoomCount,
            userCount,
            departmentCount,
            userGroupCount,
            userPermCount,
            userRoleCount
          ] = counts;
          console.log(
            `After cleanup - Messages: ${messageCount}, ChatRooms: ${chatRoomCount}, Users: ${userCount}, ` +
              `Departments: ${departmentCount}, UserGroups: ${userGroupCount}, UserPerms: ${userPermCount}, UserRoles: ${userRoleCount}`
          );

          // Force cleanup if any junction tables still have records
          if (userGroupCount > 0 || userPermCount > 0 || userRoleCount > 0) {
            console.log('Found remaining junction records, forcing cleanup...');
            await Promise.all([
              tx.usersOnPermissionGroups.deleteMany({}),
              tx.usersOnPermissions.deleteMany({}),
              tx.usersOnRoles.deleteMany({})
            ]);

            // Verify again
            const [groupCount, permCount, roleCount] = await Promise.all([
              tx.usersOnPermissionGroups.count(),
              tx.usersOnPermissions.count(),
              tx.usersOnRoles.count()
            ]);

            console.log(
              `After forced cleanup - UserGroups: ${groupCount}, UserPerms: ${permCount}, UserRoles: ${roleCount}`
            );

            if (groupCount > 0 || permCount > 0 || roleCount > 0) {
              throw new Error('Failed to clean up junction tables even after forced cleanup');
            }
          }

          if (counts.some((count) => count > 0)) {
            console.log('Warning: Some records still exist after cleanup');
          }
        };

        await verifyCleanup();

        // Add logging of available models in transaction context
        console.log('Available models in transaction context:', Object.keys(tx).join(', '));

        // Restore phase - Restore in order of dependencies
        console.log('Starting restore phase...');

        const restoreModel = async (model: any, data: any[], options: any) => {
          try {
            checkTransactionTime();
            await restoreWithIds(model, data, options);
            updateProgress();
          } catch (error: any) {
            const modelName = getModelName(model);
            console.error(`Error during restore of ${modelName}:`, error);
            // Don't handle the error here, let it propagate up
            throw error;
          }
        };

        // Restore phase - Restore in order of dependencies using the new restoreModel function
        const restoreOperations = [
          // Core models with no dependencies
          { model: tx.department, data: safeData.departments, options: { tx } },
          { model: tx.permission, data: safeData.permissions, options: { tx } },
          { model: tx.role, data: safeData.roles, options: { tx } },
          { model: tx.permissionGroup, data: safeData.permissionGroups, options: { tx } },
          { model: tx.settings, data: safeData.settings, options: { tx } },
          { model: tx.projectleider, data: safeData.projectleiders, options: { tx } },

          // Models with dependencies
          { model: tx.user, data: safeData.users, options: { checkDepartments: true, tx } },
          { model: tx.project, data: safeData.projects, options: { tx } },
          { model: tx.status, data: safeData.statuses, options: { tx } },
          { model: tx.melding, data: safeData.meldingen, options: { tx } },
          { model: tx.preventief, data: safeData.preventiefs, options: { tx } },
          { model: tx.correctief, data: safeData.correctiefs, options: { tx } },
          { model: tx.chatRoom, data: safeData.chatRooms, options: { tx } },
          { model: tx.message, data: safeData.messages, options: { tx } },
          { model: tx.notification, data: safeData.notifications, options: { tx } },
          { model: tx.scheduledTask, data: safeData.scheduledTasks, options: { tx } },
          { model: tx.taskExecution, data: safeData.taskExecutions, options: { tx } },
          { model: tx.permissionLog, data: safeData.permissionLogs, options: { tx } },
          { model: tx.systemLog, data: safeData.systemLogs, options: { tx } },
          { model: tx.userActivity, data: safeData.userActivities, options: { tx } },
          { model: tx.emailTracking, data: safeData.emailTracking, options: { tx } },
          { model: tx.gitHubIssue, data: safeData.githubIssues, options: { tx } },
          { model: tx.volgNummer, data: safeData.volgNummers, options: { tx } },
          { model: tx.idee, data: safeData.idees, options: { tx } },
          { model: tx.userDevice, data: safeData.devices, options: { tx } },
          { model: tx.loginHistory, data: safeData.loginHistory, options: { tx } },
          { model: tx.loginAttempt, data: safeData.loginAttempts, options: { tx } },
          { model: tx.token, data: safeData.tokens, options: { tx } },
          { model: tx.api_key, data: safeData.apiKeys, options: { tx } },
          { model: tx.api_key_usage_log, data: safeData.apiKeyUsageLogs, options: { tx } },

          // Junction tables - restore these last after all dependencies exist
          { model: tx.usersOnPermissions, data: safeData.usersOnPermissions, options: { tx } },
          { model: tx.usersOnRoles, data: safeData.usersOnRoles, options: { tx } },
          { model: tx.usersOnPermissionGroups, data: safeData.usersOnPermissionGroups, options: { tx } },
          { model: tx.rolesOnPermissions, data: safeData.rolesOnPermissions, options: { tx } },
          { model: tx.permissionGroupsOnPermissions, data: safeData.permissionGroupsOnPermissions, options: { tx } },
          { model: tx.rolesOnPermissionGroups, data: safeData.rolesOnPermissionGroups, options: { tx } }
        ];

        // Process models in sequence, maintaining transaction atomicity
        for (const op of restoreOperations) {
          console.log(`Restoring ${getModelName(op.model)}...`);
          await restoreModel(op.model, op.data, op.options);
        }

        // Validate the restore
        const isValid = await validateRestore(tx, backupData);
        if (!isValid) {
          console.log('Warning: Restore validation found discrepancies');
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error('Unknown error occurred');
        console.error('Restore failed:', err);
        throw new Error(`Restore failed during transaction: ${err.message}`);
      }
    },
    {
      timeout: 99999999999999 // Whenever the sun is dead it will timeout
    }
  );

  onProgress(100); // Only reach 100% when everything is complete
};

export const getBackups = async () => {
  return prisma.backup.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });
};

export const getBackupById = async (id: string) => {
  return prisma.backup.findUnique({
    where: { id }
  });
};

export const deleteBackup = async (id: string) => {
  return prisma.backup.delete({
    where: { id }
  });
};
