import { Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  room: string;
  type: string;
  data: any;
  timestamp: number;
  attempts: number;
}

export class MessageReliabilityService {
  private static instance: MessageReliabilityService | null = null;
  private socket: Socket | null = null;
  private pendingMessages: Map<string, Message> = new Map();
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly MESSAGE_TIMEOUT = 5000; // 5 seconds

  private constructor() {}

  public static getInstance(): MessageReliabilityService {
    if (!MessageReliabilityService.instance) {
      MessageReliabilityService.instance = new MessageReliabilityService();
    }
    return MessageReliabilityService.instance;
  }

  public initialize(socket: Socket): void {
    this.socket = socket;
    this.setupAckHandler();
  }

  public async sendMessage(room: string, type: string, data: any): Promise<boolean> {
    if (!this.socket) {
      console.error('Socket not initialized');
      return false;
    }

    const messageId = uuidv4();
    const message: Message = {
      id: messageId,
      room,
      type,
      data,
      timestamp: Date.now(),
      attempts: 0
    };

    this.pendingMessages.set(messageId, message);

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.handleMessageTimeout(messageId);
        resolve(false);
      }, this.MESSAGE_TIMEOUT);

      this.socket!.emit(
        'message',
        {
          room,
          type,
          data,
          messageId
        },
        () => {
          clearTimeout(timeoutId);
          this.handleMessageSuccess(messageId);
          resolve(true);
        }
      );
    });
  }

  private setupAckHandler(): void {
    if (!this.socket) return;

    this.socket.on('message:ack', ({ messageId }: { messageId: string }) => {
      this.socket!.emit('message:ack:response', { messageId, received: true });
    });
  }

  private handleMessageSuccess(messageId: string): void {
    this.pendingMessages.delete(messageId);
  }

  private handleMessageTimeout(messageId: string): void {
    const message = this.pendingMessages.get(messageId);
    if (!message) return;

    if (message.attempts < this.MAX_RETRY_ATTEMPTS) {
      message.attempts += 1;
      console.warn(`Message ${messageId} timed out. Attempt ${message.attempts}/${this.MAX_RETRY_ATTEMPTS}`);
      // Retry sending the message
      this.sendMessage(message.room, message.type, message.data);
    } else {
      console.error(`Message ${messageId} failed after ${this.MAX_RETRY_ATTEMPTS} attempts`);
      this.pendingMessages.delete(messageId);
    }
  }
}
