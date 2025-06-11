export interface Permission {
  id: string;
  name: string;
  description?: string;
  action: string;
  resourceType: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description?: string;
  permissions: Array<{
    permission: Permission;
  }>;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  rolePermissions: Array<{
    permission: Permission;
  }>;
}
