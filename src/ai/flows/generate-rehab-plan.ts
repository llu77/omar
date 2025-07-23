'use server';
/**
 * @fileOverview Generates a personalized 12-week rehabilitation plan for a patient based on their assessment data.
 *
 * - generateRehabPlan - A function that generates the rehabilitation plan.
 * - GenerateRehabPlanInput - The input type for the generateRehabPlan function.
 * - GenerateRehabPlanOutput - The return type for the generateRehabPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRehabPlanInputSchema = z.object({
  age: z.number().describe('The age of the patient.'),
  gender: z.string().describe('The gender of the patient.'),
  neck: z.string().describe('Neck control (yes/partially/no).'),
  trunk: z.string().describe('Trunk control (yes/partially/no).'),
  standing: z.string().describe('Standing ability (yes/assisted/no).'),
  walking: z.string().describe('Walking ability (yes/assisted/no).'),
  medications: z.string().describe('Medications (yes/no + details).'),
  fractures: z.string().describe('Fractures (yes/no + location).'),
});
export type GenerateRehabPlanInput = z.infer<typeof GenerateRehabPlanInputSchema>;

const GenerateRehabPlanOutputSchema = z.object({
  rehabPlan: z.string().describe('A detailed 12-week rehabilitation plan.'),
  expectedRecoveryRate: z.string().describe('The expected recovery rate.'),
  precautions: z.string().describe('Any precautions to take.'),
  reviewAppointments: z.string().describe('Recommended review appointments.'),
});
export type GenerateRehabPlanOutput = z.infer<typeof GenerateRehabPlanOutputSchema>;

export async function generateRehabPlan(input: GenerateRehabPlanInput): Promise<GenerateRehabPlanOutput> {
  return generateRehabPlanFlow(input);
}

const rehabPlanPrompt = ai.definePrompt({
  name: 'rehabPlanPrompt',
  input: {schema: GenerateRehabPlanInputSchema},
  output: {schema: GenerateRehabPlanOutputSchema},
  prompt: `You are a physical therapist. Create a detailed rehabilitation plan for a patient based on the following information:

Age: {{{age}}}
Gender: {{{gender}}}
Neck control: {{{neck}}}
Trunk control: {{{trunk}}}
Standing: {{{standing}}}
Walking: {{{walking}}}
Medications: {{{medications}}}
Fractures: {{{fractures}}}

Write:
1. A detailed 12-week plan with exercises and repetitions.
2. Expected recovery rate.
3. Precautions.
4. Review appointments.`,
});

const generateRehabPlanFlow = ai.defineFlow(
  {
    name: 'generateRehabPlanFlow',
    inputSchema: GenerateRehabPlanInputSchema,
    outputSchema: GenerateRehabPlanOutputSchema,
  },
  async input => {
    const {output} = await rehabPlanPrompt(input);
    return output!;
  }
);
