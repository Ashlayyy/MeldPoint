import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import { io, Socket } from 'socket.io-client';
import { ref } from 'vue';
import { UploadFile } from '../../API/migration';

const MIGRATION_ROOM = 'admin:migration';

export const useMigrationStore = defineStore('migration', {
  state: () => ({
    isRunning: ref(false),
    connected: ref(false),
    time: ref(0),
    ws: ref<Socket | null>(null),
    outputs: [] as string[],
    retryCount: ref(0),
    maxRetries: ref(5),
    isReconnecting: ref(true)
  }),
  actions: {
    initWebSocket() {
      const url = import.meta.env.VITE_WS_URL;
      this.ws = io(url, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000
      });

      this.ws.on('connect', () => {
        this.connected = true;
        this.retryCount = 0;
        this.ws?.emit('join', MIGRATION_ROOM);
      });

      this.ws.on('migration:start', () => {
        this.isRunning = true;
        this.isReconnecting = false;
        this.time = 0;
        this.outputs = [];
      });

      this.ws.on('migration:output', (message: any) => {
        this.outputs.push(message.message);
      });

      this.ws.on('migration:complete', (message: any) => {
        this.isRunning = false;
        if (!Number.isNaN(message?.time) && message?.time) {
          this.time = message.time;
          this.outputs.push(`[COMPLETED] Migration completed in ${this.time} seconds`);
        }
      });

      this.ws.on('migration:error', (message: any) => {
        this.isRunning = false;
        this.outputs.push(message);
        console.error(message);
      });

      this.ws.on('close', () => {
        this.connected = false;
        this.ws?.emit('leave', MIGRATION_ROOM);
      });

      this.ws.on('disconnect', () => {
        this.connected = false;
        this.ws?.emit('leave', MIGRATION_ROOM);
      });

      this.ws.on('open', () => {
        this.connected = true;
      });

      this.ws.on('error', (error: any) => {
        this.isRunning = false;
        console.error(error || 'A error has occurred. Try again later.', error);
      });

      this.ws.on('connect_error', () => {
        this.isReconnecting = true;
        const retryDelay = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
        this.retryCount++;

        if (this.retryCount <= this.maxRetries) {
          setTimeout(() => {
            this.ws?.connect();
          }, retryDelay);
        } else {
          this.isReconnecting = false;
          this.connected = false;
          console.error(t('errors.connection_failed'));
          this.ws?.close();
          return;
        }
      });
    },
    retryClicked() {
      this.initWebSocket();
    },
    async startMigration() {
      if (!this.ws || !this.connected) {
        console.error(t('errors.connection_failed'));
        return;
      }

      const isSure = confirm(t('admin.migration.confirm'));

      if (isSure === false) return;
      else {
        this.isRunning = true;
        this.isReconnecting = false;
        this.time = 0;
        this.outputs = [];
        this.ws.emit('message', 'migration:start:json');
      }
    },
    closeWebSocket() {
      if (this.ws) {
        this.ws.emit('leave', MIGRATION_ROOM);
        this.isRunning = false;
        this.isReconnecting = false;
        this.ws.close();
      }
    },

    async uploadFile(formdata: any) {
      const response = await UploadFile(formdata);
      return response;
    }
  }
});
