import OpenAI from 'openai';
import Constants from 'expo-constants';

/**
 * Service for interacting with OpenRouter API for AI-powered insights
 * Uses the free models router (openrouter/free)
 */
export class OpenRouterService {
  private client: OpenAI;
  private readonly model = 'openrouter/auto:free';

  constructor() {
    const apiKey = Constants.expoConfig?.extra?.openRouterApiKey || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey || '',
      defaultHeaders: {
        'HTTP-Referer': 'https://chess-stats-app.com',
        'X-Title': 'Chess Stats App',
      },
    });
  }

  /**
   * Generate AI completion from a prompt
   * @param prompt The prompt to send to the AI
   * @param systemPrompt Optional system prompt for context
   * @returns The AI-generated response text
   */
  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new Error('Failed to generate AI completion');
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    const apiKey = Constants.expoConfig?.extra?.openRouterApiKey || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
    return !!apiKey && apiKey.length > 0;
  }
}

export default new OpenRouterService();
