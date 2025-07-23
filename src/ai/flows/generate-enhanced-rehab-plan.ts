'use server';

/**
 * @fileOverview Generates a personalized and enhanced 12-week rehabilitation plan for a patient based on their assessment data.
 * This flow combines diagnosis, prognosis, planning, and medical considerations into a single, efficient AI call.
 */

import { ai, DEFAULT_MODEL } from '@/ai/genkit';
import { z } from 'zod';

const GenerateEnhancedRehabPlanInputSchema = z.object({
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
export type GenerateEnhancedRehabPlanInput = z.infer<typeof GenerateEnhancedRehabPlanInputSchema>;

const GenerateEnhancedRehabPlanOutputSchema = z.object({
  initialDiagnosis: z.string().describe('The initial diagnosis based on symptoms and functional assessment.'),
  prognosis: z.string().describe('The scientific prognosis for the case, including recovery timeline and influencing factors.'),
  rehabPlan: z.string().describe('A detailed 12-week rehabilitation plan, structured in 3 phases with specific goals, exercises, and patient education.'),
  precautions: z.string().describe('A clear list of general precautions and contraindications based on all patient data.'),
  medicationsInfluence: z.string().describe('A detailed analysis of how the patient\'s current medications should influence the rehab plan, including side effects and necessary precautions for the therapist.'),
  fracturesInfluence: z.string().describe('Specific guidance on how the patient\'s history of fractures should influence the rehab plan, including forbidden exercises and safe progression strategies.'),
  reviewAppointments: z.string().describe('A recommended schedule for follow-up appointments to assess progress and adjust the plan.'),
});
export type GenerateEnhancedRehabPlanOutput = z.infer<typeof GenerateEnhancedRehabPlanOutputSchema>;

export async function generateEnhancedRehabPlan(input: GenerateEnhancedRehabPlanInput): Promise<GenerateEnhancedRehabPlanOutput> {
  return generateEnhancedRehabPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEnhancedRehabPlanPrompt',
  input: {
    schema: GenerateEnhancedRehabPlanInputSchema,
  },
  output: {
    schema: GenerateEnhancedRehabPlanOutputSchema,
  },
  model: DEFAULT_MODEL,
  config: {
    temperature: 0.6,
    maxOutputTokens: 4000,
  },
  prompt: `أنت استشاري تأهيل طبي وخبير ومحترف. مهمتك هي إنشاء تقرير تأهيلي شامل ومتكامل وشخصي للغاية، مبني على أسس علمية قوية، لمريض بناءً على بياناته المدخلة. يجب أن تكون جميع أقسام التقرير واقعية، دقيقة، وقابلة للتطبيق العملي من قبل أخصائي العلاج الطبيعي. استخدم المصطلحات الطبية الدقيقة.

**بيانات المريض الأساسية:**
- **الوظيفة:** {{{job}}} (مهم لتخصيص التمارين الوظيفية)
- **الأعراض الرئيسية:** {{{symptoms}}}
- **العمر:** {{{age}}} سنة
- **الجنس:** {{{gender}}}
- **القدرة الوظيفية:**
    - التحكم بالرقبة: {{{neck}}}
    - التحكم بالجذع: {{{trunk}}}
    - القدرة على الوقوف: {{{standing}}}
    - القدرة على المشي: {{{walking}}}
- **التاريخ الطبي:**
    - الأدوية: {{{medications}}}
    - الكسور: {{{fractures}}}

**تعليمات صارمة (يجب الالتزام بها):**
- **التحليل المتكامل:** يجب أن تكون جميع المخرجات مترابطة. على سبيل المثال، يجب أن تعكس "الاحتياطات" تأثير "الأدوية" و "الكسور" المذكورة في الأقسام الخاصة بها.
- **التخصيص العميق:** اربط كل جزء من الخطة ببيانات المريض بشكل واضح. مثال: "بسبب ضعف التحكم بالجذع ({{{trunk}}}), سنبدأ بتمارين..." أو "لأن وظيفة المريض هي {{{job}}}, سنركز على..."
- **الأساس العلمي:** برر اختيار التمارين والأهداف بناءً على الأدلة السريرية والحالة الفردية للمريض.
- **الواقعية:** قدم خطة منطقية ومناسبة للحالة. تجنب التوصيات العامة والغامضة.
- **التنسيق:** استخدم تنسيق Markdown بشكل احترافي مع العناوين والنقاط الواضحة لتسهيل القراءة. لا تستخدم JSON.

**المطلوب منك إعداد التقرير المتكامل التالي (يجب أن يكون كل قسم فقرة نصية متصلة ومفصلة باللغة العربية الطبية):**

1.  **التشخيص المبدئي (initialDiagnosis):**
    بناءً على الأعراض ({{{symptoms}}}) والتقييم الحركي، قدم تشخيصًا وظيفيًا محتملاً. ما هي المشكلة الرئيسية من منظور العلاج الطبيعي؟

2.  **التوقعات العلمية (prognosis):**
    بناءً على عمر المريض ({{{age}}}), حالته العامة، والتزامه المتوقع، قدم توقعات واقعية. ما هي نسبة التحسن المحتملة خلال 12 أسبوعًا؟ اذكر العوامل التي قد تسرع أو تبطئ عملية الشفاء.

3.  **خطة التأهيل المفصلة لـ 12 أسبوع (rehabPlan):**
    هذا هو الجزء الأهم. قدم خطة مفصلة ومنظمة كنص متصل باستخدام Markdown. قسم الخطة إلى 3 مراحل (4 أسابيع لكل مرحلة). لكل مرحلة، اذكر بوضوح:
    *   **الأهداف الرئيسية للمرحلة:** (مثال: تقليل الألم بنسبة 50%، تحسين نطاق حركة العمود الفقري القطني، تمكين المريض من الجلوس لمدة 20 دقيقة متواصلة).
    *   **التمارين العلاجية:** (اذكر أسماء التمارين، عدد المجموعات والتكرارات، ومدة الراحة). اشرح لماذا اخترت هذه التمارين تحديدًا لهذه الحالة.
    *   **التمارين الوظيفية:** اربطها مباشرة بمهنة المريض ({{{job}}}) وأنشطته اليومية.
    *   **تثقيف المريض:** نصائح حول وضعيات الجسم الصحيحة، أهمية الالتزام بالتمارين المنزلية، استراتيجيات التعامل مع الألم.

4.  **الاحتياطات والموانع (precautions):**
    اذكر قائمة واضحة بالاحتياطات والموانع بناءً على جميع بيانات المريض (الأعراض، الأدوية، الكسور). (مثال: تجنب الانحناء الكامل للظهر في الأسابيع الأربعة الأولى، عدم حمل أوزان تزيد عن 5 كجم، مراقبة ضغط الدم قبل وبعد الجلسة بسبب دواء X).

5.  **تحليل تأثير الأدوية (medicationsInfluence):**
    بناءً على الأدوية المذكورة "{{{medications}}}", اشرح بالتفصيل كيف تؤثر هذه الأدوية على قدرة المريض على أداء التمارين. ركز على الآثار الجانبية المحتملة، احتياطات محددة للمعالج، توصيات عملية، وعلامات الخطر.

6.  **تحليل تأثير الكسور (fracturesInfluence):**
    بناءً على تاريخ الكسور المذكور "{{{fractures}}}", قدم توجيهات واضحة للمعالج. ركز على مراحل الشفاء، التمارين الممنوعة، التمارين الآمنة، والتدرج في حمل الوزن.

7.  **جدول المتابعة (reviewAppointments):**
    اقترح جدولًا منطقيًا لمواعيد المراجعة مع المعالج لتقييم التقدم وتعديل الخطة.`,
});

const generateEnhancedRehabPlanFlow = ai.defineFlow(
  {
    name: 'generateEnhancedRehabPlanFlow',
    inputSchema: GenerateEnhancedRehabPlanInputSchema,
    outputSchema: GenerateEnhancedRehabPlanOutputSchema,
  },
  async (input) => {
    try {
      const validatedInput = GenerateEnhancedRehabPlanInputSchema.parse(input);
      
      const result = await prompt(validatedInput);
      
      if (!result || !result.output) {
        throw new Error('No valid output received from AI model');
      }
      
      // Ensure all fields are strings, even if the model messes up.
      const processedOutput = {
        initialDiagnosis: String(result.output.initialDiagnosis || 'لم يتمكن الذكاء الاصطناعي من تحديد التشخيص.'),
        prognosis: String(result.output.prognosis || 'لم يتمكن الذكاء الاصطناعي من تحديد التوقعات.'),
        rehabPlan: String(result.output.rehabPlan || 'لم يتمكن الذكاء الاصطناعي من إنشاء خطة التأهيل.'),
        precautions: String(result.output.precautions || 'لا توجد احتياطات خاصة مذكورة.'),
        medicationsInfluence: String(result.output.medicationsInfluence || 'لم يتمكن الذكاء الاصطناعي من تحليل تأثير الأدوية.'),
        fracturesInfluence: String(result.output.fracturesInfluence || 'لم يتمكن الذكاء الاصطناعي من تحليل تأثير الكسور.'),
        reviewAppointments: String(result.output.reviewAppointments || 'يوصى بمراجعة أسبوعية في البداية.'),
      };
      
      // Check for empty or placeholder-like responses
      if (processedOutput.rehabPlan.length < 100) {
          throw new Error("AI returned a very short or empty rehab plan.");
      }

      const validatedOutput = GenerateEnhancedRehabPlanOutputSchema.parse(processedOutput);
      return validatedOutput;
      
    } catch (error: any) {
      console.error('Error in generateEnhancedRehabPlanFlow:', error);
      
      const fallbackResponse: GenerateEnhancedRehabPlanOutput = {
        initialDiagnosis: `تعذر على الذكاء الاصطناعي إنشاء تشخيص دقيق. يتطلب التشخيص تقييمًا سريريًا مباشرًا للأعراض: ${input.symptoms}.`,
        prognosis: `تعتمد التوقعات بشكل كبير على شدة الحالة والتزام المريض. يجب وضع الأهداف بالتشاور المباشر مع المعالج.`,
        rehabPlan: `**خطة تأهيلية أولية مقترحة (تحتاج إلى تخصيص من قبل المعالج):**
        
*   **المرحلة الأولى (1-4 أسابيع):** التركيز على تخفيف الألم والالتهاب (إذا وجد) وتمارين الحركة الأساسية في نطاق غير مؤلم.
*   **المرحلة الثانية (5-8 أسابيع):** البدء بتمارين التقوية الخفيفة وتحسين التحكم العضلي.
*   **المرحلة الثالثة (9-12 أسابيع):** التدرج في تمارين التقوية والبدء في التمارين الوظيفية المتعلقة بأنشطة المريض اليومية ووظيفته (${input.job}).`,
        precautions: `**احتياطات عامة:** يجب إيقاف أي تمرين يسبب ألمًا حادًا. يجب مراعاة تأثير الأدوية (${input.medications}) والكسور السابقة (${input.fractures}) على الخطة العلاجية. استشر الطبيب دائمًا.`,
        medicationsInfluence: `لم يتمكن الذكاء الاصطناعي من تحليل تأثير الأدوية بشكل دقيق. كقاعدة عامة، مع الأدوية (${input.medications}), يجب على المعالج مراقبة العلامات الحيوية للمريض وتعديل شدة التمارين بناءً عليها.`,
        fracturesInfluence: `لم يتمكن الذكاء الاصطناعي من تحليل تأثير الكسور بشكل دقيق. في حالة وجود كسور (${input.fractures}), يجب تجنب أي ضغط أو إجهاد مباشر على منطقة الكسر حتى يسمح الطبيب بذلك.`,
        reviewAppointments: `يوصى بمراجعة أسبوعية في البداية لتقييم الاستجابة للعلاج، ثم يمكن تباعد الجلسات بناءً على التقدم.`
      };
      
      console.warn('Using fallback response due to error:', error.message);
      return fallbackResponse;
    }
  }
);
