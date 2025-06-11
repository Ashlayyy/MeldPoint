/* eslint-disable no-void */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-shadow */
/* eslint-disable no-control-regex */
/* eslint-disable @typescript-eslint/no-shadow */
import 'dotenv/config';
import { AsyncLocalStorage } from 'node:async_hooks';
import { hostname, type, arch, release, loadavg, cpus } from 'os';
import winston, { format, Logger as WinstonLogger } from 'winston';
import chalk from 'chalk';
import DailyRotateFile from 'winston-daily-rotate-file';
import moment from 'moment';
import SigNozHelper from '../../integrations/Signoz/LoggerHTTP';

// Enhanced context for better tracing
interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  source?: string;
  correlationId?: string;
  [key: string]: any;
}

// Create a singleton instance for context storage
const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

// Enhanced performance metrics
interface EnhancedPerformanceMetrics {
  memory: {
    heapTotal: number;
    heapUsed: number;
    rss: number;
    external: number;
    heapUsedPercentage: number;
  };
  cpu: {
    user: number;
    system: number;
    loadAverage: number[];
    cores: number;
    utilization: number;
  };
  eventLoop: {
    latency: number;
    lag: number;
  };
}

interface LogMetadata {
  timestamp: string;
  level: string;
  message: any;
  context: LogContext;
  host: {
    name: string;
    type: string;
    arch: string;
    release: string;
  };
  environment: string;
  service: string;
  tags: {
    environment: string;
    region?: string;
    datacenter?: string;
    version: string;
    deployment?: string;
    [key: string]: string | undefined;
  };
  performanceMetrics?: EnhancedPerformanceMetrics;
}

export default class Logger {
  private readonly severityMap: { [key: string]: number } = {
    error: 1,
    warn: 2,
    info: 3,
    debug: 4
  };

  private logger: WinstonLogger;

  private env: string;

  private serviceName: string;

  private defaultContext: LogContext = {};

  private version: string;

  private lastEventLoopCheck: number = Date.now();

  constructor() {
    this.env = process.env.ENABLE_DEV_LOGS === 'true' ? 'development' : process.env.NODE_ENV || 'development';
    this.serviceName = process.env.SERVICE_NAME || 'aluminate-server';
    this.version = process.env.VERSION || '1.0.0';

    const { combine, timestamp, printf } = format;

    // Custom format with colors for console
    const consoleFormat = printf(({ level, message, timestamp }: any) => {
      const timestampColored = chalk.gray(`${timestamp}`);
      const levelColors: { [key: string]: string } = {
        info: chalk.blue(level),
        warn: chalk.yellow(level),
        error: chalk.red(level),
        debug: chalk.magenta(level),
        http: chalk.cyan(level),
        verbose: chalk.green(level)
      };

      const levelColored = levelColors[level] || chalk.blue(level);
      const context = this.getLogContext();
      const contextStr = Object.keys(context).length
        ? chalk.gray(` [${JSON.stringify(this.sanitizeMessage(context))}]`)
        : '';

      return `${timestampColored} [${levelColored}]: ${this.sanitizeMessage(message)}${contextStr}`;
    });

    // Structured JSON format for file logging
    const fileFormat = printf((info: any): string => {
      const logData: LogMetadata = {
        timestamp: moment().format(),
        level: info.level,
        message: this.sanitizeMessage(info.message),
        context: this.sanitizeMessage(this.getLogContext()),
        host: {
          name: hostname(),
          type: type(),
          arch: arch(),
          release: release()
        },
        environment: this.env,
        service: this.serviceName,
        tags: {
          environment: this.env,
          version: this.version
        }
      };

      if (info.level === 'debug') {
        logData.performanceMetrics = this.gatherPerformanceMetrics();
      }

      return JSON.stringify(logData);
    });

    const dailyRotateFileOptions = {
      datePattern: 'DD-MM-YYYY',
      maxSize: '50m',
      maxFiles: '21d',
      zippedArchive: true,
      auditFile: 'logs/audit.json'
    };

    const appLogTransport = new DailyRotateFile({
      ...dailyRotateFileOptions,
      dirname: `logs/${moment().format('YYYY')}/${moment().format('MM')}/%DATE%`,
      filename: '/API-DEBUG.log',
      level: 'debug',
      format: combine(timestamp(), fileFormat)
    });

    const errorLogTransport = new DailyRotateFile({
      ...dailyRotateFileOptions,
      dirname: `logs/${moment().format('YYYY')}/${moment().format('MM')}/%DATE%`,
      filename: '/API-ERROR.log',
      level: 'error',
      format: combine(timestamp(), fileFormat)
    });

    this.setupRotationHandlers(appLogTransport);
    this.setupRotationHandlers(errorLogTransport);

    this.logger = winston.createLogger({
      level: process.env.ENABLE_DEV_LOGS === 'true' ? 'debug' : 'info',
      transports: [
        new winston.transports.Console({
          format: combine(timestamp(), consoleFormat)
        }),
        appLogTransport,
        errorLogTransport
      ]
    });
  }

  private setupRotationHandlers(transport: DailyRotateFile): void {
    // Removed custom handlers to rely on built-in functionality
    // transport.on('rotate', ...);
    // transport.on('archive', ...);
    // Optional: You might want to add simple logging here if needed
    // transport.on('rotate', (oldFilename: string, newFilename: string) => {
    //   this.logger.info('Log rotation occurred', { oldFile: oldFilename, newFile: newFilename });
    // });
    // transport.on('archive', (zipFilename: string) => {
    //   this.logger.info('Log archived', { archive: zipFilename });
    // });
  }

