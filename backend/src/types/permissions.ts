import { ResourceType } from '@prisma/client';

export enum PermissionAction {
  MANAGE = 'MANAGE',
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export const permissionHierarchy: Record<PermissionAction, PermissionAction[]> = {
  MANAGE: [PermissionAction.CREATE, PermissionAction.READ, PermissionAction.UPDATE, PermissionAction.DELETE],
  CREATE: [PermissionAction.READ],
  UPDATE: [PermissionAction.READ],
  DELETE: [PermissionAction.READ],
  READ: []
} as const;

export class PermissionResolver {
  private static expandPermission(action: PermissionAction): Set<PermissionAction> {
    const permissions = new Set<PermissionAction>([action]);

    // Add inherited permissions
    const inherited = permissionHierarchy[action] || [];
    inherited.forEach((inheritedAction) => {
      const expandedInherited = this.expandPermission(inheritedAction);
      expandedInherited.forEach((p) => permissions.add(p));
    });

    return permissions;
  }

  public static hasPermission(
    userPermissions: Set<string>,
    requiredAction: PermissionAction,
    resource: ResourceType
  ): boolean {
    // Expand the required permission to include inherited permissions
    const expandedPermissions = this.expandPermission(requiredAction);

    // Check if user has any of the expanded permissions
    return Array.from(expandedPermissions).some((action) => userPermissions.has(`${action}:${resource}`));
  }
}
