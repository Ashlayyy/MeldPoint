/* eslint-disable @typescript-eslint/return-await */
import prisma from '../prismaClient';

export async function deleteSingleProjectLeider(id: string) {
  return prisma.projectleider.delete({
    where: { id }
  });
}

export async function deleteMessage(messageID: string) {
  return prisma.message.delete({
    where: { id: messageID }
  });
}

export async function deleteProject(projectId: string) {
  return prisma.project.delete({
    where: { id: projectId }
  });
}

// Warning: Dangerous operations below - should be protected and only used in development
export async function DELETEALL() {
  return prisma.$transaction([
    prisma.message.deleteMany({}),
    prisma.chatRoom.deleteMany({}),
    prisma.correctief.deleteMany({}),
    prisma.preventief.deleteMany({}),
    prisma.project.deleteMany({}),
    prisma.melding.deleteMany({}),
    prisma.status.deleteMany({}),
    prisma.volgNummer.deleteMany({}),
    prisma.idee.deleteMany({}),
    prisma.user.deleteMany({}),
    prisma.settings.deleteMany({}),
    prisma.emailTracking.deleteMany({}),
    prisma.permissionLog.deleteMany({}),
    prisma.backup.deleteMany({}),
    prisma.userActivity.deleteMany({}),
    prisma.systemLog.deleteMany({}),
    prisma.permission.deleteMany({}),
    prisma.permissionGroup.deleteMany({}),
    prisma.role.deleteMany({}),
    prisma.usersOnPermissions.deleteMany({}),
    prisma.usersOnRoles.deleteMany({}),
    prisma.usersOnPermissionGroups.deleteMany({}),
    prisma.rolesOnPermissions.deleteMany({}),
    prisma.permissionGroupsOnPermissions.deleteMany({}),
    prisma.rolesOnPermissionGroups.deleteMany({})
  ]);
}

export async function DELETEALLHISTORY() {
  return prisma.systemLog.deleteMany({});
}