  private formatError(error: Error): Record<string, unknown> {
    const formattedError: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').map((line) => line.trim()),
      cause: error.cause,
      code: (error as any).code,
      statusCode: (error as any).statusCode,
      details: (error as any).details
    };

    // Add additional error properties
    Object.entries(error).forEach(([key, value]) => {
      if (!Object.prototype.hasOwnProperty.call(formattedError, key)) {
        formattedError[key] = value;
      }
    });

    return formattedError;
  }

  private sanitizeMessage(message: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'credit_card', 'authorization'];

    if (typeof message === 'object' && message !== null) {
      return Object.keys(message).reduce(
        (acc: any, key) => {
          const value = message[key];
          if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
            acc[key] = '***REDACTED***';
          } else if (typeof value === 'object' && value !== null) {
            acc[key] = this.sanitizeMessage(value);
          } else {
            acc[key] = value;
          }
          return acc;
        },
        Array.isArray(message) ? [] : {}
      );
    }
    return message;
  }

  private gatherPerformanceMetrics(): EnhancedPerformanceMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const numCpus = cpus().length;

    // Calculate CPU utilization percentage
    const totalCpuTime = cpuUsage.user + cpuUsage.system;
    const cpuUtilization = (totalCpuTime / (numCpus * 1e6)) * 100; // Convert to percentage

    return {
      memory: {
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        rss: memoryUsage.rss,
        external: memoryUsage.external,
        heapUsedPercentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        loadAverage: loadavg(),
        cores: numCpus,
        utilization: cpuUtilization
      },
      eventLoop: {
        latency: this.getEventLoopLatency(),
        lag: this.getEventLoopLag()
      }
    };
  }

  private getEventLoopLatency(): number {
    const startTime = process.hrtime();
    const diff = process.hrtime(startTime);
    const latency = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds

    // Store the measurement time for lag calculation
    this.lastEventLoopCheck = Date.now();

    return latency;
  }

  private getEventLoopLag(): number {
    const now = Date.now();
    const lag = now - this.lastEventLoopCheck;
    this.lastEventLoopCheck = now;
    return lag;
  }

  setLogLevel(level: string, duration?: number): void {
    const validLevels = ['error', 'warn', 'info', 'debug'];
    if (!validLevels.includes(level)) {
      throw new Error(`Invalid log level. Must be one of: ${validLevels.join(', ')}`);
    }

    this.logger.level = level;

    if (duration) {
      setTimeout(() => {
        this.logger.level = this.env === 'development' ? 'debug' : 'info';
        this.info(`Log level restored to ${this.logger.level} after temporary change`);
      }, duration);

      this.info(`Log level temporarily set to ${level} for ${duration}ms`);
    } else {
      this.info(`Log level changed to ${level}`);
    }
  }

  // Enhanced error handling
  error(message: any, error?: Error, context?: Partial<LogContext>): void {
    if (context) this.setContext(context);

    const errorMessage = {
      message,
      error: error ? this.formatError(error) : undefined,
      context: this.getLogContext(),
      timestamp: new Date().toISOString()
    };

    this.logger.error(this.sanitizeMessage(errorMessage));
    // Fire and forget
    this.sendToSigNoz('error', errorMessage);
  }

  // Context management methods
  private getLogContext(): LogContext {
    return asyncLocalStorage.getStore() || this.defaultContext;
  }

  setContext(context: Partial<LogContext>): void {
    const currentContext = this.getLogContext();
    const newContext = { ...currentContext, ...context };

    // If we're already in an async context, update it
    if (asyncLocalStorage.getStore()) {
      asyncLocalStorage.enterWith(newContext);
    } else {
      // Otherwise, store in default context
      this.defaultContext = newContext;
    }
  }

  clearContext(): void {
    this.defaultContext = {};
    if (asyncLocalStorage.getStore()) {
      asyncLocalStorage.enterWith({});
    }
  }

  // Create an async context for request handling
  createRequestContext<T>(context: LogContext, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      asyncLocalStorage.run({ ...this.defaultContext, ...context }, async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Enhanced logging methods with context support
  info(message: any, context?: Partial<LogContext>): void {
    if (context) this.setContext(context);
    this.logger.info(message);
    void this.sendToSigNoz('info', message);
  }

  warn(message: any, context?: Partial<LogContext>): void {
    if (context) this.setContext(context);
    this.logger.warn(message);
    void this.sendToSigNoz('warn', message);
  }

  debug(message: any, context?: Partial<LogContext>): void {
    if (context) this.setContext(context);
    this.logger.debug(message);
    void this.sendToSigNoz('debug', message);
  }

  private sendToSigNoz(severity: string, message: any) {
    const context = this.getLogContext();
    SigNozHelper.log(message, {
      severityText: severity,
      severityNumber: this.getSeverityNumber(severity),
      attributes: context,
      resources: {
        service: this.serviceName,
        environment: this.env
      }
    });
  }

  private getSeverityNumber(severity: string): number {
    return this.severityMap[severity] || 9;
  }

  async shutdown(): Promise<void> {
    try {
      // Wait for any pending logs to be processed
      await SigNozHelper.destroy();

      // Close Winston transports
      await new Promise<void>((resolve) => {
        this.logger.on('finish', resolve);
        this.logger.end();
      });
    } catch (error) {
      console.error('Error during logger shutdown:', error);
    }
  }
}
