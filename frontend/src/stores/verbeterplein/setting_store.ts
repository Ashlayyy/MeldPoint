import { defineStore } from 'pinia';
import { useCustomizerStore } from '../customizer';

export type Theme = 'light' | 'dark' | 'system';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'light' as Theme,
    notificationsEnabled: true,
    lastUpdated: new Date()
  }),

  getters: {
    isDarkTheme(): boolean {
      if (this.theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return this.theme === 'dark';
    }
  },

  actions: {
    setTheme(newTheme: Theme) {
      this.theme = newTheme;
      this.lastUpdated = new Date();
    },

    initializeTheme() {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (this.theme === 'system') {
          this.applyTheme();
        }
      });

      this.applyTheme();
    },

    applyTheme() {
      const isDark = this.isDarkTheme;
      const customizer = useCustomizerStore();
      customizer.SET_THEME(isDark ? 'DarkPurpleTheme' : 'PurpleTheme');
    }
  },

  persist: true
});
