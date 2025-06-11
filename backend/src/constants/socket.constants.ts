export const SOCKET_ROOMS = {
  SECURITY: 'security',
  DIGITAL_TWINS: 'digital-twins',
  GITHUB: 'github',
  NOTIFICATIONS: 'notifications'
} as const;

// Event names organized by feature/domain
export const SOCKET_EVENTS = {
  GITHUB: {
    JOIN: 'join:github',
    LEAVE: 'leave:github',
    ISSUE_CREATED: 'issue:created',
    ISSUE_UPDATED: 'issue:updated'
  },
  SECURITY: {
    DEVICE_REGISTER: 'security:device:register',
    DEVICE_UPDATE: 'security:device:update',
    DEVICE_LIST: 'security:device:list',
    DEVICE_LIST_RESPONSE: 'security:device:list:response',
    DEVICE_REVOKE: 'security:device:revoke',
    REVOKE_ALL: 'security:revoke-all',
    LOGIN_HISTORY: 'security:login-history',
    ERROR: 'security:error',
    DEVICE_REGISTERED: 'security:device:registered',
    DEVICE_UPDATED: 'security:device:updated',
    DEVICE_REVOKED: 'security:device:revoked',
    DEVICE_REVOKED_SUCCESS: 'security:device:revoked:success',
    DEVICES_REVOKED_ALL_SUCCESS: 'security:devices:revoked:all:success',
    LOGIN_HISTORY_RESPONSE: 'security:login-history:response'
  },
  DIGITAL_TWINS: {
    JOIN: 'digital-twins:join',
    LEAVE: 'digital-twins:leave',
    MESSAGE: 'digital-twins:message'
  },
  NOTIFICATIONS: {
    SYSTEM: 'notifications:system',
    TOAST: 'notifications:toast',
    ERROR: 'notifications:error'
  }
} as const;
