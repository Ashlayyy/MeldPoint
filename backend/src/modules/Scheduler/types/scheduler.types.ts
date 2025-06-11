export type Frequency =
  | 'minutely'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom_interval'
  | 'cron';

export interface TaskExecution {
  id: string;
  taskId: string;
  startTime: Date;
  endTime: Date | null;
  status: string;
  error: string | null;
  duration: number | null;
  attempt: number;
  triggeredBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchedulerConfig {
  name: string;
  frequency: Frequency;
  hour?: number;
  minute?: number;
  intervalMinutes?: number;
  dayOfWeek?: number;
  dayOfMonth?: number | number[];
  useLastDayOfMonth?: boolean;
  months?: number[];
  cronExpression?: string;
  maxRetries?: number;
  retryDelay?: number;
  skipWeekends?: boolean;
  task: () => Promise<void>;
}

export interface TaskExecutionResult {
  success: boolean;
  error?: string;
  duration: number;
}

export interface TaskStatus {
  name: string;
  enabled: boolean;
  isRunning: boolean;
  nextRun: Date;
  lastRun?: Date | null;
  lastExecution?: TaskExecution | null | undefined;
  retryCount: number;
  status: string;
}

export interface CreateScheduledTaskInput {
  name: string;
  frequency: string;
  hour: number;
  minute: number;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  maxRetries?: number;
  retryDelay?: number;
  enabled?: boolean;
  nextRun: Date;
  status?: string;
  retryCount?: number;
}

export interface UpdateTaskExecutionInput {
  lastRun?: Date;
  nextRun?: Date;
  retryCount?: number;
  status?: string;
  lastError?: string;
  enabled?: boolean;
}

// Validation constants
export const SCHEDULER_CONSTANTS = {
  MIN_MINUTE_INTERVAL: 1,
  DEFAULT_RETRY_DELAY: 15,
  DEFAULT_MAX_RETRIES: 3,
  VALID_FREQUENCIES: [
    'minutely',
    'hourly',
    'daily',
    'weekly',
    'monthly',
    'quarterly',
    'yearly',
    'custom_interval',
    'cron'
  ] as const
};
