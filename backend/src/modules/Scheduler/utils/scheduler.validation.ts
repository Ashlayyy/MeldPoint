import { SchedulerConfig, Frequency, SCHEDULER_CONSTANTS } from '../types/scheduler.types';
import parser from 'cron-parser';
import logger from '../../../helpers/loggerInstance';

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SchedulerValidation {
  static validateFrequency(frequency: Frequency): void {
    if (!SCHEDULER_CONSTANTS.VALID_FREQUENCIES.includes(frequency)) {
      throw new ValidationError(`Invalid frequency: ${frequency}`);
    }
  }

  static validateMinutelyInterval(intervalMinutes?: number): void {
    if (intervalMinutes !== undefined && intervalMinutes < SCHEDULER_CONSTANTS.MIN_MINUTE_INTERVAL) {
      throw new ValidationError(`Interval minutes must be at least ${SCHEDULER_CONSTANTS.MIN_MINUTE_INTERVAL}`);
    }
  }

  static validateHourMinute(hour?: number, minute?: number): void {
    if (hour !== undefined && (hour < 0 || hour > 23)) {
      throw new ValidationError('Hour must be between 0 and 23');
    }
    if (minute !== undefined && (minute < 0 || minute > 59)) {
      throw new ValidationError('Minute must be between 0 and 59');
    }
  }

  static validateDayOfWeek(dayOfWeek?: number): void {
    if (dayOfWeek !== undefined && (dayOfWeek < 0 || dayOfWeek > 6)) {
      throw new ValidationError('Day of week must be between 0 and 6 (Sunday = 0)');
    }
  }

  static validateDayOfMonth(dayOfMonth?: number | number[]): void {
    if (dayOfMonth === undefined) return;

    const validateDay = (day: number) => {
      if (day < 1 || day > 31) {
        throw new ValidationError('Day of month must be between 1 and 31');
      }
    };

    if (Array.isArray(dayOfMonth)) {
      if (dayOfMonth.length === 0) {
        throw new ValidationError('Days of month array cannot be empty');
      }
      dayOfMonth.forEach(validateDay);
    } else {
      validateDay(dayOfMonth);
    }
  }

  static validateMonths(months?: number[]): void {
    if (months === undefined) return;

    if (months.length === 0) {
      throw new ValidationError('Months array cannot be empty');
    }

    months.forEach((month) => {
      if (month < 1 || month > 12) {
        throw new ValidationError('Month must be between 1 and 12');
      }
    });
  }

  static validateCronExpression(cronExpression?: string): void {
    if (cronExpression === undefined) return;

    try {
      // Validate by attempting to parse
      parser.parseExpression(cronExpression);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ValidationError(`Invalid cron expression: ${errorMessage}`);
    }
  }

  static validateConfig(config: SchedulerConfig): boolean {
    try {
      if (!config.name) {
        logger.error('[Scheduler Validation] Task name is required');
        return false;
      }

      if (!config.frequency) {
        logger.error('[Scheduler Validation] Task frequency is required');
        return false;
      }

      if (!SCHEDULER_CONSTANTS.VALID_FREQUENCIES.includes(config.frequency as any)) {
        logger.error(`[Scheduler Validation] Invalid frequency: ${config.frequency}`);
        return false;
      }

      if (config.frequency === 'custom_interval') {
        if (!config.intervalMinutes || config.intervalMinutes < SCHEDULER_CONSTANTS.MIN_MINUTE_INTERVAL) {
          logger.error('[Scheduler Validation] Invalid interval minutes for custom_interval frequency');
          return false;
        }
      }

      if (
        config.frequency === 'weekly' &&
        (config.dayOfWeek === undefined || config.dayOfWeek < 0 || config.dayOfWeek > 6)
      ) {
        logger.error('[Scheduler Validation] Day of week is required for weekly frequency and must be between 0-6');
        return false;
      }

      if (config.frequency === 'monthly' && !config.useLastDayOfMonth) {
        const dayOfMonth = Array.isArray(config.dayOfMonth) ? config.dayOfMonth[0] : config.dayOfMonth;
        if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
          logger.error(
            '[Scheduler Validation] Day of month is required for monthly frequency and must be between 1-31'
          );
          return false;
        }
      }

      if (
        config.frequency === 'yearly' &&
        (!config.months || !Array.isArray(config.months) || config.months.length === 0)
      ) {
        logger.error('[Scheduler Validation] At least one month is required for yearly frequency');
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`[Scheduler Validation] Unexpected error during validation: ${error}`);
      return false;
    }
  }
}
