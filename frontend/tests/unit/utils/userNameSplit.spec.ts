import { describe, it, expect } from 'vitest';
import userNameSplit from '@/utils/userNameSplit';

describe('userNameSplit', () => {
  it('should return initials correctly for a name with multiple parts', () => {
    const user = { Name: 'John van Der Beek' };
    expect(userNameSplit(user)).toBe('JB');
  });

  it('should return the first two letters capitalized for a single name', () => {
    const user = { Name: 'Jane' };
    expect(userNameSplit(user)).toBe('JA');
  });

  it('should handle names with only one part and return the first two letters', () => {
    const user = { Name: 'Doe' };
    expect(userNameSplit(user)).toBe('DO');
  });

  it('should handle names with two parts', () => {
    const user = { Name: 'Peter Jones' };
    expect(userNameSplit(user)).toBe('PJ');
  });

  it('should handle names with leading/trailing spaces (though the function might not trim them)', () => {
    const user = { Name: '  Alice  Smith  ' };
    expect(userNameSplit(user)).toBe('AS');
  });

  it('should handle user object without Name property gracefully', () => {
    const user = { Age: 30 };
    expect(userNameSplit(user)).toBeUndefined();
  });

  it('should handle user object with null Name property gracefully', () => {
    const user = { Name: null };
    expect(userNameSplit(user)).toBeUndefined();
  });

  it('should handle user object with empty Name property gracefully', () => {
    const user = { Name: '' };
    expect(userNameSplit(user)).toBeUndefined();
  });

  it('should handle names with special characters (basic test)', () => {
    const user = { Name: 'Jean-Luc Picard' };
    expect(userNameSplit(user)).toBe('JP');
  });

  it('should handle short single names', () => {
    const user = { Name: 'Al' };
    expect(userNameSplit(user)).toBe('AL');
  });

  it('should handle user being null or undefined', () => {
    expect(userNameSplit(null)).toBeUndefined();
    expect(userNameSplit(undefined)).toBeUndefined();
  });
});
