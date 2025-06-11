import { createRouter, createWebHistory } from 'vue-router';
import { watch } from 'vue';
import { push } from 'notivue';
import i18n from '../main';
import MainRoutes from './MainRoutes';
import AuthRoutes from './AuthRoutes';
import { useAuthStore } from '@/stores/auth';
import { usePermissionGuard, useDisabledGuard } from './routerGuard';
import { getCsrfToken } from '@/utils/csrf';
import posthog from '@/plugins/posthog';
const dev = import.meta.env.DEV;

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/pages/maintenance/error/Error404Page.vue')
    },
    MainRoutes,
    AuthRoutes
  ]
});

router.beforeEach(async (to, from, next) => {
  const toolbarJSON = new URLSearchParams(window.location.hash.substring(1)).get('__posthog');
  if (toolbarJSON && !dev) {
    posthog?.loadToolbar(JSON.parse(toolbarJSON));
  }

  if (from.path !== to.path && !dev) {
    posthog?.capture('$pageleave');
  }

  const authStore = useAuthStore();
  const { t } = i18n.global;
  const { hasPermission } = usePermissionGuard();
  const { validateRouteDisabled } = useDisabledGuard();
  const publicPages = ['/auth/login', '/auth/callback'];
  const authRequired = !publicPages.includes(to.path);

  if (authStore.isLoading) {
    await new Promise((resolve) => {
      const unwatch = watch(
        () => authStore.isLoading,
        (isLoading) => {
          if (!isLoading) {
            unwatch();
            resolve(true);
          }
        }
      );
    });
  }

  if (!validateRouteDisabled(to)) {
    return next('/');
  }

  if (authRequired) {
    const isAuthenticated = await authStore.checkAuth();
    if (!isAuthenticated) {
      if (to.path !== '/') {
        localStorage.setItem('redirectPath', to.fullPath);
      }
      return next('/auth/login');
    }
    if (!authStore.csrfToken) {
      await getCsrfToken();
    }
    if (to.meta?.permissions) {
      if (!hasPermission(Array.isArray(to.meta.permissions) ? to.meta.permissions : [to.meta.permissions])) {
        next('/');
        push.error({
          title: t('errors.no_permission'),
          message: t('errors.no_permission_message')
        });
        return;
      }
    }
  } else if (!authRequired && authStore.isAuthenticated) {
    if (to.path === '/auth/login') {
      const redirectPath = localStorage.getItem('redirectPath') || '/';
      localStorage.removeItem('redirectPath');
      return next(redirectPath);
    }
  }

  next();
});

router.afterEach((to) => {
  if (!dev) {
    posthog?.capture('$pageview');
  }
});
