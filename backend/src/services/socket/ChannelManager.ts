import { Server } from 'socket.io';
import SecurityChannel from './channels/SecurityChannel';
import DigitalTwinsChannel from './channels/DigitalTwinsChannel';
import GitHubChannel from './channels/GitHubChannel';
import NotificationChannel from './channels/NotificationChannel';
import logger from '../../helpers/loggerInstance';
import { SOCKET_ROOMS } from '../../constants/socket.constants';

type Channel = SecurityChannel | DigitalTwinsChannel | GitHubChannel | NotificationChannel;

export default class ChannelManager {
  private io: Server;

  private channels: Map<string, Channel>;

  constructor(io: Server) {
    this.io = io;
    this.channels = new Map();
    this.initializeChannels();
  }

  private initializeChannels(): void {
    logger.debug('Initializing socket channels');

    // Initialize Security Channel
    const securityChannel = new SecurityChannel(this.io);
    this.channels.set(SOCKET_ROOMS.SECURITY, securityChannel);
    securityChannel.initialize();

    // Initialize Digital Twins Channel
    const digitalTwinsChannel = new DigitalTwinsChannel(this.io);
    this.channels.set(SOCKET_ROOMS.DIGITAL_TWINS, digitalTwinsChannel);
    digitalTwinsChannel.initialize();

    // Initialize GitHub Channel
    const githubChannel = new GitHubChannel(this.io);
    this.channels.set(SOCKET_ROOMS.GITHUB, githubChannel);
    githubChannel.initialize();

    // Initialize Notification Channel
    const notificationChannel = new NotificationChannel(this.io);
    this.channels.set(SOCKET_ROOMS.NOTIFICATIONS, notificationChannel);
    notificationChannel.initialize();

    logger.info('Socket channels initialized');
  }

  public getChannel<T extends Channel>(name: string): T | undefined {
    return this.channels.get(name) as T;
  }

  public getSecurityChannel(): SecurityChannel | undefined {
    return this.getChannel<SecurityChannel>(SOCKET_ROOMS.SECURITY);
  }

  public getDigitalTwinsChannel(): DigitalTwinsChannel | undefined {
    return this.getChannel<DigitalTwinsChannel>(SOCKET_ROOMS.DIGITAL_TWINS);
  }

  public getGitHubChannel(): GitHubChannel | undefined {
    return this.getChannel<GitHubChannel>(SOCKET_ROOMS.GITHUB);
  }

  public getNotificationChannel(): NotificationChannel | undefined {
    return this.getChannel<NotificationChannel>(SOCKET_ROOMS.NOTIFICATIONS);
  }
}
