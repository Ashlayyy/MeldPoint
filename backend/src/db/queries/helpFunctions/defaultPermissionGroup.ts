import type { PrismaClient } from '@prisma/client';
import prisma from '../../prismaClient';
import logger from '../../../helpers/loggerInstance';

type PermissionGroupClient = Pick<PrismaClient, 'permissionGroup'>;

const FALLBACK_GROUP_NAMES = ['user', 'users', 'standaard', 'standaard gebruiker', 'standard', 'gebruiker', 'default'];

export function getConfiguredDefaultGroupId(): string | undefined {
  const useDev = process.env.ENABLE_DEV_DATABASE === 'true';
  const raw = (useDev ? process.env.STANDARD_USER_GROUP_ID_DEV : process.env.STANDARD_USER_GROUP_ID)?.trim();
  return raw || undefined;
}

export async function resolveDefaultPermissionGroupId(tx: PermissionGroupClient = prisma): Promise<string | null> {
  const configuredId = getConfiguredDefaultGroupId();

  if (configuredId) {
    try {
      const byId = await tx.permissionGroup.findUnique({
        where: { id: configuredId },
        select: { id: true, name: true }
      });
      if (byId) {
        return byId.id;
      }
    } catch (error) {
      logger.warn('Default permission group ID from env is invalid', {
        configuredId,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    logger.warn('Configured STANDARD_USER_GROUP_ID was not found; looking for a fallback group', {
      configuredId
    });
  }

  const groups = await tx.permissionGroup.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' }
  });

  const named = groups.find((group) => FALLBACK_GROUP_NAMES.includes(group.name.toLowerCase()));
  if (named) {
    logger.warn(`Using permission group "${named.name}" as the default user group`, { groupId: named.id });
    return named.id;
  }

  if (groups[0]) {
    logger.warn(`Using first permission group "${groups[0].name}" as the default user group`, {
      groupId: groups[0].id
    });
    return groups[0].id;
  }

  const created = await tx.permissionGroup.create({
    data: {
      name: 'User',
      description: 'Default group assigned to new users'
    },
    select: { id: true }
  });

  logger.warn('No permission groups existed; created a default User group', { groupId: created.id });
  return created.id;
}
