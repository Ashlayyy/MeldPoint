import { useAuthStore } from '@/stores/auth';

export interface Permission {
  action: string;
  resourceType: string;
}

const addEffectivePermission = (effectivePermissions: Set<string>, action: string, resource: string) => {
  effectivePermissions.add(`${action}:${resource}`);
  // If the action is MANAGE, add all other actions for the same resource
  if (action.toLowerCase() === 'manage') {
    effectivePermissions.add(`create:${resource}`);
    effectivePermissions.add(`read:${resource}`);
    effectivePermissions.add(`update:${resource}`);
    effectivePermissions.add(`delete:${resource}`);
  }
};

export const hasPermission = (permissionNeeded?: Permission[]): boolean => {
  if (!permissionNeeded) return true;

  const permissions = useAuthStore().permissions;
  const effectivePermissions = new Set<string>();

  // Process all permissions and build effective permission set
  permissions.forEach(permission => {
    if (permission?.action && permission?.resourceType) {
      addEffectivePermission(
        effectivePermissions,
        permission.action.toLowerCase(),
        permission.resourceType.toLowerCase()
      );
    }
  });

  // Special case: if user has MANAGE:ALL, they have all permissions
  if (effectivePermissions.has('manage:all')) {
    return true;
  }

  // Check if user has all needed permissions
  return permissionNeeded.every(needed => {
    if (!needed?.action || !needed?.resourceType) return false;
    
    const permissionKey = `${needed.action.toLowerCase()}:${needed.resourceType.toLowerCase()}`;
    return effectivePermissions.has(permissionKey);
  });
};

export const permissionDirective = {
  mounted(el: HTMLElement, binding: { value: Permission[] }) {
    const hasAccess = hasPermission(binding.value);
    if (!hasAccess) {
      el.style.display = 'none';
      el.style.height = '0';
      el.style.width = '0';
    }
  },
  updated(el: HTMLElement, binding: { value: Permission[] }) {
    const hasAccess = hasPermission(binding.value);
    if (!hasAccess) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
    }
  }
};
