
import { create } from 'zustand';

export type Phase = 'search' | 'select' | 'pay' | 'confirm';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

interface ChatState {
  messages: Message[];
  currentPhase: Phase;
  isStreaming: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  setPhase: (phase: Phase) => void;
  setStreaming: (streaming: boolean) => void;
  startOver: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to **SnowballShop**! 🛍️ I\'m here to help you find the perfect product. What are you looking for today?',
      timestamp: new Date(),
    }
  ],
  currentPhase: 'search',
  isStreaming: false,

  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  updateLastMessage: (content) => {
    set((state) => {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content = content;
        lastMessage.streaming = false;
      }
      return { messages };
    });
  },

  setPhase: (phase) => {
    set({ currentPhase: phase });
  },

  setStreaming: (streaming) => {
    set({ isStreaming: streaming });
  },

  startOver: () => {
    set({
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Welcome back to **SnowballShop**! 🛍️ What would you like to find today?',
          timestamp: new Date(),
        }
      ],
      currentPhase: 'search',
      isStreaming: false,
    });
  },
}));
