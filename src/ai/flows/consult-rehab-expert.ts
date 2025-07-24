'use server';

/**
 * @fileOverview AI flow for a rehabilitation expert consultant.
 * This flow powers the "Consult Me" feature, allowing users to ask
 * rehabilitation-related questions and get scientific answers.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Message } from 'genkit';

// Zod schema for a single message in the chat history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

// Input schema for the consultation flow
const ConsultRehabExpertInputSchema = z.object({
  question: z.string().describe("The user's current question."),
  history: z.array(MessageSchema).describe('The previous conversation history.'),
});
export type ConsultRehabExpertInput = z.infer<typeof ConsultRehabExpertInputSchema>;

// Output schema for the consultation flow
const ConsultRehabExpertOutputSchema = z.object({
  answer: z.string().describe("The AI expert's answer to the question."),
});
export type ConsultRehabExpertOutput = z.infer<typeof ConsultRehabExpertOutputSchema>;


// The main exported function that calls the Genkit flow
export async function consultRehabExpert(input: ConsultRehabExpertInput): Promise<ConsultRehabExpertOutput> {
  const result = await consultRehabExpertFlow(input);
  return result;
}

const systemPrompt = `أنت "استشاري تأهيل ذكي"، مساعد افتراضي خبير في العلاج الطبيعي والتأهيل. مهمتك هي الإجابة على أسئلة المستخدمين بشكل علمي ودقيق ومبسط.

قواعدك الأساسية:
1.  **الدقة العلمية:** قدم إجابات تستند إلى مبادئ علمية وطبية في مجال العلاج الطبيعي.
2.  **الإيجاز والوضوح:** استخدم لغة سهلة ومباشرة.
3.  **السلامة أولاً:** ابدأ دائمًا إجابتك بتحذير مهم: "تنبيه: هذه المعلومات للاسترشاد فقط ولا تغني عن استشارة الطبيب أو أخصائي العلاج الطبيعي. يجب دائمًا استشارة مختص قبل البدء في أي برنامج علاجي."
4.  **تحليل المحادثة:** استخدم سجل المحادثة السابق لفهم سياق السؤال الحالي.`;


// Genkit flow definition
const consultRehabExpertFlow = ai.defineFlow(
  {
    name: 'consultRehabExpertFlow',
    inputSchema: ConsultRehabExpertInputSchema,
    outputSchema: ConsultRehabExpertOutputSchema,
  },
  async (input) => {
    
    // Construct the message history for the model
    const messages: Message[] = [
        new Message('system', systemPrompt),
        ...input.history.map(msg => new Message(msg.role, msg.content)),
        new Message('user', input.question),
    ];

    const { output } = await ai.generate({
        model: 'openai/gpt-3.5-turbo',
        prompt: {
            messages
        },
        config: {
          temperature: 0.5,
        },
        output: {
            schema: z.object({ answer: z.string() })
        }
    });

    if (!output) {
      throw new Error('فشل الذكاء الاصطناعي في توليد إجابة.');
    }
    
    return output;
  }
);
