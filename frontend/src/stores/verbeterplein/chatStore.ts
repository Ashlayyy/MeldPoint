import { defineStore } from 'pinia';
import i18n from '@/main';
const t = i18n.global.t;
import { GetMessagesFromChatRoom, CreateMessage, CreateChatRoom } from '../../API/chat';
import { UpdateReport } from '../../API/melding';
import type { Melding } from '../../types/verbeterplein/verbeter';
import { useNotificationStore } from './notification_store';

const notification = useNotificationStore();

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [] as Melding[],
    currentChatRoom: null as string | null,
    loading: false,
    error: null as string | null
  }),

  actions: {
    resetState() {
      this.messages = [];
      this.currentChatRoom = null;
      this.loading = false;
      this.error = null;
    },
    async fetchMessages(): Promise<void> {
      this.loading = true;
      try {
        if (!this.currentChatRoom) {
          this.messages = [];
          return;
        }

        const response = await GetMessagesFromChatRoom(this.currentChatRoom);
        if (response?.data) {
          this.messages = response.data;
        } else {
          this.messages = [];
          throw new Error(JSON.stringify(response));
        }
      } catch (error: any) {
        notification.error({ message: t('errors.fetch_error', { error: error.message }) });
        this.messages = [];
      } finally {
        this.loading = false;
      }
    },
    async createChatRoom(meldingId: string) {
      try {
        if (this.currentChatRoom) {
          return { id: this.currentChatRoom };
        }

        const response = await CreateChatRoom(meldingId);
        if (response.status === 201) {
          await UpdateReport(meldingId, { ChatRoomID: response.data.id });
          this.currentChatRoom = response.data.id;
          return response.data;
        } else {
          throw new Error(JSON.stringify(response));
        }
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error.message }) });
        return null;
      }
    },
    async sendMessage(message: string, meldingId: string, userId: string) {
      try {
        if (!message?.trim() || !userId || !meldingId?.trim()) {
          throw new Error(t('errors.required_parameters'));
        }

        if (!this.currentChatRoom) {
          const chatroomResponse = await this.createChatRoom(meldingId);
          if (!chatroomResponse?.id) {
            throw new Error(t('errors.no_chatroom_found'));
          }
        }

        const response = await CreateMessage(this.currentChatRoom!, message, userId);
        if (response.status === 201) {
          await this.fetchMessages();
          return response?.data;
        }
        throw new Error(JSON.stringify(response));
      } catch (error: any) {
        notification.error({ message: t('errors.save_error', { error: error.message }) });
      }
    },

    setCurrentChatRoom(chatroomId: string) {
      if (chatroomId) {
        this.currentChatRoom = chatroomId;
      }
    }
  }
});
