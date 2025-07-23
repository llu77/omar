'use server';

/**
 * @fileOverview A Genkit flow that helps physical therapists consider whether certain pieces of patient information should significantly influence the rehab plan generation.
 */

import { ai, DEFAULT_MODEL } from '@/ai/genkit';
import { z } from 'zod';

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
  input: {
    schema: ConsiderPatientInfoInputSchema,
  },
  output: {
    schema: ConsiderPatientInfoOutputSchema,
  },
  model: DEFAULT_MODEL,
  config: {
    temperature: 0.5, // تقليل درجة الحرارة لزيادة الدقة والواقعية
    maxOutputTokens: 2000,
  },
  prompt: `أنت استشاري طبي متخصص في التأهيل والعلاج الطبيعي. بناءً على بيانات المريض التالية، قدم تحليلًا علميًا وعمليًا دقيقًا لكيفية تأثير الأدوية والكسور على خطة التأهيل المقترحة. يجب أن يكون تحليلك مبنيًا على الأدلة وموجهًا للمعالج الطبيعي.

**ملف المريض:**
- العمر: {{{age}}} سنة
- الجنس: {{{gender}}}
- الوظيفة: {{{job}}}
- الأعراض: {{{symptoms}}}
- التحكم بالرقبة: {{{neck}}}
- التحكم بالجذع: {{{trunk}}}
- القدرة على الوقوف: {{{standing}}}
- القدرة على المشي: {{{walking}}}
- **الأدوية الحالية:** {{{medications}}}
- **تاريخ الكسور:** {{{fractures}}}

**المطلوب (يجب أن تكون الإجابات فقرات نصية متصلة باللغة العربية الطبية الواضحة):**

1.  **تحليل تأثير الأدوية (medicationsInfluence):**
    بناءً على الأدوية المذكورة "{{{medications}}}", اشرح بالتفصيل كيف تؤثر هذه الأدوية على قدرة المريض على أداء التمارين. ركز على:
    *   الآثار الجانبية المحتملة (مثل الدوار، الإرهاق، ضعف العضلات، أو التأثير على ضغط الدم).
    *   احتياطات محددة يجب على المعالج اتخاذها (مثال: قياس الضغط قبل وبعد الجلسة، تعديل شدة التمارين).
    *   توصيات عملية حول أفضل وقت لممارسة التمارين بالنسبة لمواعيد الدواء.
    *   علامات الخطر التي يجب مراقبتها أثناء الجلسة.

2.  **تحليل تأثير الكسور (fracturesInfluence):**
    بناءً على تاريخ الكسور المذكور "{{{fractures}}}", قدم توجيهات واضحة للمعالج. ركز على:
    *   المراحل الزمنية للشفاء (إذا كان الكسر حديثًا) وتأثيرها على نوع وشدة التمارين.
    *   التمارين الممنوعة تمامًا في المراحل المبكرة.
    *   التمارين الآمنة والموصى بها لتقوية العضلات المحيطة دون إجهاد منطقة الكسر.
    *   أهمية التدرج في حمل الوزن (Weight-Bearing) وكيفية تطبيقه بأمان.
    *   علامات التحذير التي تدل على عدم التئام الكسر بشكل صحيح.

تذكر، هدفك هو تزويد المعالج بمعلومات عملية ودقيقة لضمان سلامة وفعالية برنامج التأهيل.`,
});

const considerPatientInfoFlow = ai.defineFlow(
  {
    name: 'considerPatientInfoFlow',
    inputSchema: ConsiderPatientInfoInputSchema,
    outputSchema: ConsiderPatientInfoOutputSchema,
  },
  async (input) => {
    try {
      const validatedInput = ConsiderPatientInfoInputSchema.parse(input);
      
      const result = await prompt(validatedInput);
      
      if (!result || !result.output) {
        throw new Error('No output received from AI model');
      }
      
      let processedOutput = result.output;
      
      if (typeof processedOutput.medicationsInfluence !== 'string') {
        processedOutput.medicationsInfluence = JSON.stringify(processedOutput.medicationsInfluence);
      }
      if (typeof processedOutput.fracturesInfluence !== 'string') {
        processedOutput.fracturesInfluence = JSON.stringify(processedOutput.fracturesInfluence);
      }
      
      const validatedOutput = ConsiderPatientInfoOutputSchema.parse(processedOutput);
      
      return validatedOutput;
      
    } catch (error: any) {
      console.error('Error in considerPatientInfoFlow:', error);
      
      // Fallback response with more informative placeholders
      const fallbackResponse: ConsiderPatientInfoOutput = {
        medicationsInfluence: `لم يتمكن الذكاء الاصطناعي من تحليل تأثير الأدوية بشكل دقيق. كقاعدة عامة، مع الأدوية (${input.medications}), يجب على المعالج مراقبة العلامات الحيوية للمريض (ضغط الدم، نبضات القلب) قبل وبعد الجلسة، وملاحظة أي أعراض جانبية مثل الدوار أو الإرهاق وتعديل شدة التمارين بناءً عليها. التواصل المستمر مع الطبيب المعالج ضروري.`,
        fracturesInfluence: `لم يتمكن الذكاء الاصطناعي من تحليل تأثير الكسور بشكل دقيق. بشكل عام، في حالة وجود كسور (${input.fractures}), يجب تجنب أي ضغط أو إجهاد مباشر على منطقة الكسر حتى يسمح الطبيب بذلك. يجب التركيز على تمارين تحريك المفاصل المجاورة وتقوية العضلات المحيطة بشكل غير مباشر. التدرج في حمل الوزن يجب أن يتم بحذر شديد وبناءً على صور الأشعة وتوصيات طبيب العظام.`
      };
      
      if (error.message && (error.message.includes('Model') || error.message.includes('NOT_FOUND') || error.message.includes('Schema validation'))) {
        console.warn('Using fallback response due to error:', error.message);
        return fallbackResponse;
      }
      
      throw new Error(`Failed to generate patient info consideration: ${error.message}`);
    }
  }
);
