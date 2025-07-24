'use server';

/**
 * @fileoverview AI flow for rehabilitation expert consultation.
 * Provides scientific, evidence-based answers to rehabilitation questions.
 */

import {defineFlow, generate} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';

// ==================== Schema Definitions ====================

export const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string().min(1),
});

export const ConsultRehabExpertInputSchema = z.object({
  question: z.string().min(1, 'السؤال مطلوب'),
  history: z.array(MessageSchema).default([]),
});

export const ConsultRehabExpertOutputSchema = z.object({
  answer: z.string(),
});

// ==================== Type Exports ====================

export type Message = z.infer<typeof MessageSchema>;
export type ConsultRehabExpertInput = z.infer<
  typeof ConsultRehabExpertInputSchema
>;
export type ConsultRehabExpertOutput = z.infer<
  typeof ConsultRehabExpertOutputSchema
>;

// ==================== Flow Definition ====================

const consultRehabExpertFlow = defineFlow(
  {
    name: 'consultRehabExpertFlow',
    inputSchema: ConsultRehabExpertInputSchema,
    outputSchema: ConsultRehabExpertOutputSchema,
  },
  async ({question, history}) => {
    const systemPrompt = `You are "Wassel AI Rehab Consultant," a virtual assistant expert in physical therapy and rehabilitation.

Your primary rules are:
1.  **Scientific Accuracy**: Provide answers based on scientific evidence and proven medical practices.
2.  **Clarity and Simplicity**: Use clear and understandable language for the average patient.
3.  **Safety First**: Start every answer with "⚠️ Disclaimer: This information is for guidance only and does not replace consultation with a specialized doctor."
4.  **Contextualization**: Link your answers to the context of the previous conversation if it exists.
5.  **Comprehensiveness**: Provide complete answers covering all aspects of the question.
6.  **Language**: All responses must be in Arabic.`;

    const model = googleAI.model('gemini-pro');

    const messages: {role: 'system' | 'user' | 'model'; content: {text: string}[]}[] = [
      {role: 'system', content: [{text: systemPrompt}]},
    ];
    history.forEach(msg => {
      messages.push({role: msg.role, content: [{text: msg.content}]});
    });
    messages.push({role: 'user', content: [{text: question}]});

    const response = await generate({
      model,
      prompt: {
        messages: messages,
      },
      config: {
        temperature: 0.5,
      },
    });

    const outputText = response.text();
    if (!outputText) {
      throw new Error('Empty response from AI model');
    }

    return {
      answer: outputText,
    };
  }
);

// ==================== Main Export ====================

/**
 * Consults with the rehabilitation expert AI.
 * @param input - The consultation input containing the question and history.
 * @returns a promise with the expert's answer.
 */
export async function consultRehabExpert(
  input: ConsultRehabExpertInput
): Promise<ConsultRehabExpertOutput> {
  try {
    const validatedInput = ConsultRehabExpertInputSchema.parse(input);
    return await consultRehabExpertFlow(validatedInput);
  } catch (error) {
    console.error('[ConsultRehabExpert] Error:', error);
    // Provide a user-friendly error message
    return {
      answer:
        '⚠️ عذراً، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى لاحقاً.',
    };
  }
}
