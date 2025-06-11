const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: true
  },
  redirect: '/main/dashboard',
  component: () => import('@/layouts/full/FullLayout.vue'),
  children: [
    {
      name: 'Default',
      path: '/dashboard/default',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
    },

    // Todos Route
    {
      name: 'tasks',
      path: '/tasks',
      component: () => import('@/views/tasks/TasksPage.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'MELDING' }]
      }
    },

    {
      name: 'changelog',
      path: '/changelog',
      component: () => import('@/views/changelog/ChangelogPage.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'MELDING' }]
      }
    },

    // Verbeterplein Routes
    {
      name: 'Verbeterplein Overzicht',
      path: '/verbeterplein/overzicht',
      component: () => import('@/views/verbeterplein/Verbeterplein.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'MELDING' }]
      }
    },
    {
      name: 'Verbeterplein Item',
      path: '/verbeterplein/overzicht/:id',
      component: () => import('@/views/verbeterplein/Verbeterplein.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'MELDING' }]
      },
      props: true
    },
    {
      name: 'Verbeterplein Tab',
      path: '/verbeterplein/melding/:id/:tab?',
      component: () => import('@/views/verbeterplein/Verbeterplein.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'MELDING' }]
      },
      props: true
    },

    {
      name: 'Geo Overzicht',
      path: '/geo-overzicht',
      component: () => import('@/views/projects/GeoOverzicht.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },

    {
      name: 'Project administratie',
      path: '/projects/administration',
      component: () => import('@/views/projects/ProjectAdministration.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'MELDING' }]
      }
    },

    // Admin
    {
      name: 'AdminIssues',
      path: '/admin/issues',
      component: () => import('@/components/admin/IssuesPanel.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },
    {
      name: 'backup',
      path: '/admin/backup',
      component: () => import('@/views/admin/BackupRoute.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },
    {
      name: 'backup-restore',
      path: '/admin/backup/restore/:selectedBackupId?',
      component: () => import('@/views/admin/BackupRestore.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },
    {
      name: 'BackupRestore',
      path: '/verbeterplein/migrate',
      component: () => import('@/views/admin/BackupRestore.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },
    {
      name: 'Backup',
      path: '/verbeterplein/backup',
      component: () => import('@/views/admin/BackupRoute.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },
    {
      name: 'Gebruikers',
      path: '/beheer/gebruikers',
      component: () => import('@/views/admin/userManagment/users.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },
    {
      name: 'Roles',
      path: '/beheer/roles',
      component: () => import('@/views/admin/userManagment/roles.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },
    {
      name: 'Permissions',
      path: '/beheer/permissions',
      component: () => import('@/views/admin/userManagment/permissions.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },
    {
      name: 'Departments',
      path: '/beheer/departments',
      component: () => import('@/views/admin/departments/DepartmentManager.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },
    {
      name: 'Email Overzicht',
      path: '/emails/overview',
      component: () => import('@/views/admin/email/overview.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },
    {
      name: 'Notification Tester',
      path: '/admin/notifications/test',
      component: () => import('@/views/admin/notifications/NotificationTester.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },
    {
      name: 'Scheduler Tester',
      path: '/admin/scheduler/test',
      component: () => import('@/views/admin/SchedulerTester.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },
    {
      name: 'Email Templates',
      path: '/emails/templates',
      component: () => import('@/views/admin/email/templates.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },
    {
      name: 'API Keys',
      path: '/beheer/api-keys',
      component: () => import('@/views/admin/apiKeys/ApiKeyManager.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    },

    {
      name: 'Settings',
      path: '/app/user/account-profile/profile',
      component: () => import('@/views/apps/users/account-profile/profile1/ProfilePage1.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'MELDING' }]
      }
    },

    // GitHub Issues Routes
    {
      name: 'GitHub Issues',
      path: '/issues',
      component: () => import('@/views/github/MyIssues.vue'),
      meta: {
        permissions: [{ action: 'READ', resourceType: 'MELDING' }]
      }
    },
    {
      name: 'GitHub Issues Admin',
      path: '/beheer/github/issues',
      component: () => import('@/views/admin/github/IssuesAdmin.vue'),
      meta: {
        permissions: [{ action: 'MANAGE', resourceType: 'ALL' }]
      }
    }
  ]
};

export default MainRoutes;
