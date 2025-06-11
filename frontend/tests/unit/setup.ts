import { config } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import messages from '@/utils/locales/messages';
import { beforeEach, afterEach, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes: []
});

// Create Vuetify instance
export function createVuetifyInstance() {
  return createVuetify({
    components,
    directives
  });
}

// Create i18n instance
export function createI18nInstance() {
  return createI18n({
    legacy: false,
    locale: 'nl',
    messages,
    fallbackLocale: 'nl',
    silentTranslationWarn: true,
    silentFallbackWarn: true
  });
}

// Setup before each test
beforeEach(() => {
  // Create fresh Pinia instance
  const pinia = createPinia();
  setActivePinia(pinia);
});

// Mock window properties
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver
});

// Mock CSS imports
vi.mock('vuejs3-datepicker', () => ({
  default: {
    name: 'DatePicker',
    render: () => null
  }
}));

// Mock CSS modules
vi.mock('virtual:.*\\.css', () => ({ default: {} }));
vi.mock('.*\\.css$', () => ({ default: {} }));

// Mock environment variables
vi.stubGlobal('import.meta.env.VITE_NODE_ENV', 'test');

// Clear all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Export for use in tests
export { router };
