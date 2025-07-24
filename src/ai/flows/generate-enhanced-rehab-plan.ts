
'use server';

/**
 * @fileOverview A flow for generating a personalized 12-week rehabilitation plan using OpenAI.
 *
 * - generateEnhancedRehabPlan: The main function to generate the plan.
 * - GenerateEnhancedRehabPlanInput: The Zod schema for the input.
 * - GenerateEnhancedRehabPlanOutput: The Zod schema for the output.
 */

import OpenAI from 'openai';
import { GenerateEnhancedRehabPlanInput, GenerateEnhancedRehabPlanOutput, GenerateEnhancedRehabPlanInputSchema, GenerateEnhancedRehabPlanOutputSchema } from '@/types';


// ==================== OpenAI Client Initialization ====================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
