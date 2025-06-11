/* eslint-disable no-promise-executor-return */
/* eslint-disable prefer-exponentiation-operator */
/* eslint-disable import/prefer-default-export */
import logger from './loggerInstance';

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 100, // 100ms
  maxDelay: 3000 // 3 seconds
};

export async function withDatabaseRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts, initialDelay, maxDelay } = { ...DEFAULT_OPTIONS, ...options };
  let attempt = 1;
  let lastError: Error | null = null;

  while (attempt <= maxAttempts!) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        throw error;
      }

      if (attempt === maxAttempts) {
        logger.error(
          `Database operation failed after ${maxAttempts} attempts. ${JSON.stringify({
            error: error.message,
            code: error.code
          })}`
        );
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay! * 2 ** (attempt - 1), maxDelay!);

      logger.warn(
        `Database operation failed, retrying in ${delay}ms. ${JSON.stringify({
          attempt,
          maxAttempts,
          error: error.message
        })}`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
    }
  }

  throw lastError || new Error('Database operation failed');
}
