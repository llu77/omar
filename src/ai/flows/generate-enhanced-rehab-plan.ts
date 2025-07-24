
'use server';

/**
 * @fileOverview A flow for generating a personalized 12-week rehabilitation plan using OpenAI.
 *
 * - generateEnhancedRehabPlan: The main function to generate the plan.
 * - GenerateEnhancedRehabPlanInput: The Zod schema for the input.
 * - GenerateEnhancedRehabPlanOutput: The Zod schema for the output.
 */

import OpenAI from 'openai';
import { z } from 'zod';

// ==================== OpenAI Client Initialization ====================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================== Schema Definitions ====================
const GenerateEnhancedRehabPlanInputSchema = z.object({
  job: z.string().min(1, 'الوظيفة مطلوبة'),
  symptoms: z.string().min(1, 'الأعراض مطلوبة'),
  age: z.number().int().min(1).max(120),
  gender: z.enum(['male', 'female', 'ذكر', 'أنثى']),
  neck: z.enum(['yes', 'partially', 'no', 'نعم', 'جزئياً', 'لا']),
  trunk: z.enum(['yes', 'partially', 'no', 'نعم', 'جزئياً', 'لا']),
  standing: z.enum(['yes', 'assisted', 'no', 'نعم', 'بمساعدة', 'لا']),
  walking: z.enum(['yes', 'assisted', 'no', 'نعم', 'بمساعدة', 'لا']),
  medications: z.string(),
  fractures: z.string(),
});

const GenerateEnhancedRehabPlanOutputSchema = z.object({
  initialDiagnosis: z.string().describe('The potential functional diagnosis based on the provided information.'),
  prognosis: z.string().describe('Expectations for improvement over 12 weeks with estimated percentages.'),
  rehabPlan: z.string().describe('A detailed 12-week rehabilitation plan including stages, exercises, and goals. Should be formatted as markdown.'),
  precautions: z.string().describe('Important precautions to consider during the program.'),
  medicationsInfluence: z.string().describe('The impact of the mentioned medications on the rehabilitation program.'),
  fracturesInfluence: z.string().describe('Special considerations for fractures, if any, and their impact on the plan.'),
  reviewAppointments: z.string().describe('The proposed follow-up schedule with details.'),
});

// ==================== Type Exports ====================
export type GenerateEnhancedRehabPlanInput = z.infer<typeof GenerateEnhancedRehabPlanInputSchema>;
export type GenerateEnhancedRehabPlanOutput = z.infer<typeof GenerateEnhancedRehabPlanOutputSchema>;

// ==================== Main Export ====================
/**
 * Generates an enhanced rehabilitation plan based on patient data
 * @param input - Patient information and symptoms
 * @returns Promise with the generated rehabilitation plan
 */
export async function generateEnhancedRehabPlan(input: GenerateEnhancedRehabPlanInput): Promise<GenerateEnhancedRehabPlanOutput> {
  try {
    const validatedInput = GenerateEnhancedRehabPlanInputSchema.parse(input);

    const systemPrompt = `You are an expert physical therapist. Create a detailed and scientific rehabilitation plan.

Patient Information:
- Age: ${validatedInput.age} years
- Gender: ${validatedInput.gender}
- Job: ${validatedInput.job}
- Symptoms: ${validatedInput.symptoms}

Motor Abilities:
- Neck Control: ${validatedInput.neck}
- Trunk Control: ${validatedInput.trunk}
- Standing Ability: ${validatedInput.standing}
- Walking Ability: ${validatedInput.walking}

Medical Information:
- Medications: ${validatedInput.medications}
- Fractures: ${validatedInput.fractures}

Your response must be in a valid JSON format that strictly follows this Zod schema:
${JSON.stringify(GenerateEnhancedRehabPlanOutputSchema.shape, null, 2)}

The rehabPlan should be detailed, structured into a 12-week program, and formatted using Markdown for clarity.
All text must be in Arabic.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125', // Using a model that's good with JSON
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Failed to generate a rehabilitation plan: No content in response.');
    }

    // Parse and validate the JSON output from the model
    const parsedOutput = JSON.parse(content);
    const validatedOutput = GenerateEnhancedRehabPlanOutputSchema.parse(parsedOutput);
    
    return validatedOutput;

  } catch (error) {
    console.error('[GenerateEnhancedRehabPlan] Error:', error);
    // In case of an error, re-throw it to be handled by the caller.
    throw new Error(
      `Failed to process the rehabilitation plan request: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
