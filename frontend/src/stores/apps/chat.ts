import { defineStore } from 'pinia';
// project imports
import axios from '@/utils/axios';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface chatType {
  chats: any;
  chatContent: any;
}

export const useChatStore = defineStore({
  id: 'chat',
  state: (): chatType => ({
    chats: [],
    chatContent: 1
  }),
  getters: {
    // Get Chats from Getters
    getChats(state) {
      return state.chats;
    }
  },
  actions: {
    // Fetch Chat from action
    async fetchChats() {
      try {
        const data = await axios.get('/api/data/chat/ChatData');
        this.chats = data.data;
      } catch (error) {
        alert(error);
      }
    },
    //select chat
    SelectChat(itemID: number) {
      this.chatContent = itemID - 1;
    },

    sendMsg(itemID: number, item: string) {
      this.chats = this.chats.filter((chat: any) => {
        return chat.id === itemID
          ? {
              ...chat,
              ...chat.chatHistory[0][1].to.push(item)
            }
          : chat;
      });
    }
  }
});
