import { hasPermission } from '../utils/permission';

export function usePermissionGuard() {
  const validateRoutePermissions = (to: any) => {
    if (!to.meta?.permissions) return true;

    const permissions = Array.isArray(to.meta.permissions) ? to.meta.permissions : [to.meta.permissions];
    return hasPermission(permissions);
  };

  return {
    hasPermission,
    validateRoutePermissions
  };
}

export function useDisabledGuard() {
  const validateRouteDisabled = (to: any) => {
    if (!to.meta?.disabled) {
      return true;
    }
    return false;
  };

  return { validateRouteDisabled };
}
