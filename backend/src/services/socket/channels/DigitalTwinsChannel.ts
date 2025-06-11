import { Server, Socket } from 'socket.io';
import { BaseChannel } from './BaseChannel';
import logger from '../../../helpers/loggerInstance';

export default class DigitalTwinsChannel extends BaseChannel {
  private readonly ROOM_NAME = 'admin:digital-twins';

  constructor(io: Server) {
    super(io, {
      namespace: 'digital-twins',
      requireAuth: true
    });
  }

  initialize(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.debug(`Digital Twins channel: Client connected ${socket.id}`);

      socket.on('digital-twins:join', () => this.handleJoin(socket));
      socket.on('digital-twins:leave', () => this.handleLeave(socket));
      socket.on('digital-twins:message', (message: any) => this.handleMessage(socket, message));

      socket.on('disconnect', () => {
        logger.info(`Digital Twins channel: Client disconnected ${socket.id}`);
      });
    });
    logger.debug('DigitalTwinsChannel: Initialized');
  }

  private async handleJoin(socket: Socket) {
    const { isAuthorized } = await this.checkAuth(socket);
    if (!isAuthorized) return;

    this.joinRoom(socket, this.ROOM_NAME);
    this.emitToSocket(socket, 'joined', { room: this.ROOM_NAME });
  }

  private async handleLeave(socket: Socket) {
    const { isAuthorized } = await this.checkAuth(socket);
    if (!isAuthorized) return;

    this.leaveRoom(socket, this.ROOM_NAME);
    this.emitToSocket(socket, 'left', { room: this.ROOM_NAME });
  }

  private async handleMessage(socket: Socket, message: any) {
    const { isAuthorized } = await this.checkAuth(socket);
    if (!isAuthorized) return;

    if (!socket.rooms.has(this.ROOM_NAME)) {
      this.emitError(socket, 'Not authorized for digital twins commands');
      return;
    }

    switch (message.type) {
      case 'machine:1:kaduuk':
        // Do stuff
        break;
      default:
        logger.warn(`Unknown digital twins message type: ${message.type}`);
        this.emitError(socket, 'Unknown message type');
    }
  }
}
