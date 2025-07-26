
'use server';

/**
 * @fileoverview AI flow for discussing a medical research summary.
 * This flow powers the "Discuss this research" feature.
 */
import OpenAI from 'openai';
import { ConsultRehabExpertInput } from '@/types'; // Reusing the same input type for simplicity
import { StreamingTextResponse, OpenAIStream } from 'ai';

// ==================== OpenAI Client Initialization ====================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================== Main Export ====================
/**
 * Discusses a research summary with the user.
 * @param input - The input containing the current question and the full discussion history.
 * @returns A streaming text response.
 */
export async function discussResearch(input: ConsultRehabExpertInput): Promise<Response> {
  try {
    const { question, history } = input;

    // The first message in the history is our initial system prompt containing the rules and the summary
    const initialSystemPrompt = history.find(m => m.role === 'system')?.content || '';

    // Construct the message list for the API call
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        // The first message MUST be the system prompt.
      { role: 'system', content: initialSystemPrompt },
      // The rest of the history (user questions and assistant answers)
      ...history.filter(m => m.role !== 'system').map(msg => ({ 
          role: msg.role === 'model' ? 'assistant' : msg.role, 
          content: msg.content 
      })),
      // The user's latest question
      { role: 'user', content: question },
    ];

    const response = await openai.chat.completions.create({
        model: process.env.DEFAULT_MODEL || 'gpt-4-turbo',
        messages: messages,
        temperature: 0.5,
        stream: true,
    });
    
    // @ts-ignore - Type compatibility fix
    const stream = OpenAIStream(response as any);
    
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error('[DiscussResearch] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(`⚠️ عذراً، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى لاحقاً. (الخطأ: ${errorMessage})`, {
        status: 500
    });
  }
}
