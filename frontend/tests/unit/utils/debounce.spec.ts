import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '@/utils/debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers(); // Restore real timers after each test
  });

  it('should call the function only once after the wait time', () => {
    const func = vi.fn();
    const wait = 100;
    const debouncedFunc = debounce(func, wait);

    debouncedFunc();
    debouncedFunc();
    debouncedFunc();

    // Should not be called yet
    expect(func).not.toHaveBeenCalled();

    // Fast-forward time
    vi.advanceTimersByTime(wait);

    // Now it should have been called once
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should call the function with the latest arguments', () => {
    const func = vi.fn();
    const wait = 100;
    const debouncedFunc = debounce(func, wait);

    debouncedFunc(1);
    debouncedFunc(2);
    debouncedFunc(3);

    vi.advanceTimersByTime(wait);

    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith(3);
  });

  it('should reset the timer if called again within the wait time', () => {
    const func = vi.fn();
    const wait = 100;
    const debouncedFunc = debounce(func, wait);

    debouncedFunc(); // Call 1
    vi.advanceTimersByTime(wait / 2); // Advance time, but not enough to trigger
    expect(func).not.toHaveBeenCalled();

    debouncedFunc(); // Call 2 - this should reset the timer
    vi.advanceTimersByTime(wait / 2); // Advance time again, still not enough from the *second* call
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(wait / 2); // Advance the remaining time for the second call
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should work with a wait time of 0', () => {
    const func = vi.fn();
    const wait = 0;
    const debouncedFunc = debounce(func, wait);

    debouncedFunc();
    expect(func).not.toHaveBeenCalled(); // Should not be called synchronously

    vi.advanceTimersByTime(0); // Advance timers by 0 ms

    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple separate calls correctly', () => {
    const func = vi.fn();
    const wait = 100;
    const debouncedFunc = debounce(func, wait);

    // First call sequence
    debouncedFunc(1);
    vi.advanceTimersByTime(wait);
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith(1);

    // Second call sequence, completely separate
    debouncedFunc(2);
    debouncedFunc(3);
    vi.advanceTimersByTime(wait);
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenNthCalledWith(2, 3);
  });
});
