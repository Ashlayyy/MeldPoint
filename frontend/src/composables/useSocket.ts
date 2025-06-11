import { io, Socket } from 'socket.io-client';
import { ref } from 'vue';

interface Message {
  id: string;
  room: string;
  type: string;
  data: any;
  timestamp: number;
  attempts: number;
}

let socket: Socket | null = null;
const pendingMessages = new Map<string, Message>();
const MAX_RETRY_ATTEMPTS = 3;
const MESSAGE_TIMEOUT = 5000;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

export function useSocket() {
  const isConnected = ref(false);
  const connectionError = ref<string | null>(null);

  const initSocket = () => {
    if (!socket) {
      console.log('Initializing socket connection...');
      socket = io(import.meta.env.VITE_WS_URL, {
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling'],
        forceNew: true,
        multiplex: false
      });

      socket.on('connect', () => {
        console.log('Socket connected successfully');
        isConnected.value = true;
        connectionError.value = null;
        if (socket?.connected) {
          reconnectAttempts = 0;
        }
      });

      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected. Reason: ${reason}`);
        isConnected.value = false;
        connectionError.value = reason;

        if (reason === 'io server disconnect' || reason === 'transport close') {
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && reconnectAttempts > 0 && reconnectAttempts !== MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect... Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
            setTimeout(() => {
              socket?.connect();
            }, 1000 * Math.min(reconnectAttempts, 5));
          } else {
            console.error('Maximum reconnection attempts reached. Please refresh the page.');
            connectionError.value = 'Maximum reconnection attempts reached';
          }
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        connectionError.value = error.message;

        if (error.message === 'websocket error' && socket && reconnectAttempts > 1) {
          console.log('Falling back to polling transport after multiple WebSocket failures');
          socket.io.opts.transports = ['polling', 'websocket'];
        }
      });

      socket.on('message:ack', ({ messageId }: { messageId: string }) => {
        socket?.emit('message:ack:response', { messageId, received: true });
      });
    }
    return socket;
  };

  const getSocket = () => {
    if (!socket) {
      return initSocket();
    }
    return socket;
  };

  const generateMessageId = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const handleMessageSuccess = (messageId: string): void => {
    pendingMessages.delete(messageId);
  };

  const handleMessageTimeout = async (messageId: string): Promise<void> => {
    const message = pendingMessages.get(messageId);
    if (!message) return;

    if (message.attempts < MAX_RETRY_ATTEMPTS) {
      message.attempts += 1;
      console.warn(`Message ${messageId} timed out. Attempt ${message.attempts}/${MAX_RETRY_ATTEMPTS}`);
      await sendReliableMessage(message.room, message.type, message.data);
    } else {
      console.error(`Message ${messageId} failed after ${MAX_RETRY_ATTEMPTS} attempts`);
      pendingMessages.delete(messageId);
    }
  };

  const sendReliableMessage = async (room: string, type: string, data: any): Promise<boolean> => {
    const socket = getSocket();
    if (!socket) {
      console.error('Socket not initialized');
      return false;
    }

    const messageId = generateMessageId();
    const message: Message = {
      id: messageId,
      room,
      type,
      data,
      timestamp: Date.now(),
      attempts: 0
    };

    pendingMessages.set(messageId, message);

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        handleMessageTimeout(messageId);
        resolve(false);
      }, MESSAGE_TIMEOUT);

      socket.emit(
        'message',
        {
          room,
          type,
          data,
          messageId
        },
        () => {
          clearTimeout(timeoutId);
          handleMessageSuccess(messageId);
          resolve(true);
        }
      );
    });
  };

  return {
    isConnected,
    connectionError,
    socket: getSocket(),
    on: (event: string, callback: (...args: any[]) => void) => getSocket().on(event, callback),
    off: (event: string, callback: (...args: any[]) => void) => getSocket().off(event, callback),
    emit: sendReliableMessage,
    reconnect: () => {
      reconnectAttempts = 0;
      if (socket) {
        socket.disconnect();
        socket.connect();
      }
    }
  };
}
