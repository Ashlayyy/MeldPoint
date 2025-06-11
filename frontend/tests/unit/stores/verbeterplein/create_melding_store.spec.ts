import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCreateMeldingStore } from '@/stores/verbeterplein/create_melding_store';

describe('Create Melding Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with default state', () => {
    const store = useCreateMeldingStore();
    expect(store.obstakel).toBeNull();
    expect(store.project).toEqual({});
    expect(store.rawproject).toEqual({});
    expect(store.correctief).toEqual({});
    expect(store.bijlagen).toEqual([]);
    expect(store.projectleider).toBeNull();
    expect(store.correctiefSkipped).toBe(false);
  });

  it('clear action resets state to default', () => {
    const store = useCreateMeldingStore();

    // Modify state
    store.obstakel = 'Some Obstakel';
    store.project = { id: 1, name: 'Test Project' };
    store.rawproject = { raw: 'data' };
    store.correctief = { issue: 'some issue' };
    store.bijlagen = [{ name: 'file1.txt' }];
    store.projectleider = { id: 'user1', name: 'Leader' };
    store.correctiefSkipped = true;

    // Verify state is modified
    expect(store.obstakel).toBe('Some Obstakel');
    expect(store.correctiefSkipped).toBe(true);

    // Call clear action
    store.clear();

    // Verify state is reset
    expect(store.obstakel).toBeNull();
    expect(store.project).toEqual({});
    expect(store.rawproject).toEqual({});
    expect(store.correctief).toEqual({});
    expect(store.bijlagen).toEqual([]);
    expect(store.projectleider).toBeNull();
    expect(store.correctiefSkipped).toBe(false);
  });

  // Add tests for getters and actions
});
