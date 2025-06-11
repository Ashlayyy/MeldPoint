/// <reference types="vitest" />
/// <reference types="vite/client" />
/// <reference types="@types/jest" />

import type { ComponentPublicInstance } from 'vue';
import type { mount } from '@vue/test-utils';

declare global {
  interface Window {
    matchMedia: (query: string) => {
      matches: boolean;
      media: string;
      onchange: null;
      addListener: jest.Mock;
      removeListener: jest.Mock;
      addEventListener: jest.Mock;
      removeEventListener: jest.Mock;
      dispatchEvent: jest.Mock;
    };
  }
}

declare module 'vitest' {
  export interface TestContext {
    wrapper: ReturnType<typeof mount>;
    component: ComponentPublicInstance;
  }
}

export {};
