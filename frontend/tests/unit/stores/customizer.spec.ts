import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCustomizerStore } from '@/stores/customizer';
import config from '@/config'; // Import config to check initial values

describe('Customizer Store', () => {
  beforeEach(() => {
    // creates a fresh pinia and make it active so it's automatically picked
    // up by any useStore() call without having to pass it to it:
    // `useStore(pinia)`
    setActivePinia(createPinia());
  });

  it('initializes with default state from config', () => {
    const store = useCustomizerStore();
    expect(store.Sidebar_drawer).toBe(config.Sidebar_drawer);
    expect(store.Customizer_drawer).toBe(config.Customizer_drawer);
    expect(store.mini_sidebar).toBe(config.mini_sidebar);
    expect(store.setHorizontalLayout).toBe(config.setHorizontalLayout);
    expect(store.actTheme).toBe(config.actTheme);
    expect(store.fontTheme).toBe(config.fontTheme);
    expect(store.inputBg).toBe(config.inputBg);
    expect(store.boxed).toBe(config.boxed);
  });

  it('SET_SIDEBAR_DRAWER toggles Sidebar_drawer state', () => {
    const store = useCustomizerStore();
    const initialState = store.Sidebar_drawer;
    store.SET_SIDEBAR_DRAWER();
    expect(store.Sidebar_drawer).toBe(!initialState);
    store.SET_SIDEBAR_DRAWER(); // Toggle back
    expect(store.Sidebar_drawer).toBe(initialState);
  });

  it('SET_MINI_SIDEBAR updates mini_sidebar state', () => {
    const store = useCustomizerStore();
    expect(store.mini_sidebar).toBe(config.mini_sidebar); // Initial state
    store.SET_MINI_SIDEBAR(true);
    expect(store.mini_sidebar).toBe(true);
    store.SET_MINI_SIDEBAR(false);
    expect(store.mini_sidebar).toBe(false);
  });

  it('SET_CUSTOMIZER_DRAWER updates Customizer_drawer state', () => {
    const store = useCustomizerStore();
    expect(store.Customizer_drawer).toBe(config.Customizer_drawer); // Initial state
    store.SET_CUSTOMIZER_DRAWER(true);
    expect(store.Customizer_drawer).toBe(true);
    store.SET_CUSTOMIZER_DRAWER(false);
    expect(store.Customizer_drawer).toBe(false);
  });

  it('SET_LAYOUT updates setHorizontalLayout state', () => {
    const store = useCustomizerStore();
    expect(store.setHorizontalLayout).toBe(config.setHorizontalLayout); // Initial state
    store.SET_LAYOUT(true);
    expect(store.setHorizontalLayout).toBe(true);
    store.SET_LAYOUT(false);
    expect(store.setHorizontalLayout).toBe(false);
  });

  it('SET_THEME updates actTheme state', () => {
    const store = useCustomizerStore();
    const newTheme = 'NewThemeName';
    expect(store.actTheme).toBe(config.actTheme); // Initial state
    store.SET_THEME(newTheme);
    expect(store.actTheme).toBe(newTheme);
  });

  it('SET_FONT updates fontTheme state', () => {
    const store = useCustomizerStore();
    const newFont = 'NewFontName';
    expect(store.fontTheme).toBe(config.fontTheme); // Initial state
    store.SET_FONT(newFont);
    expect(store.fontTheme).toBe(newFont);
  });

  // Add more tests for getters and actions
});
