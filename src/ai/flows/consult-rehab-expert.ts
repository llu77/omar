
'use server';

/**
 * @fileoverview AI flow for a rehabilitation expert consultant.
 * This flow powers the "Consult Me" feature, allowing users to ask
 * rehabilitation-related questions and get scientific answers.
 */
import OpenAI from 'openai';
import { ConsultRehabExpertInput, ConsultRehabExpertOutput } from '@/types';
import { StreamingTextResponse, OpenAIStream } from 'ai';

// ==================== OpenAI Client Initialization ====================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================== Main Export ====================
/**
 * Consults with the rehabilitation expert AI and streams the response.
 * @param input - The consultation input containing the question and history.
 * @returns A streaming text response.
 */
export async function consultRehabExpert(input: ConsultRehabExpertInput): Promise<Response> {
  try {
    const { question, history } = input;

    const systemPrompt = `You are "Wassel AI Rehab Consultant," a virtual assistant expert in physical therapy and rehabilitation.

Your primary rules are:
1.  **Scientific Accuracy**: Provide answers based on scientific evidence and proven medical practices.
2.  **Clarity and Simplicity**: Use clear and understandable language for the average patient.
3.  **Safety First**: Start every answer with "⚠️ Disclaimer: This information is for guidance only and does not replace consultation with a specialized doctor."
4.  **Contextualization**: Link your answers to the context of the previous conversation if it exists.
5.  **Comprehensiveness**: Provide complete answers covering all aspects of the question.
6.  **Language**: All responses must be in Arabic.

Remember: All responses MUST be in Arabic, without exception.`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({ role: msg.role === 'model' ? 'assistant' : msg.role, content: msg.content })),
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
    console.error('[ConsultRehabExpert] Error:', error);
    // Provide a user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(`⚠️ عذراً، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى لاحقاً. (الخطأ: ${errorMessage})`, {
        status: 500
    });
  }
}
