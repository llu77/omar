
'use server';

/**
 * @fileOverview A flow for generating a personalized 12-week rehabilitation plan.
 *
 * - generateEnhancedRehabPlan: The main function to generate the plan.
 * - GenerateEnhancedRehabPlanInput: The Zod schema for the input.
 * - GenerateEnhancedRehabPlanOutput: The Zod schema for the output.
 */

import {ai, z, defineFlow} from '@/ai/genkit';

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
  initialDiagnosis: z
    .string()
    .describe(
      'The potential functional diagnosis based on the provided information.'
    ),
  prognosis: z
    .string()
    .describe(
      'Expectations for improvement over 12 weeks with estimated percentages.'
    ),
  rehabPlan: z
    .string()
    .describe(
      'A detailed 12-week rehabilitation plan including stages, exercises, and goals. Should be formatted as markdown.'
    ),
  precautions: z
    .string()
    .describe('Important precautions to consider during the program.'),
  medicationsInfluence: z
    .string()
    .describe(
      'The impact of the mentioned medications on the rehabilitation program.'
    ),
  fracturesInfluence: z
    .string()
    .describe(
      'Special considerations for fractures, if any, and their impact on the plan.'
    ),
  reviewAppointments: z
    .string()
    .describe('The proposed follow-up schedule with details.'),
});

// ==================== Type Exports ====================

export type GenerateEnhancedRehabPlanInput = z.infer<
  typeof GenerateEnhancedRehabPlanInputSchema
>;
export type GenerateEnhancedRehabPlanOutput = z.infer<
  typeof GenerateEnhancedRehabPlanOutputSchema
>;

// ==================== Prompt Definition ====================

const rehabPlanPrompt = ai.definePrompt({
  name: 'rehabPlanPrompt',
  input: {schema: GenerateEnhancedRehabPlanInputSchema},
  output: {schema: GenerateEnhancedRehabPlanOutputSchema},
  prompt: `You are an expert physical therapist. Create a detailed and scientific rehabilitation plan.

Patient Information:
- Age: {{age}} years
- Gender: {{gender}}
- Job: {{job}}
- Symptoms: {{symptoms}}

Motor Abilities:
- Neck Control: {{neck}}
- Trunk Control: {{trunk}}
- Standing Ability: {{standing}}
- Walking Ability: {{walking}}

Medical Information:
- Medications: {{medications}}
- Fractures: {{fractures}}

Your response must be in JSON format, strictly following the output schema.
The rehabPlan should be detailed, structured into a 12-week program, and formatted using Markdown for clarity.
All text must be in Arabic.`,
});

// ==================== Flow Definition ====================

const generateRehabPlanFlow = defineFlow(
  {
    name: 'generateRehabPlanFlow',
    inputSchema: GenerateEnhancedRehabPlanInputSchema,
    outputSchema: GenerateEnhancedRehabPlanOutputSchema,
  },
  async input => {
    const {output} = await rehabPlanPrompt(input);
    if (!output) {
      throw new Error('Failed to generate a rehabilitation plan.');
    }
    return output;
  }
);

// ==================== Main Export ====================

/**
 * Generates an enhanced rehabilitation plan based on patient data
 * @param input - Patient information and symptoms
 * @returns Promise with the generated rehabilitation plan
 */
export async function generateEnhancedRehabPlan(
  input: GenerateEnhancedRehabPlanInput
): Promise<GenerateEnhancedRehabPlanOutput> {
  try {
    const validatedInput =
      GenerateEnhancedRehabPlanInputSchema.parse(input);
    const result = await generateRehabPlanFlow(validatedInput);
    return result;
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
