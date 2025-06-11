import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export type Context = {
  prisma: PrismaClient;
};

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
};

export const createMockContext = (): MockContext => {
  return {
    prisma: mockDeep<PrismaClient>()
  };
};

export const createTestContext = (ctx: MockContext): Context => {
  return ctx as unknown as Context;
};

// Helper function to create test data
export const createTestBackup = (overrides = {}) => {
  return {
    id: 'test-backup-id',
    createdAt: new Date(),
    name: 'Test Backup',
    size: '1.2MB',
    path: '/backups/test-backup.zip',
    userId: 'test-user',
    ...overrides
  };
};

// Helper function to create test user
export const createTestUser = (overrides = {}) => {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
    ...overrides
  };
};
