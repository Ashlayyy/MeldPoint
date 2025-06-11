export type ChatTypes = {
  id: number;
  name: string;
  status: string;
  thumb: string;
  recent: boolean;
  lastMessage: string;
  excerpt: string;
  unReadChatCount?: number;
  chatHistory: [
    {
      0: {
        from: string[];
        to: string[];
      };
      1: {
        from: string[];
        to: string[];
      };
    }
  ];
};
