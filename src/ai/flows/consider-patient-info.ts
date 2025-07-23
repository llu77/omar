'use server';

/**
 * @fileOverview A Genkit flow that helps physical therapists consider whether certain pieces of patient information should significantly influence the rehab plan generation.
 *
 * - considerPatientInfo - A function that handles the consideration of patient information for rehab plan influence.
 * - ConsiderPatientInfoInput - The input type for the considerPatientInfo function.
 * - ConsiderPatientInfoOutput - The return type for the considerPatientInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConsiderPatientInfoInputSchema = z.object({
  job: z.string().describe("The patient's job."),
  symptoms: z.string().describe("The patient's symptoms."),
  age: z.number().describe('The age of the patient.'),
  gender: z.string().describe('The gender of the patient.'),
  neck: z.string().describe('The neck control status of the patient (yes/partially/no).'),
  trunk: z.string().describe('The trunk control status of the patient (yes/partially/no).'),
  standing: z.string().describe('The standing ability of the patient (yes/with assistance/no).'),
  walking: z.string().describe('The walking ability of the patient (yes/with assistance/no).'),
  medications: z.string().describe('The medications the patient is taking (yes/no + details).'),
  fractures: z.string().describe('The fractures the patient has experienced (yes/no + location).'),
});
export type ConsiderPatientInfoInput = z.infer<typeof ConsiderPatientInfoInputSchema>;

const ConsiderPatientInfoOutputSchema = z.object({
  medicationsInfluence: z.string().describe('Explanation of how medications should influence the rehab plan.'),
  fracturesInfluence: z.string().describe('Explanation of how fractures should influence the rehab plan.'),
});
export type ConsiderPatientInfoOutput = z.infer<typeof ConsiderPatientInfoOutputSchema>;

export async function considerPatientInfo(input: ConsiderPatientInfoInput): Promise<ConsiderPatientInfoOutput> {
  return considerPatientInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'considerPatientInfoPrompt',
  input: {schema: ConsiderPatientInfoInputSchema},
  output: {schema: ConsiderPatientInfoOutputSchema},
  model: 'gpt-4o-mini',
  prompt: `You are an expert medical rehabilitation consultant providing a preliminary analysis. **All output must be in Arabic.**

Based on the following patient data, provide a scientific and precise explanation of how the specified medical history points (medications and fractures) should be considered when designing the full rehabilitation plan.

Patient Information:
- Age: {{{age}}}
- Gender: {{{gender}}}
- Job: {{{job}}}
- Symptoms: {{{symptoms}}}
- Neck Control: {{{neck}}}
- Trunk Control: {{{trunk}}}
- Standing: {{{standing}}}
- Walking: {{{walking}}}
- Medications: {{{medications}}}
- Fractures: {{{fractures}}}

Consideration for Medications: Medications can significantly impact a patient's physiological response to exercise, including energy levels, pain tolerance, and healing capacity. Certain drugs may have contraindications for specific therapeutic modalities or require adjustments to the intensity, duration, and type of exercises. Document how the patient's medications should influence the rehab plan from a clinical perspective.

Consideration for Fractures: The presence of fractures is a critical determinant in the rehabilitation plan. The strategy must be tailored to the fracture's location, type, severity, and stage of healing. The primary goals are to protect the fracture site to ensure proper bone union, manage pain and inflammation, and gradually restore function to the affected and surrounding areas without compromising stability. Document how the patient's fractures should influence the rehab plan from a clinical perspective.`,
});

const considerPatientInfoFlow = ai.defineFlow(
  {
    name: 'considerPatientInfoFlow',
    inputSchema: ConsiderPatientInfoInputSchema,
    outputSchema: ConsiderPatientInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
