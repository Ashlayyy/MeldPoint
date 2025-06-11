import axios from '@/utils/axios';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class ChatService {
  async sendMessage(message: string) {
    const messages: Message[] = [
      {
        role: 'system',
        content:
          'Je bent een hulpverlener voor de Intal Verbeterplein applicatie. Antwoord in het Nederlands. Gebruik geen Engelse woorden.'
      },
      {
        role: 'user',
        content: message
      }
    ];

    try {
      const response = await axios.post('/ai/response', {
        messages
      });

      return response.data.response;
    } catch (error: any) {
      throw error;
    }
  }
}

export const chatService = new ChatService();

// For backward compatibility
export const getAiResponse = async (message: string) => {
  return chatService.sendMessage(message);
};
