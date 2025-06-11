import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';

// Mock dependencies used by the store
vi.mock('@/router', () => ({
  router: {
    push: vi.fn()
  }
}));

vi.mock('@/API/user', () => ({
  GetCurrentUser: vi.fn(),
  Logout: vi.fn()
}));

vi.mock('@/utils/csrf', () => ({
  getCsrfToken: vi.fn()
}));

const mockNotificationError = vi.fn(); // Define mock function outside
vi.mock('@/stores/verbeterplein/notification_store', () => ({
  useNotificationStore: vi.fn(() => ({
    error: mockNotificationError // Use the external mock function
  }))
}));

// Hoist the SecurityService mock variables
const { mockSecurityServiceInstance, mockSecurityServiceConstructor } = vi.hoisted(() => {
  const instance = { deviceId: 'mock-device-id' };
  const constructor = vi.fn().mockImplementation(() => instance);
  return { mockSecurityServiceInstance: instance, mockSecurityServiceConstructor: constructor };
});

// Mock SecurityService using the hoisted constructor
vi.mock('@/services/SecurityService', () => ({
  SecurityService: mockSecurityServiceConstructor
}));

// Improve requestStore mock to handle promises/rejections
vi.mock('@/stores/verbeterplein/request_store', () => ({
  useRequestStore: vi.fn(() => ({
    executeRequest: vi.fn(async (_key, _action, fn) => {
      try {
        // Await the function passed to it, allowing rejections to propagate
        return await fn();
      } catch (error) {
        // Re-throw error so the action's catch block can handle it
        throw error;
      }
    })
  }))
}));

vi.mock('@/main', () => ({
  default: {
    global: {
      t: vi.fn((key) => key) // Simple translation mock
    }
  }
}));

