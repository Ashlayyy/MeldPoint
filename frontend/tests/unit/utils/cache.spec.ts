import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import the specific instance or the class if needed for multiple instances
// Testing the exported singleton instance here
import { cacheService } from '@/utils/cache';

describe('CacheService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clear the cache before each test to ensure isolation
    cacheService.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should set and get a value', () => {
    const key = 'testKey';
    const value = { id: 1, name: 'TestData' };
    cacheService.set(key, value);
    expect(cacheService.get(key)).toEqual(value);
  });

  it('should return null for a non-existent key', () => {
    expect(cacheService.get('nonExistentKey')).toBeNull();
  });

  it('should overwrite an existing key', () => {
    const key = 'overwriteKey';
    const value1 = 'value1';
    const value2 = 'value2';
    cacheService.set(key, value1);
    cacheService.set(key, value2);
    expect(cacheService.get(key)).toBe(value2);
  });

  it('should remove a key', () => {
    const key = 'removeKey';
    const value = 'valueToRemove';
    cacheService.set(key, value);
    expect(cacheService.get(key)).toBe(value);
    cacheService.remove(key);
    expect(cacheService.get(key)).toBeNull();
  });

  it('should clear the entire cache', () => {
    cacheService.set('key1', 'value1');
    cacheService.set('key2', 'value2');
    cacheService.clear();
    expect(cacheService.get('key1')).toBeNull();
    expect(cacheService.get('key2')).toBeNull();
    // @ts-expect-error Accessing private member for test verification
    expect(cacheService.cache.size).toBe(0);
  });

  it('should respect the default TTL (5 minutes)', () => {
    const key = 'ttlKeyDefault';
    const value = 'ttlValue';
    const defaultTTL = 5 * 60 * 1000;

    cacheService.set(key, value);

    // Should exist just before expiring
    vi.advanceTimersByTime(defaultTTL - 1);
    expect(cacheService.get(key)).toBe(value);

    // Should be null exactly at expiration time
    vi.advanceTimersByTime(1);
    expect(cacheService.get(key)).toBeNull();
  });

  it('should respect a custom TTL', () => {
    const key = 'ttlKeyCustom';
    const value = 'ttlValueCustom';
    const customTTL = 1000; // 1 second

    cacheService.set(key, value, { ttl: customTTL });

    // Should exist just before expiring
    vi.advanceTimersByTime(customTTL - 1);
    expect(cacheService.get(key)).toBe(value);

    // Should be null exactly at expiration time
    vi.advanceTimersByTime(1);
    expect(cacheService.get(key)).toBeNull();
  });

  it('should return null and delete the item when TTL expires upon get', () => {
    const key = 'ttlExpireOnGetKey';
    const value = 'expireOnGet';
    const ttl = 2000;

    cacheService.set(key, value, { ttl });

    // Advance time past TTL
    vi.advanceTimersByTime(ttl + 1);

    // First get should return null
    expect(cacheService.get(key)).toBeNull();

    // Verify the item was deleted from the underlying map
    // @ts-expect-error Accessing private member for test verification
    expect(cacheService.cache.has(key)).toBe(false);
  });

  it('should store various data types', () => {
    const key1 = 'stringKey';
    const value1 = 'a string';
    const key2 = 'numberKey';
    const value2 = 123;
    const key3 = 'booleanKey';
    const value3 = true;
    const key4 = 'nullKey';
    const value4 = null;
    const key5 = 'undefinedKey';
    const value5 = undefined;

    cacheService.set(key1, value1);
    cacheService.set(key2, value2);
    cacheService.set(key3, value3);
    cacheService.set(key4, value4);
    cacheService.set(key5, value5);

    expect(cacheService.get(key1)).toBe(value1);
    expect(cacheService.get(key2)).toBe(value2);
    expect(cacheService.get(key3)).toBe(value3);
    expect(cacheService.get(key4)).toBe(value4);
    expect(cacheService.get(key5)).toBe(value5);
  });
});
