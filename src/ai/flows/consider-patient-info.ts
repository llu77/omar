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
    temperature: 0.7,
    maxOutputTokens: 2000,
  },
  prompt: `أنت استشاري طبي متخصص في التأهيل الطبي. بناءً على بيانات المريض التالية، قدم شرحاً علمياً دقيقاً لكيفية تأثير الأدوية والكسور على خطة التأهيل.

معلومات المريض:
- العمر: {{{age}}} سنة
- الجنس: {{{gender}}}
- الوظيفة: {{{job}}}
- الأعراض: {{{symptoms}}}
- التحكم بالرقبة: {{{neck}}}
- التحكم بالجذع: {{{trunk}}}
- القدرة على الوقوف: {{{standing}}}
- القدرة على المشي: {{{walking}}}
- الأدوية: {{{medications}}}
- الكسور: {{{fractures}}}

**تعليمات مهمة جداً:**
- اكتب كل إجابة كفقرة نصية كاملة باللغة العربية
- لا تستخدم JSON أو القوائم المنقطة
- اكتب نصاً متصلاً وواضحاً

المطلوب:

1. **تأثير الأدوية (medicationsInfluence):**
اكتب فقرة واحدة متصلة تشرح كيف يمكن للأدوية المذكورة أن تؤثر على البرنامج التأهيلي، متضمنة الموانع والاحتياطات والتعديلات المطلوبة.

2. **تأثير الكسور (fracturesInfluence):**
اكتب فقرة واحدة متصلة تشرح كيف يجب أن تؤثر الكسور (إن وجدت) على خطة التأهيل، متضمنة مراحل الالتئام والاحتياطات اللازمة.

تذكر: اكتب كل قسم كفقرة نصية متصلة باللغة العربية الطبية الاحترافية.`,
});

const considerPatientInfoFlow = ai.defineFlow(
  {
    name: 'considerPatientInfoFlow',
    inputSchema: ConsiderPatientInfoInputSchema,
    outputSchema: ConsiderPatientInfoOutputSchema,
  },
  async (input) => {
    try {
      // تحقق من صحة المدخلات
      const validatedInput = ConsiderPatientInfoInputSchema.parse(input);
      
      // استدعاء النموذج
      const result = await prompt(validatedInput);
      
      // التحقق من وجود مخرجات
      if (!result || !result.output) {
        throw new Error('No output received from AI model');
      }
      
      // معالجة المخرجات للتأكد من أنها نصوص
      let processedOutput = result.output;
      
      // التأكد من أن القيم نصوص وليست كائنات
      if (typeof processedOutput.medicationsInfluence !== 'string') {
        processedOutput.medicationsInfluence = JSON.stringify(processedOutput.medicationsInfluence);
      }
      if (typeof processedOutput.fracturesInfluence !== 'string') {
        processedOutput.fracturesInfluence = JSON.stringify(processedOutput.fracturesInfluence);
      }
      
      // التحقق من صحة المخرجات
      const validatedOutput = ConsiderPatientInfoOutputSchema.parse(processedOutput);
      
      return validatedOutput;
      
    } catch (error: any) {
      console.error('Error in considerPatientInfoFlow:', error);
      
      // في حالة الفشل، نرجع قيماً افتراضية باللغة العربية
      const fallbackResponse: ConsiderPatientInfoOutput = {
        medicationsInfluence: `بناءً على الأدوية المذكورة (${input.medications})، يجب مراعاة عدة عوامل مهمة في البرنامج التأهيلي. أولاً، يجب التأكد من عدم وجود تعارض بين الأدوية والتمارين العلاجية المقترحة، خاصة إذا كانت الأدوية تؤثر على ضغط الدم أو معدل ضربات القلب. ثانياً، يجب مراقبة الآثار الجانبية للأدوية التي قد تؤثر على القدرة على أداء التمارين مثل الدوخة أو الإرهاق. ثالثاً، قد تحتاج شدة التمارين إلى تعديل بناءً على تأثير الأدوية على القدرة البدنية للمريض. رابعاً، من الضروري التنسيق المستمر مع الطبيب المعالج لضمان توافق البرنامج التأهيلي مع الخطة الدوائية وإجراء أي تعديلات ضرورية.`,
        
        fracturesInfluence: `فيما يتعلق بالكسور (${input.fractures})، يجب اتباع نهج حذر ومدروس في البرنامج التأهيلي. إذا كانت هناك كسور، فيجب تجنب أي ضغط مباشر على منطقة الكسر حتى يكتمل الالتئام العظمي. يُنصح بالبدء بتمارين الحركة السلبية للمفاصل المجاورة للحفاظ على مرونتها دون إجهاد منطقة الكسر. بعد ذلك، يمكن التدرج إلى تمارين الحركة النشطة مع التركيز على تقوية العضلات المحيطة بمنطقة الكسر دون تحميل مباشر. من المهم جداً مراعاة مراحل التئام العظام والتدرج في التحميل بناءً على التقييم الطبي المستمر. يجب المتابعة الدورية مع طبيب العظام وإجراء الأشعة اللازمة لتقييم مدى التئام الكسر وتعديل البرنامج التأهيلي وفقاً لذلك.`
      };
      
      // إذا كان الخطأ متعلق بالنموذج أو التحقق من الصحة، نرجع القيم الافتراضية
      if (error.message && (error.message.includes('Model') || error.message.includes('NOT_FOUND') || error.message.includes('Schema validation'))) {
        console.warn('Using fallback response due to error:', error.message);
        return fallbackResponse;
      }
      
      // في حالات أخرى، نعيد رمي الخطأ
      throw new Error(`Failed to generate patient info consideration: ${error.message}`);
    }
  }
);