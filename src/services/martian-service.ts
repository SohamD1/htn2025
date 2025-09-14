interface MartianChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface MartianChatCompletionRequest {
  model: string;
  messages: MartianChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface MartianChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface MartianAnthropicRequest {
  model: string;
  max_tokens: number;
  messages: MartianChatMessage[];
  temperature?: number;
}

interface MartianAnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: {
    type: string;
    text: string;
  }[];
  model: string;
  stop_reason: string;
  stop_sequence: null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

class MartianAPIService {
  private readonly baseUrl = 'https://api.withmartian.com/v1';
  private readonly apiKey = 'sk-38778e2ab3504c388f0a5c53b1c4485e';

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Martian API error: ${response.status} - ${errorData}`);
    }

    return response.json();
  }

  // OpenAI-style chat completions
  async chatCompletion(request: MartianChatCompletionRequest): Promise<MartianChatCompletionResponse> {
    return this.makeRequest<MartianChatCompletionResponse>('/chat/completions', request);
  }

  // Anthropic-style messages
  async messages(request: MartianAnthropicRequest): Promise<MartianAnthropicResponse> {
    return this.makeRequest<MartianAnthropicResponse>('/messages', request);
  }

  // Convenience method for simple chat using smart routing
  async simpleChat(message: string, model: string = 'martian/code'): Promise<string> {
    try {
      const response = await this.chatCompletion({
        model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'No response received';
    } catch (error) {
      console.error('Martian simple chat error:', error);
      throw error;
    }
  }

  // Get investment advice using Claude
  async getInvestmentAdvice(
    userQuery: string,
    portfolioData?: any,
    model: string = 'anthropic/claude-sonnet-4-20250514'
  ): Promise<string> {
    try {
      const systemMessage = `You are a knowledgeable investment advisor for students.
      Provide helpful, educational investment advice that is appropriate for young investors.
      Focus on long-term strategies, diversification, and risk management.
      Keep responses concise and actionable.`;

      let contextMessage = userQuery;
      if (portfolioData) {
        contextMessage += `\n\nCurrent Portfolio Context: ${JSON.stringify(portfolioData, null, 2)}`;
      }

      const response = await this.messages({
        model,
        max_tokens: 800,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: contextMessage }
        ],
        temperature: 0.6,
      });

      return response.content[0]?.text || 'No advice available at the moment.';
    } catch (error) {
      console.error('Investment advice error:', error);
      throw error;
    }
  }

  // Generate market analysis
  async generateMarketAnalysis(
    stocks: string[],
    timeframe: string = '1 month',
    model: string = 'openai/gpt-4.1-nano'
  ): Promise<string> {
    try {
      const prompt = `Provide a brief market analysis for the following stocks: ${stocks.join(', ')}.
      Focus on the ${timeframe} timeframe. Include key trends, potential risks, and opportunities.
      Keep the analysis concise and educational for student investors.`;

      const response = await this.chatCompletion({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.5,
      });

      return response.choices[0]?.message?.content || 'Analysis not available.';
    } catch (error) {
      console.error('Market analysis error:', error);
      throw error;
    }
  }

  // Portfolio optimization suggestions
  async getPortfolioOptimization(
    currentPortfolio: any,
    riskTolerance: 'low' | 'medium' | 'high' = 'medium',
    model: string = 'anthropic/claude-sonnet-4-20250514'
  ): Promise<string> {
    try {
      const prompt = `Given this portfolio: ${JSON.stringify(currentPortfolio, null, 2)}
      and risk tolerance: ${riskTolerance}, provide optimization suggestions.
      Focus on diversification, asset allocation, and risk management appropriate for students.
      Provide specific, actionable recommendations.`;

      const response = await this.messages({
        model,
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      });

      return response.content[0]?.text || 'No optimization suggestions available.';
    } catch (error) {
      console.error('Portfolio optimization error:', error);
      throw error;
    }
  }

  // Educational content generation
  async generateEducationalContent(
    topic: string,
    level: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
    model: string = 'martian/code'
  ): Promise<string> {
    try {
      const prompt = `Create educational content about "${topic}" for ${level} level investors.
      Make it engaging, easy to understand, and include practical examples relevant to students.
      Keep it concise but informative.`;

      return await this.simpleChat(prompt, model);
    } catch (error) {
      console.error('Educational content generation error:', error);
      throw error;
    }
  }

  // Risk assessment
  async assessInvestmentRisk(
    investment: string,
    amount: number,
    userProfile: any,
    model: string = 'anthropic/claude-sonnet-4-20250514'
  ): Promise<string> {
    try {
      const prompt = `Assess the risk of investing $${amount} in ${investment} for a student investor.
      User profile: ${JSON.stringify(userProfile, null, 2)}
      Provide a risk rating (Low/Medium/High) and explanation with specific considerations for students.`;

      const response = await this.messages({
        model,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      return response.content[0]?.text || 'Risk assessment not available.';
    } catch (error) {
      console.error('Risk assessment error:', error);
      throw error;
    }
  }

  // Cheap model variants for high-volume requests
  async getCheapAdvice(message: string): Promise<string> {
    return this.simpleChat(message, 'anthropic/claude-sonnet-4-20250514:cheap');
  }

  async getCheapAnalysis(data: any): Promise<string> {
    return this.simpleChat(`Analyze this data: ${JSON.stringify(data)}`, 'openai/gpt-4.1-nano:cheap');
  }
}

// Export singleton instance
const martianAPI = new MartianAPIService();
export default martianAPI;