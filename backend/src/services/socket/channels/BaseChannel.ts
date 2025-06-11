import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../../helpers/loggerInstance';
import isAuthenticated from '../../../middleware/auth.socket';
import { getSocketAuth } from '../../../middleware/socket-auth';

interface Message {
  id: string;
  room: string;
  type: string;
  data: any;
  timestamp: number;
  attempts: number;
}

interface RateLimit {
  count: number;
  lastReset: number;
}

export interface ChannelOptions {
  namespace: string;
  requireAuth?: boolean;
  rateLimit?: {
    maxRequests: number;
    timeWindow: number;
  };
}

export abstract class BaseChannel {
  protected io: Server;

  protected namespace: string;

  protected requireAuth: boolean;

  private messageQueue: Map<string, Message> = new Map();

  private processedMessages: Set<string> = new Set();

  private rateLimits: Map<string, RateLimit> = new Map();

  private readonly MAX_RETRY_ATTEMPTS = 3;

  private readonly MESSAGE_TIMEOUT = 5000;

  private readonly CLEANUP_INTERVAL = 3600000;

  private readonly DEFAULT_RATE_LIMIT = {
    maxRequests: 100,
    timeWindow: 60000 // 1 minute
  };

  constructor(io: Server, options: ChannelOptions) {
    this.io = io;
    this.namespace = options.namespace;
    this.requireAuth = options.requireAuth ?? true;
    this.rateLimit = options.rateLimit ?? this.DEFAULT_RATE_LIMIT;
    this.startCleanupInterval();
  }

  private rateLimit: { maxRequests: number; timeWindow: number };

  protected async checkAuth(socket: Socket): Promise<{ isAuthorized: boolean; userId?: string }> {
    try {
      logger.debug(
        `Checking authentication for socket ${socket.id} with auth: ${JSON.stringify(socket.handshake.auth)}`
      );

      if (!this.requireAuth) {
        return { isAuthorized: true };
      }

      const isAuthorized = await isAuthenticated(socket);
      if (!isAuthorized) {
        logger.warn(`Authentication failed for socket ${socket.id}`);
        socket.emit(`${this.namespace}:error`, { message: 'Not authenticated' });
        return { isAuthorized: false };
      }

      // For security namespace, use getSocketAuth
      if (this.namespace === 'security') {
        const authData = getSocketAuth(socket);
        const userId = authData?.userId;

        if (!userId) {
          logger.warn(`No user ID found for authenticated security socket ${socket.id}`);
          socket.emit(`${this.namespace}:error`, { message: 'User ID not found' });
          return { isAuthorized: false };
        }

        return { isAuthorized: true, userId };
      }

      // For other namespaces (like notifications), use handshake auth directly
      const userId = socket.handshake.auth?.userId;
      if (!userId) {
        logger.warn(`No user ID found in handshake auth for socket ${socket.id}`);
        socket.emit(`${this.namespace}:error`, { message: 'User ID not found' });
        return { isAuthorized: false };
      }

      logger.debug(`Authentication successful for socket ${socket.id}, user ${userId}`);
      return { isAuthorized: true, userId };
    } catch (error) {
      logger.error(`Authentication check failed for socket ${socket.id}: ${error}`);
      socket.emit(`${this.namespace}:error`, { message: 'Authentication check failed' });
      return { isAuthorized: false };
    }
  }

  protected joinRoom(socket: Socket, room: string) {
    socket.join(room);
    logger.info(`Socket ${socket.id} joined room ${room} in namespace ${this.namespace}`);
  }

  protected leaveRoom(socket: Socket, room: string) {
    socket.leave(room);
    logger.info(`Socket ${socket.id} left room ${room} in namespace ${this.namespace}`);
  }

  protected emitToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(`${this.namespace}:${event}`, data);
    logger.debug(`Emitted ${event} to room ${room} in namespace ${this.namespace}: ${JSON.stringify(data)}`);
  }

  protected emitToSocket(socket: Socket, event: string, data: any) {
    socket.emit(`${this.namespace}:${event}`, data);
    logger.debug(`Emitted ${event} to socket ${socket.id} in namespace ${this.namespace}: ${JSON.stringify(data)}`);
  }

  protected emitError(socket: Socket, message: string) {
    this.emitToSocket(socket, 'error', { message });
  }

  protected async checkRateLimit(socket: Socket): Promise<boolean> {
    const key = `${socket.handshake.auth?.userId || socket.id}:${this.namespace}`;
    const now = Date.now();
    const userRateLimit = this.rateLimits.get(key) || { count: 0, lastReset: now };

    // Reset rate limit if time window has passed
    if (now - userRateLimit.lastReset > this.rateLimit.timeWindow) {
      userRateLimit.count = 0;
      userRateLimit.lastReset = now;
    }

    // Check if rate limit exceeded
    if (userRateLimit.count >= this.rateLimit.maxRequests) {
      logger.warn(`Rate limit exceeded for ${key}`);
      this.emitError(socket, 'Rate limit exceeded. Please try again later.');
      return false;
    }

    // Increment counter
    userRateLimit.count += 1;
    this.rateLimits.set(key, userRateLimit);
    return true;
  }

  protected async sendReliableMessage(
    socket: Socket,
    message: { type: string; data: any; room: string }
  ): Promise<boolean> {
    // Check rate limit before sending message
    if (!(await this.checkRateLimit(socket))) {
      return false;
    }

    const messageId = uuidv4();
    const fullMessage: Message = {
      id: messageId,
      ...message,
      timestamp: Date.now(),
      attempts: 0
    };

    if (this.processedMessages.has(messageId)) {
      logger.warn(`Duplicate message detected: ${messageId}`);
      return false;
    }

    this.messageQueue.set(messageId, fullMessage);

    return new Promise((resolve) => {
      const ackTimeout = setTimeout(() => {
        this.handleMessageTimeout(messageId);
        resolve(false);
      }, this.MESSAGE_TIMEOUT);

      socket.emit(
        `${this.namespace}:${message.type}`,
        {
          ...message.data,
          messageId
        },
        (ack: { received: boolean }) => {
          clearTimeout(ackTimeout);
          if (ack.received) {
            this.handleMessageSuccess(messageId);
            resolve(true);
          }
        }
      );
    });
  }

  private handleMessageSuccess(messageId: string): void {
    this.messageQueue.delete(messageId);
    this.processedMessages.add(messageId);
    logger.info(`Message ${messageId} successfully delivered`);
  }

  private handleMessageTimeout(messageId: string): void {
    const message = this.messageQueue.get(messageId);
    if (!message) return;

    if (message.attempts < this.MAX_RETRY_ATTEMPTS) {
      message.attempts += 1;
      logger.warn(`Message ${messageId} timed out. Attempt ${message.attempts}/${this.MAX_RETRY_ATTEMPTS}`);
    } else {
      logger.error(`Message ${messageId} failed after ${this.MAX_RETRY_ATTEMPTS} attempts`);
      this.messageQueue.delete(messageId);
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      Array.from(this.processedMessages).forEach((messageId) => {
        const message = this.messageQueue.get(messageId);
        if (message && now - message.timestamp > this.CLEANUP_INTERVAL) {
          this.processedMessages.delete(messageId);
        }
      });
    }, this.CLEANUP_INTERVAL);
  }

  abstract initialize(): void;
}
