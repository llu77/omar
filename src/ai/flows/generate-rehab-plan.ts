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
  job: z.string().describe("The patient's job."),
  symptoms: z.string().describe("The patient's symptoms."),
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
  initialDiagnosis: z.string().describe('The initial diagnosis.'),
  prognosis: z.string().describe('The scientific prognosis for the case.'),
  precautions: z.string().describe('Any precautions to take.'),
  reviewAppointments: z.string().describe('Recommended review appointments.'),
});
export type GenerateRehabPlanOutput = z.infer<typeof GenerateRehabPlanOutputSchema>;

export async function generateRehabPlan(input: GenerateRehabPlanInput): Promise<GenerateRehabPlanOutput> {
  return generateRehabPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRehabPlanPrompt',
  input: {schema: GenerateRehabPlanInputSchema},
  output: {schema: GenerateRehabPlanOutputSchema},
  model: 'openai/gpt-4o-mini',
  prompt: `You are a medical rehabilitation consultant. A patient requires a detailed rehabilitation plan. **All output must be in Arabic.**

Analyze the patient's data, focusing on their job and symptoms to provide a comprehensive plan.

Patient Data:
- Job: {{{job}}}
- Symptoms: {{{symptoms}}}
- Age: {{{age}}}
- Gender: {{{gender}}}
- Neck control: {{{neck}}}
- Trunk control: {{{trunk}}}
- Standing: {{{standing}}}
- Walking: {{{walking}}}
- Medications: {{{medications}}}
- Fractures: {{{fractures}}}

Based on the data, provide the following in a scientific and structured manner:
1.  **Initial Diagnosis:** A preliminary diagnosis based on the provided symptoms and functional status.
2.  **Prognosis:** A scientific forecast of the patient's recovery potential and timeline.
3.  **Detailed 12-Week Rehabilitation Plan:** A comprehensive week-by-week plan including specific exercises, sets, repetitions, and rest periods. The plan should be tailored to the patient's job requirements and functional goals.
4.  **Precautions:** Key precautions and contraindications to ensure patient safety.
5.  **Review Appointments:** A schedule for recommended follow-up appointments.`,
});

const generateRehabPlanFlow = ai.defineFlow(
  {
    name: 'generateRehabPlanFlow',
    inputSchema: GenerateRehabPlanInputSchema,
    outputSchema: GenerateRehabPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
