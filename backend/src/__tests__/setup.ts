import '@testing-library/jest-dom';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn()
}));

// Global type declarations
declare global {
  namespace NodeJS {
    interface Global {
      prisma: DeepMockProxy<PrismaClient>;
    }
  }
}

// Setup global mocks
beforeAll(() => {
  const mockPrisma = mockDeep<PrismaClient>();
  (global as any).prisma = mockPrisma;
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

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

export let mockCtx: MockContext;
export let ctx: Context;

beforeEach(() => {
  mockCtx = createMockContext();
  ctx = mockCtx as unknown as Context;
  mockReset(mockCtx.prisma);
});

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