describe('Auth Store', () => {
  beforeEach(() => {
    // creates a fresh pinia and make it active so it's automatically picked
    // up by any useStore() call without having to pass it to it:
    // `useStore(pinia)`
    setActivePinia(createPinia());
    // Reset mocks before each test
    vi.clearAllMocks();
    // Reset SecurityService mock instance to default for each test
    mockSecurityServiceInstance.deviceId = 'mock-device-id';
    // Reset constructor mock implementation to default
    mockSecurityServiceConstructor.mockImplementation(() => mockSecurityServiceInstance);
  });

  it('should have correct initial state', () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.isLoading).toBe(true); // Initial isLoading is true
    expect(store.permissions).toEqual([]);
    expect(store.csrfToken).toBeNull();
    expect(store.currentDevice).toBeNull();
  });

  it('action: logout should reset state and call dependencies', async () => {
    const store = useAuthStore();
    // Import necessary mocks
    const { router } = await import('@/router');
    const { Logout } = await import('@/API/user');

    // Set initial authenticated state (or parts of it)
    store.user = { id: 1, name: 'Test User' };
    store.isAuthenticated = true;
    store.permissions = [{ action: 'read', resourceType: 'test' }];
    store.csrfToken = 'test-token';
    store.currentDevice = 'test-device';

    // Call the logout action
    await store.logout();

    // Assert state is reset
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.permissions).toEqual([]);
    expect(store.csrfToken).toBeNull();
    expect(store.currentDevice).toBeNull();

    // Assert dependencies were called
    expect(Logout).toHaveBeenCalledOnce();
    expect(router.push).toHaveBeenCalledOnce();
    expect(router.push).toHaveBeenCalledWith('/auth/login');
  });

  it('action: login should set window.location.href correctly', async () => {
    // Mock import.meta.env
    vi.stubGlobal('importMeta', {
      meta: {
        env: {
          VITE_API_KEY: 'secret',
          VITE_API_URL: 'http://localhost:4000'
        }
      }
    });

    // Mock window.location
    const originalLocation = window.location;
    // @ts-ignore - Need to delete first for Vitest stubbing
    delete window.location;
    const mockLocation = {
      href: '',
      assign: vi.fn(),
      replace: vi.fn()
    };
    vi.stubGlobal('location', mockLocation);

    const store = useAuthStore();
    const { getCsrfToken } = await import('@/utils/csrf');
    const { SecurityService } = await import('@/services/SecurityService');

    // Mock dependencies for this specific test
    const mockToken = 'test-csrf-token';
    vi.mocked(getCsrfToken).mockResolvedValue(mockToken);

    await store.login();

    // Assertions
    expect(getCsrfToken).toHaveBeenCalledOnce();
    expect(SecurityService).toHaveBeenCalledOnce(); // Checks if constructor was called

    const expectedApiKeyHash = btoa('secret');
    const expectedUrl = new URL('http://localhost:4000/api/user/auth/microsoft');
    expectedUrl.searchParams.set('apiKey', expectedApiKeyHash);
    expectedUrl.searchParams.set('csrfToken', mockToken);
    expectedUrl.searchParams.set('x-device-id', 'mock-device-id'); // From the mock

    expect(mockLocation.href).toBe(expectedUrl.toString());
    expect(store.csrfToken).toBe(mockToken); // Check if token was stored

    // Restore original window.location
    vi.stubGlobal('location', originalLocation);
    vi.unstubAllGlobals(); // Clean up import.meta mock
  });

  it('action: login should handle getCsrfToken failure', async () => {
    // Mock import.meta.env
    vi.stubGlobal('importMeta', {
      meta: {
        env: {
          VITE_API_KEY: 'secret',
          VITE_API_URL: 'http://localhost:4000',
          VITE_ENABLE_CSRF: 'true'
        }
      }
    });
    // Mock window.location (though it shouldn't be used)
    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    const mockLocation = { href: '', assign: vi.fn(), replace: vi.fn() };
    vi.stubGlobal('location', mockLocation);

    const store = useAuthStore();
    const { getCsrfToken } = await import('@/utils/csrf');

    const mockError = new Error('CSRF Fetch Failed');
    vi.mocked(getCsrfToken).mockRejectedValue(mockError);

    await store.login();

    // Assertions
    expect(getCsrfToken).toHaveBeenCalledOnce();
    expect(mockLocation.href).toBe(''); // href should not be set
    expect(mockNotificationError).toHaveBeenCalledOnce(); // Assert against the external mock
    expect(mockNotificationError).toHaveBeenCalledWith({ message: expect.stringContaining('errors.login_error') });
    expect(store.csrfToken).toBeNull(); // Token should not be set

    // Restore
    vi.stubGlobal('location', originalLocation);
    vi.unstubAllGlobals();
  });

  it('action: login should handle null csrfToken', async () => {
    vi.stubGlobal('importMeta', {
      meta: {
        env: {
          VITE_API_KEY: 'secret',
          VITE_API_URL: 'http://localhost:4000',
          VITE_ENABLE_CSRF: 'true'
        }
      }
    });
    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    const mockLocation = { href: '', assign: vi.fn(), replace: vi.fn() };
    vi.stubGlobal('location', mockLocation);

    const store = useAuthStore();
    const { getCsrfToken } = await import('@/utils/csrf');

    vi.mocked(getCsrfToken).mockResolvedValue(null);

    await store.login();

    const expectedApiKeyHash = btoa('secret');
    const expectedUrl = new URL('http://localhost:4000/api/user/auth/microsoft');
    expectedUrl.searchParams.set('apiKey', expectedApiKeyHash);
    expectedUrl.searchParams.set('x-device-id', 'mock-device-id');

    expect(mockLocation.href).toBe(expectedUrl.toString());
    expect(store.csrfToken).toBeNull(); // Token should remain null

    vi.stubGlobal('location', originalLocation);
    vi.unstubAllGlobals();
  });

  it('action: login should handle null deviceId', async () => {
    // Change constructor implementation *just for this test*
    mockSecurityServiceConstructor.mockImplementationOnce(() => ({
      deviceId: null
    }));

    // Import store normally now
    const { useAuthStore } = await import('@/stores/auth');
    const { getCsrfToken } = await import('@/utils/csrf');

    // Set up env and location mocks
    vi.stubGlobal('importMeta', {
      meta: {
        env: {
          VITE_API_KEY: 'secret',
          VITE_API_URL: 'http://localhost:4000',
          VITE_ENABLE_CSRF: 'true' // Keep user's change
        }
      }
    });
    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    const mockLocation = { href: '', assign: vi.fn(), replace: vi.fn() };
    vi.stubGlobal('location', mockLocation);

    // Get store instance
    const store = useAuthStore();

    // Mock getCsrfToken
    const mockToken = 'test-csrf-token-no-device';
    vi.mocked(getCsrfToken).mockResolvedValue(mockToken);

    // Act
    await store.login();

    // Assert
    const expectedApiKeyHash = btoa('secret');
    const expectedUrl = new URL('http://localhost:4000/api/user/auth/microsoft');
    expectedUrl.searchParams.set('apiKey', expectedApiKeyHash);
    expectedUrl.searchParams.set('csrfToken', mockToken);
    // x-device-id should NOT be set

    expect(mockSecurityServiceConstructor).toHaveBeenCalledOnce(); // Check constructor call
    expect(mockLocation.href).toBe(expectedUrl.toString());

    // Cleanup
    vi.stubGlobal('location', originalLocation);
    vi.unstubAllGlobals();
  });

  describe('action: initializeAuth', () => {
    it('should set user and permissions on successful fetch', async () => {
      const store = useAuthStore();
      const { GetCurrentUser } = await import('@/API/user');

      const mockUserData = {
        id: 'user-123',
        name: 'Init User',
        // Include structure needed for formatPermissions
        userPermissions: [
          {
            permission: {
              action: 'read',
              resourceType: 'posts'
            }
          }
        ],
        userRoles: [],
        userGroups: []
      };
      const mockApiResponse = { data: mockUserData, status: 200 }; // Simulate successful API response
      vi.mocked(GetCurrentUser).mockResolvedValue(mockApiResponse);

      const result = await store.initializeAuth();

      expect(store.isLoading).toBe(false);
      expect(store.isAuthenticated).toBe(true);
      expect(store.user).toEqual(mockUserData);
      expect(store.permissions).toEqual([{ action: 'read', resourceType: 'posts' }]); // Based on mock user data
      expect(GetCurrentUser).toHaveBeenCalledTimes(2); // Called by initializeAuth AND refreshPermissions
      expect(result).toBe(true);
    });

    it('should call logout and return false if GetCurrentUser fails', async () => {
      const store = useAuthStore();
      const { GetCurrentUser } = await import('@/API/user');
      const { router } = await import('@/router');
      const { Logout } = await import('@/API/user'); // Need to check logout calls

      const mockError = new Error('Failed to fetch user');
      vi.mocked(GetCurrentUser).mockRejectedValue(mockError);

      const result = await store.initializeAuth();

      expect(store.isLoading).toBe(false);
      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBeNull();
      expect(store.permissions).toEqual([]);
      expect(GetCurrentUser).toHaveBeenCalledOnce();

      // Check that logout logic was triggered
      expect(Logout).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledWith('/auth/login');
      expect(result).toBe(false);
    });

    it('should call logout and return false if GetCurrentUser returns no data', async () => {
      const store = useAuthStore();
      const { GetCurrentUser } = await import('@/API/user');
      const { router } = await import('@/router');
      const { Logout } = await import('@/API/user');

      const mockApiResponse = { data: null, status: 200 }; // Simulate API responding ok but with no user
      vi.mocked(GetCurrentUser).mockResolvedValue(mockApiResponse);

      const result = await store.initializeAuth();

      expect(store.isLoading).toBe(false);
      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBeNull();
      expect(store.permissions).toEqual([]);
      expect(GetCurrentUser).toHaveBeenCalledOnce();

      // Check that logout logic was triggered
      expect(Logout).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledWith('/auth/login');
      expect(result).toBe(false);
    });
  });

  describe('action: checkAuth', () => {
    it('should set user and permissions on successful fetch', async () => {
      const store = useAuthStore();
      const { GetCurrentUser } = await import('@/API/user');
      const { Logout } = await import('@/API/user');
      const { router } = await import('@/router');

      const mockUserData = {
        id: 'user-check',
        name: 'Check User',
        userPermissions: [{ permission: { action: 'update', resourceType: 'settings' } }],
        userRoles: [],
        userGroups: []
      };
      const mockApiResponse = { data: mockUserData, status: 200 };
      vi.mocked(GetCurrentUser).mockResolvedValue(mockApiResponse);

      const result = await store.checkAuth();

      expect(result).toBe(true);
      expect(store.isAuthenticated).toBe(true);
      expect(store.user).toEqual(mockUserData);
      expect(store.permissions).toEqual([{ action: 'update', resourceType: 'settings' }]);
      expect(Logout).not.toHaveBeenCalled();
      expect(router.push).not.toHaveBeenCalled();
    });

    it('should call logout if GetCurrentUser returns null data', async () => {
      const store = useAuthStore();
      const { GetCurrentUser } = await import('@/API/user');
      const { Logout } = await import('@/API/user');
      const { router } = await import('@/router');

      const mockApiResponse = { data: null, status: 200 };
      vi.mocked(GetCurrentUser).mockResolvedValue(mockApiResponse);

      const result = await store.checkAuth();

      expect(result).toBe(false);
      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBeNull();
      expect(Logout).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledWith('/auth/login');
    });

    it('should call logout if GetCurrentUser returns non-200 status', async () => {
      const store = useAuthStore();
      const { GetCurrentUser } = await import('@/API/user');
      const { Logout } = await import('@/API/user');
      const { router } = await import('@/router');

      // Important: Mock the resolved value, not a rejection for non-200 status check
      const mockApiResponse = { data: { id: 'user-fail' }, status: 404 };
      vi.mocked(GetCurrentUser).mockResolvedValue(mockApiResponse);

      const result = await store.checkAuth();

      expect(result).toBe(false);
      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBeNull();
      expect(Logout).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledWith('/auth/login');
    });

    it('should call logout and notify on API error', async () => {
      const store = useAuthStore();
      const { GetCurrentUser } = await import('@/API/user');
      const { Logout } = await import('@/API/user');
      const { router } = await import('@/router');

      const mockError = new Error('API Failed');
      vi.mocked(GetCurrentUser).mockRejectedValue(mockError);

      const result = await store.checkAuth();

      expect(result).toBe(false);
      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBeNull();
      expect(Logout).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledWith('/auth/login');
      expect(mockNotificationError).toHaveBeenCalledOnce();
      expect(mockNotificationError).toHaveBeenCalledWith({ message: expect.stringContaining('errors.check_auth_failed') });
    });
  });

  describe('action: setUser', () => {
    it('should set user and permissions on success', async () => {
      const store = useAuthStore();
      const { GetCurrentUser } = await import('@/API/user');
      const { Logout } = await import('@/API/user');

      const mockUserData = {
        id: 'user-set',
        name: 'Set User',
        userPermissions: [{ permission: { action: 'delete', resourceType: 'items' } }],
        userRoles: [],
        userGroups: []
      };
      const mockApiResponse = { data: mockUserData, status: 200 };
      vi.mocked(GetCurrentUser).mockResolvedValue(mockApiResponse);

      await store.setUser();

      expect(store.isAuthenticated).toBe(true);
      expect(store.user).toEqual(mockUserData);
      expect(store.permissions).toEqual([{ action: 'delete', resourceType: 'items' }]);
      expect(Logout).not.toHaveBeenCalled();
    });

    it('should call logout if GetCurrentUser returns non-200 status', async () => {
      const store = useAuthStore();
      const { GetCurrentUser } = await import('@/API/user');
      const { Logout } = await import('@/API/user');
      const { router } = await import('@/router');

      const mockApiResponse = { data: { id: 'user-set-fail' }, status: 500 };
      vi.mocked(GetCurrentUser).mockResolvedValue(mockApiResponse);

      await store.setUser();

      expect(store.isAuthenticated).toBe(false);
      expect(store.user).toBeNull();
      expect(Logout).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('action: clearCsrfToken should set token to null', () => {
    const store = useAuthStore();
    store.csrfToken = 'some-token';
    store.clearCsrfToken();
    expect(store.csrfToken).toBeNull();
  });

  describe('formatPermissions', () => {
    it('should format direct user permissions', async () => {
      const store = useAuthStore();
      store.user = {
        userPermissions: [
          { permission: { action: 'read', resourceType: 'profile' } },
          { permission: { action: 'write', resourceType: 'profile' } }
        ],
        userRoles: [],
        userGroups: []
      };
      await store.formatPermissions();
      expect(store.permissions).toEqual([
        { action: 'read', resourceType: 'profile' },
        { action: 'write', resourceType: 'profile' }
      ]);
    });

    it('should format permissions from roles', async () => {
      const store = useAuthStore();
      store.user = {
        userPermissions: [],
        userRoles: [
          {
            role: {
              rolePermissions: [{ permission: { action: 'admin', resourceType: 'dashboard' } }],
              rolePermissionGroups: [] // Add empty group array
            }
          }
        ],
        userGroups: []
      };
      await store.formatPermissions();
      expect(store.permissions).toEqual([{ action: 'admin', resourceType: 'dashboard' }]);
    });

    it('should format permissions from role permission groups', async () => {
      const store = useAuthStore();
      store.user = {
        userPermissions: [],
        userRoles: [
          {
            role: {
              rolePermissions: [],
              rolePermissionGroups: [
                {
                  group: {
                    permissions: [
                      { permission: { action: 'manage', resourceType: 'users' } },
                      { permission: { action: 'view', resourceType: 'logs' } }
                    ]
                  }
                }
              ]
            }
          }
        ],
        userGroups: []
      };
      await store.formatPermissions();
      expect(store.permissions).toEqual([
        { action: 'manage', resourceType: 'users' },
        { action: 'view', resourceType: 'logs' }
      ]);
    });

    it('should format permissions from user groups', async () => {
      const store = useAuthStore();
      store.user = {
        userPermissions: [],
        userRoles: [],
        userGroups: [
          {
            group: {
              permissions: [{ permission: { action: 'read', resourceType: 'reports' } }]
            }
          }
        ]
      };
      await store.formatPermissions();
      expect(store.permissions).toEqual([{ action: 'read', resourceType: 'reports' }]);
    });

    it('should combine and deduplicate permissions from all sources', async () => {
      const store = useAuthStore();
      store.user = {
        userPermissions: [
          { permission: { action: 'read', resourceType: 'profile' } } // Direct
        ],
        userRoles: [
          {
            role: {
              // Role Direct + Role Group
              rolePermissions: [
                { permission: { action: 'write', resourceType: 'profile' } } // Role direct (duplicate action)
              ],
              rolePermissionGroups: [
                {
                  group: {
                    // Role Group
                    permissions: [{ permission: { action: 'admin', resourceType: 'settings' } }]
                  }
                }
              ]
            }
          }
        ],
        userGroups: [
          {
            group: {
              // User Group (duplicate resource)
              permissions: [{ permission: { action: 'read', resourceType: 'settings' } }]
            }
          }
        ]
      };
      await store.formatPermissions();
      // Expected: read:profile, write:profile, admin:settings, read:settings
      expect(store.permissions).toEqual(
        expect.arrayContaining([
          { action: 'read', resourceType: 'profile' },
          { action: 'write', resourceType: 'profile' },
          { action: 'admin', resourceType: 'settings' },
          { action: 'read', resourceType: 'settings' }
        ])
      );
      expect(store.permissions.length).toBe(4); // Ensure no extras and deduplication worked
    });

    it('should handle null or malformed permission structures gracefully', async () => {
      const store = useAuthStore();
      store.user = {
        userPermissions: [
          { permission: { action: 'valid', resourceType: 'one' } },
          null, // Null entry
          { permission: null }, // Null permission object
          { permission: { action: 'valid', resourceType: undefined } } // Missing resourceType
        ],
        userRoles: [
          {
            role: {
              rolePermissions: [{ permission: { action: 'valid', resourceType: 'two' } }],
              rolePermissionGroups: null // Null group array
            }
          },
          {
            role: null // Null role object
          }
        ],
        userGroups: [
          {
            group: {
              permissions: null // Null permissions array
            }
          },
          {
            group: {
              permissions: [{ permission: { action: 'valid', resourceType: 'three' } }]
            }
          },
          null // Null group entry
        ]
      };
      await store.formatPermissions();
      expect(store.permissions).toEqual(
        expect.arrayContaining([
          { action: 'valid', resourceType: 'one' },
          { action: 'valid', resourceType: 'two' },
          { action: 'valid', resourceType: 'three' }
        ])
      );
      // Only the 3 fully valid permissions should remain
      expect(store.permissions.length).toBe(3);
    });

    it('should return an empty array if user has no permissions', async () => {
      const store = useAuthStore();
      store.user = {
        userPermissions: [],
        userRoles: [],
        userGroups: []
      };
      await store.formatPermissions();
      expect(store.permissions).toEqual([]);
    });

    it('should return an empty array if user object is null', async () => {
      const store = useAuthStore();
      store.user = null;
      await store.formatPermissions();
      expect(store.permissions).toEqual([]);
    });
  });

  describe('action: refreshPermissions', () => {
    it('should update user and permissions on success', async () => {
      const store = useAuthStore();
      const { GetCurrentUser } = await import('@/API/user');

      // Initial state
      store.user = { id: 'old-user', name: 'Old User' };
      store.permissions = [{ action: 'initial', resourceType: 'data' }];

      const updatedUserData = {
        id: 'new-user',
        name: 'New User',
        userPermissions: [{ permission: { action: 'refreshed', resourceType: 'data' } }],
        userRoles: [],
        userGroups: []
      };
      const mockApiResponse = { data: updatedUserData, status: 200 };
      vi.mocked(GetCurrentUser).mockResolvedValue(mockApiResponse);

      await store.refreshPermissions();

      expect(store.user).toEqual(updatedUserData);
      expect(store.permissions).toEqual([{ action: 'refreshed', resourceType: 'data' }]);
    });

    it('should call logout on 401 error', async () => {
      const store = useAuthStore();
      const { GetCurrentUser } = await import('@/API/user');
      const { Logout } = await import('@/API/user');
      const { router } = await import('@/router');

      const mockError = new Error('Unauthorized');
      // @ts-ignore - Simulate Axios error structure
      mockError.response = { status: 401 };
      vi.mocked(GetCurrentUser).mockRejectedValue(mockError);

      await store.refreshPermissions();

      expect(Logout).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledWith('/auth/login');
    });

    it('should call logout on 403 error', async () => {
      const store = useAuthStore();
      const { GetCurrentUser } = await import('@/API/user');
      const { Logout } = await import('@/API/user');
      const { router } = await import('@/router');

      const mockError = new Error('Forbidden');
      // @ts-ignore - Simulate Axios error structure
      mockError.response = { status: 403 };
      vi.mocked(GetCurrentUser).mockRejectedValue(mockError);

      await store.refreshPermissions();

      expect(Logout).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledWith('/auth/login');
    });

    it('should not call logout on other errors', async () => {
      const store = useAuthStore();
      const { GetCurrentUser } = await import('@/API/user');
      const { Logout } = await import('@/API/user');
      const { router } = await import('@/router');

      const mockError = new Error('Network Error');
      // @ts-ignore - Simulate Axios error structure
      mockError.response = { status: 500 }; // Example: Internal Server Error
      vi.mocked(GetCurrentUser).mockRejectedValue(mockError);

      await store.refreshPermissions();

      expect(Logout).not.toHaveBeenCalled();
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  // Extend logout tests
  describe('action: logout', () => {
    // Keep existing success test if present, or add one if missing
    it('should reset state and call dependencies on success', async () => {
      const store = useAuthStore();
      const { router } = await import('@/router');
      const { Logout } = await import('@/API/user');

      store.user = { id: 1, name: 'Test User' };
      store.isAuthenticated = true;
      store.permissions = [{ action: 'read', resourceType: 'test' }];
      store.csrfToken = 'test-token';
      store.currentDevice = 'test-device';

      // Ensure Logout resolves successfully
      vi.mocked(Logout).mockResolvedValue(undefined);

      await store.logout();

      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(store.permissions).toEqual([]);
      expect(store.csrfToken).toBeNull();
      expect(store.currentDevice).toBeNull();
      expect(Logout).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledOnce();
      expect(router.push).toHaveBeenCalledWith('/auth/login');
    });

    it('should clear state and redirect even if API call fails', async () => {
      const store = useAuthStore();
      const { router } = await import('@/router');
      const { Logout } = await import('@/API/user');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}); // Mock console.error

      // Set initial authenticated state
      store.user = { id: 2, name: 'Error User' };
      store.isAuthenticated = true;
      store.csrfToken = 'error-token';

      // Mock Logout API to reject
      const logoutError = new Error('Logout API failed');
      vi.mocked(Logout).mockRejectedValue(logoutError);

      await store.logout();

      // Assert state is reset despite API error
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(store.permissions).toEqual([]);
      expect(store.csrfToken).toBeNull();
      expect(store.currentDevice).toBeNull();

      // Assert dependencies were called (or attempted)
      expect(Logout).toHaveBeenCalledOnce(); // Still called
      expect(router.push).toHaveBeenCalledOnce(); // Should still redirect
      expect(router.push).toHaveBeenCalledWith('/auth/login');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', logoutError); // Check console log

      consoleErrorSpy.mockRestore(); // Restore console.error
    });
  });

  // Add more tests here for getters and actions
});
