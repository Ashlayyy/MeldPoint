import NotificationChannel from '../services/socket/channels/NotificationChannel';
import logger from '../helpers/loggerInstance';

const DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds
const TOAST_INTERVAL = 5000; // 5 seconds
const SYSTEM_INTERVAL = 15000; // 15 seconds

const getRandomMessage = () => {
  const messages = [
    'Hello there!',
    "How's your day going?",
    'Keep up the good work!',
    "You're doing great!",
    'Time for a coffee break?',
    "Don't forget to stretch!",
    'Stay hydrated!',
    "You're awesome!"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

export default function startNotificationsScheduler(notificationChannel: NotificationChannel) {
  logger.info('Notifications scheduler started');

  const startTime = Date.now();

  // Toast notifications every 5 seconds
  const toastInterval = setInterval(() => {
    notificationChannel.sendNotification({
      type: 'toast',
      message: getRandomMessage(),
      data: { title: 'Toast Notification' },
      needTodo: false
    });
  }, TOAST_INTERVAL);

  // System notifications every 15 seconds
  const systemInterval = setInterval(() => {
    notificationChannel.sendNotification({
      type: 'system',
      message: getRandomMessage(),
      data: { title: 'System Update' },
      needTodo: false
    });
  }, SYSTEM_INTERVAL);

  // Stop after 2 minutes
  setTimeout(() => {
    clearInterval(toastInterval);
    clearInterval(systemInterval);
    logger.info('Notifications scheduler stopped after 2 minutes');
  }, DURATION);
}
