interface ChatbotMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
  modelUsed?: 'high' | 'middle';
  estimatedTokens?: number;
}

interface ChatbotResponse {
  success: boolean;
  response?: string;
  model_used?: 'high' | 'middle';
  estimated_tokens?: number;
  message?: string;
  error?: string;
}

class ChatbotService {
  private readonly baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  async sendMessage(message: string, token: string): Promise<ChatbotResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chatbot service error:', error);
      return {
        success: false,
        message: 'Failed to connect to chatbot service',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createUserMessage(message: string): ChatbotMessage {
    return {
      id: this.generateMessageId(),
      message,
      isUser: true,
      timestamp: new Date()
    };
  }

  createBotMessage(message: string, modelUsed?: 'high' | 'middle', estimatedTokens?: number): ChatbotMessage {
    return {
      id: this.generateMessageId(),
      message,
      isUser: false,
      timestamp: new Date(),
      modelUsed,
      estimatedTokens
    };
  }

  // Store messages in localStorage for persistence
  saveMessages(messages: ChatbotMessage[]): void {
    try {
      localStorage.setItem('chatbot_messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chatbot messages:', error);
    }
  }

  loadMessages(): ChatbotMessage[] {
    try {
      const stored = localStorage.getItem('chatbot_messages');
      if (stored) {
        const messages = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        return messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load chatbot messages:', error);
    }
    return [];
  }

  clearMessages(): void {
    try {
      localStorage.removeItem('chatbot_messages');
    } catch (error) {
      console.error('Failed to clear chatbot messages:', error);
    }
  }
}

export type { ChatbotMessage, ChatbotResponse };
export default new ChatbotService();
