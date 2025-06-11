/* eslint-disable class-methods-use-this */
import { v4 as uuidv4 } from 'uuid';

interface SigNozOptions {
  severityText?: string;
  severityNumber?: number;
  attributes?: any;
  resources?: any;
}

interface LogEntry {
  message: string;
  options: SigNozOptions;
  timestamp: number;
  trace_id: string;
  span_id: string;
}

class SigNozHelper {
  private queue: LogEntry[] = [];
  private isProcessing = false;
  private readonly MAX_QUEUE_SIZE = 1000;
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL = 5000;
  private readonly MAX_RETRIES = 3;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushTimer();
  }

  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.processQueue().catch(() => {
        // Silent catch as errors are handled in processQueue
      });
    }, this.FLUSH_INTERVAL);
  }

  getTraceId(): string {
    return uuidv4();
  }

  log(message: string, options: SigNozOptions): void {
    if (process.env.SEND_LOGS_TO_SIGNOZ !== 'true') {
      return;
    }

    const logEntry: LogEntry = {
      message,
      options,
      timestamp: new Date().getTime(),
      trace_id: this.getTraceId().replace(/-/g, ''),
      span_id: this.getTraceId().replace(/-/g, '')
    };

    // Add to queue if there's space
    if (this.queue.length < this.MAX_QUEUE_SIZE) {
      this.queue.push(logEntry);
    } else {
      console.warn('SigNoz log queue is full, dropping log message');
    }

    if (!this.isProcessing) {
      this.processQueue().catch(() => {});
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        // Take a batch of logs
        const batch = this.queue.splice(0, this.BATCH_SIZE);

        // Format logs for Signoz
        const logs = batch.map((entry) => ({
          trace_id: entry.trace_id,
          span_id: entry.span_id,
          severity_text: entry.options.severityText || 'info',
          severity_number: entry.options.severityNumber || 4,
          attributes: entry.options.attributes || {},
          resources: entry.options.resources || {},
          message: entry.message,
          timestamp: entry.timestamp
        }));

        // Try to send logs with retries
        let retries = 0;
        while (retries < this.MAX_RETRIES) {
          try {
            const response = await fetch('https://ingest.eu.signoz.cloud:443/logs/json', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'signoz-ingestion-key': process.env.SIGNOZ_INGESTION_KEY as string
              },
              body: JSON.stringify(logs)
            });

            if (!response.ok) {
              throw new Error(`Failed to send logs: ${response}`);
            }

            break; // Success, exit retry loop
          } catch (error) {
            retries++;
            if (retries === this.MAX_RETRIES) {
              console.error('Failed to send logs to Signoz after max retries:', error);
            } else {
              await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000));
            }
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    return this.processQueue();
  }
}

export default new SigNozHelper();
