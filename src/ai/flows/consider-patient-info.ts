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
import {openAI} from 'genkitx-openai';

const ConsiderPatientInfoInputSchema = z.object({
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
  prompt: `You are an expert physical therapist. Consider the following patient information and explain how medications and fractures should influence the rehabilitation plan.\n\nPatient Information:\nAge: {{{age}}}\nGender: {{{gender}}}\nNeck Control: {{{neck}}}\nTrunk Control: {{{trunk}}}\nStanding: {{{standing}}}\nWalking: {{{walking}}}\nMedications: {{{medications}}}\nFractures: {{{fractures}}}\n\nMedications Influence: Medications can impact a patient's energy levels, pain tolerance, and overall healing ability.  Certain medications may contraindicate specific exercises or require adjustments to the intensity and duration of the rehabilitation program.  Document how medications should influence the rehab plan.\n\nFractures Influence: Fractures significantly impact the rehabilitation plan based on their location, severity, and stage of healing.  The plan must protect the fracture site, promote bone healing, and gradually restore function to the affected area.  Document how fractures should influence the rehab plan.`, // eslint-disable-line max-len
});

const considerPatientInfoFlow = ai.defineFlow(
  {
    name: 'considerPatientInfoFlow',
    inputSchema: ConsiderPatientInfoInputSchema,
    outputSchema: ConsiderPatientInfoOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: openAI('gpt-4o-mini'),
      prompt: {
        text: `You are an expert physical therapist. Consider the following patient information and explain how medications and fractures should influence the rehabilitation plan.\n\nPatient Information:\nAge: ${input.age}\nGender: ${input.gender}\nNeck Control: ${input.neck}\nTrunk Control: ${input.trunk}\nStanding: ${input.standing}\nWalking: ${input.walking}\nMedications: ${input.medications}\nFractures: ${input.fractures}\n\nMedications Influence: Medications can impact a patient's energy levels, pain tolerance, and overall healing ability.  Certain medications may contraindicate specific exercises or require adjustments to the intensity and duration of the rehabilitation program.  Document how medications should influence the rehab plan.\n\nFractures Influence: Fractures significantly impact the rehabilitation plan based on their location, severity, and stage of healing.  The plan must protect the fracture site, promote bone healing, and gradually restore function to the affected area.  Document how fractures should influence the rehab plan.`
      },
      output: {
        schema: ConsiderPatientInfoOutputSchema
      }
    });
    return output!;
  }
);
