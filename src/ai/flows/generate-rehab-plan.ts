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
  model: 'gpt-4o-mini',
  prompt: `You are a highly experienced medical rehabilitation consultant. A patient requires a comprehensive and scientifically-grounded rehabilitation plan. **All output must be in Arabic.**

Your task is to conduct a thorough analysis of the patient's data. Pay special attention to their **job requirements** and **presenting symptoms** to formulate a highly personalized and effective plan.

**Patient Data:**
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

Based on this data, you are to provide the following sections in a precise, clinical, and structured scientific manner:

1.  **Initial Diagnosis:** Provide a preliminary clinical diagnosis based on the provided symptoms, functional status, and patient history.
2.  **Scientific Prognosis:** Formulate a scientific forecast of the patient's recovery potential, including an estimated timeline and expected functional outcomes, supported by clinical reasoning.
3.  **Detailed 12-Week Rehabilitation Plan:** Design a comprehensive, week-by-week therapeutic plan. For each week, specify the exercises, techniques, sets, repetitions, duration, and rest periods. The plan must be progressive and directly tailored to address the patient's symptoms and achieve their functional goals, particularly in relation to their job.
4.  **Clinical Precautions:** Enumerate key precautions, contraindications, and modifications required to ensure patient safety and optimize outcomes throughout the rehabilitation process.
5.  **Follow-up Schedule:** Recommend a schedule for follow-up appointments to monitor progress, reassess the patient, and adjust the plan as necessary.`,
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
