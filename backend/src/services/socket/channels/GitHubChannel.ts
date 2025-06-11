import { Server, Socket } from 'socket.io';
import logger from '../../../helpers/loggerInstance';
import { SOCKET_ROOMS, SOCKET_EVENTS } from '../../../constants/socket.constants';

export default class GitHubChannel {
  private io: Server;

  private readonly ROOM_NAME = SOCKET_ROOMS.GITHUB;

  constructor(io: Server) {
    this.io = io;
  }

  public initialize(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on(SOCKET_EVENTS.GITHUB.JOIN, () => this.handleJoinRoom(socket));
      socket.on(SOCKET_EVENTS.GITHUB.LEAVE, () => this.handleLeaveRoom(socket));
    });
    logger.debug('GitHubChannel: Initialized');
  }

  private handleJoinRoom(socket: Socket): void {
    socket.join(this.ROOM_NAME);
    logger.debug(`GitHubChannel: Client ${socket.id} joined github room`);
  }

  private handleLeaveRoom(socket: Socket): void {
    socket.leave(this.ROOM_NAME);
    logger.debug(`GitHubChannel: Client ${socket.id} left github room`);
  }

  public emitIssueCreated(issue: any): void {
    this.io.to(this.ROOM_NAME).emit(SOCKET_EVENTS.GITHUB.ISSUE_CREATED, issue);
    logger.debug('GitHubChannel: Emitted issue:created event');
  }

  public emitIssueUpdated(issue: any): void {
    this.io.to(this.ROOM_NAME).emit(SOCKET_EVENTS.GITHUB.ISSUE_UPDATED, issue);
    logger.debug('GitHubChannel: Emitted issue:updated event');
  }
}
