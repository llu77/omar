
'use server';

/**
 * @fileoverview AI flow for rehabilitation expert consultation using OpenAI.
 * Provides scientific, evidence-based answers to rehabilitation questions.
 */
import OpenAI from 'openai';
import { ConsultRehabExpertInput, ConsultRehabExpertInputSchema, ConsultRehabExpertOutput } from '@/types';

// ==================== OpenAI Client Initialization ====================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================== Main Export ====================
/**
 * Consults with the rehabilitation expert AI.
 * @param input - The consultation input containing the question and history.
 * @returns a promise with the expert's answer.
 */
export async function consultRehabExpert(input: ConsultRehabExpertInput): Promise<ConsultRehabExpertOutput> {
  try {
    const validatedInput = ConsultRehabExpertInputSchema.parse(input);
    const { question, history } = validatedInput;

    const systemPrompt = `You are "Wassel AI Rehab Consultant," a virtual assistant expert in physical therapy and rehabilitation.

Your primary rules are:
1.  **Scientific Accuracy**: Provide answers based on scientific evidence and proven medical practices.
2.  **Clarity and Simplicity**: Use clear and understandable language for the average patient.
3.  **Safety First**: Start every answer with "⚠️ Disclaimer: This information is for guidance only and does not replace consultation with a specialized doctor."
4.  **Contextualization**: Link your answers to the context of the previous conversation if it exists.
5.  **Comprehensiveness**: Provide complete answers covering all aspects of the question.
6.  **Language**: All responses must be in Arabic.`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: question },
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.5,
    });
    
    const answer = response.choices[0]?.message?.content;
    
    if (!answer) {
        throw new Error('Empty response from AI model');
    }

    return { answer };

  } catch (error) {
    console.error('[ConsultRehabExpert] Error:', error);
    // Provide a user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      answer: `⚠️ عذراً، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى لاحقاً. (الخطأ: ${errorMessage})`,
    };
  }
}
