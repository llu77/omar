'use server';

/**
 * @fileOverview Generates a personalized 12-week rehabilitation plan for a patient based on their assessment data.
 */

import { ai, DEFAULT_MODEL } from '@/ai/genkit';
import { z } from 'zod';

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
  input: {
    schema: GenerateRehabPlanInputSchema,
  },
  output: {
    schema: GenerateRehabPlanOutputSchema,
  },
  model: DEFAULT_MODEL,
  config: {
    temperature: 0.6, // Adjusted for more realistic and consistent outputs
    maxOutputTokens: 4000,
  },
  prompt: `أنت استشاري تأهيل طبي خبير ومحترف. مهمتك هي إنشاء خطة تأهيل شاملة وشخصية للغاية، مبنية على أسس علمية قوية، لمريض بناءً على بياناته المدخلة. يجب أن تكون الخطة واقعية، دقيقة، وقابلة للتطبيق العملي من قبل أخصائي العلاج الطبيعي.

**بيانات المريض الأساسية:**
- **الوظيفة:** {{{job}}} (هذا مهم جدًا لتخصيص التمارين الوظيفية)
- **الأعراض الرئيسية:** {{{symptoms}}}
- **العمر:** {{{age}}} سنة
- **الجنس:** {{{gender}}}
- **التحكم بالرقبة:** {{{neck}}}
- **التحكم بالجذع:** {{{trunk}}}
- **القدرة على الوقوف:** {{{standing}}}
- **القدرة على المشي:** {{{walking}}}
- **الأدوية:** {{{medications}}}
- **الكسور:** {{{fractures}}}

**تعليمات صارمة (يجب الالتزام بها):**
- **التخصيص العميق:** اربط كل جزء من الخطة ببيانات المريض بشكل واضح. مثال: "بسبب ضعف التحكم بالجذع ({{{trunk}}}), سنبدأ بتمارين..." أو "لأن وظيفة المريض هي {{{job}}}, سنركز على..."
- **الواقعية:** قدم خطة منطقية ومناسبة للحالة. تجنب التوصيات العامة.
- **التنسيق:** استخدم التنسيق النصي الواضح (Markdown) مع العناوين والنقاط لتسهيل القراءة. لا تستخدم JSON.

**المطلوب منك إعداد التقرير التالي (كل قسم يجب أن يكون فقرة نصية متصلة ومفصلة):**

1.  **التشخيص الأولي (initialDiagnosis):**
    بناءً على الأعراض ({{{symptoms}}}) والتقييم الحركي، قدم تشخيصًا أوليًا مفصلاً. ما هي المشكلة الرئيسية؟ (مثال: ألم أسفل الظهر مزمن ناتج عن ضعف عضلات الجذع، مع تأثير على القدرة على المشي).

2.  **التوقعات العلمية (prognosis):**
    بناءً على عمر المريض ({{{age}}}) وحالته العامة، قدم توقعات واقعية. ما هي نسبة التحسن المحتملة؟ ما هو الجدول الزمني المتوقع للوصول إلى الأهداف الرئيسية؟ اذكر العوامل التي قد تسرع أو تبطئ عملية الشفاء.

3.  **خطة التأهيل المفصلة لـ 12 أسبوع (rehabPlan):**
    هذا هو الجزء الأهم. قدم خطة مفصلة ومنظمة كنص متصل باستخدام Markdown. لكل مرحلة، اذكر بوضوح:
    *   **الأهداف الرئيسية للمرحلة.**
    *   **التمارين العلاجية:** (اذكر أسماء التمارين، عدد المجموعات والتكرارات، ومدة الراحة). اشرح لماذا اخترت هذه التمارين تحديدًا لهذه الحالة.
    *   **التمارين الوظيفية:** اربطها مباشرة بمهنة المريض ({{{job}}}) وأنشطته اليومية.
    *   **نصائح وتثقيف للمريض.**

    **مثال للتنسيق المطلوب:**
    **الأسابيع 1-4: مرحلة التحكم بالألم واستعادة الحركة**
    *   **الأهداف:** تقليل الألم بنسبة 50%، تحسين نطاق حركة العمود الفقري.
    *   **التمارين:**
        *   تمرين إمالة الحوض (Pelvic Tilts): 3 مجموعات × 15 تكرار. لتقوية عضلات البطن العميقة.
        *   إطالة العضلة الكمثرية (Piriformis Stretch): 30 ثانية × 3 مرات لكل جانب. لتخفيف الضغط على العصب الوركي.
    *   **نصائح:** تطبيق الكمادات الباردة لمدة 15 دقيقة بعد التمارين.

    **الأسابيع 5-8: مرحلة بناء القوة والتحمل**
    *   **الأهداف:** ...
    *   **التمارين:** ...

    **الأسابيع 9-12: مرحلة العودة الكاملة للوظيفة**
    *   **الأهداف:** ...
    *   **التمارين الوظيفية:** محاكاة حركات الجلوس والنهوض من المكتب بطريقة صحيحة (مرتبط بوظيفة {{{job}}}).

4.  **الاحتياطات الطبية (precautions):**
    اذكر قائمة واضحة بالاحتياطات والموانع بناءً على بيانات المريض. (مثال: تجنب الانحناء الكامل للظهر، عدم حمل أوزان تزيد عن 5 كجم).

5.  **جدول المتابعة (reviewAppointments):**
    اقترح جدولاً منطقيًا لمواعيد المراجعة مع المعالج لتقييم التقدم وتعديل الخطة. (مثال: مراجعة أسبوعية في الشهر الأول، ثم كل أسبوعين).`,
});

const generateRehabPlanFlow = ai.defineFlow(
  {
    name: 'generateRehabPlanFlow',
    inputSchema: GenerateRehabPlanInputSchema,
    outputSchema: GenerateRehabPlanOutputSchema,
  },
  async (input) => {
    try {
      const validatedInput = GenerateRehabPlanInputSchema.parse(input);
      
      const result = await prompt(validatedInput);
      
      if (!result || !result.output) {
        throw new Error('No valid output received from AI model');
      }
      
      // Ensure all fields are strings, even if the model messes up.
      const processedOutput = {
        rehabPlan: String(result.output.rehabPlan || ''),
        initialDiagnosis: String(result.output.initialDiagnosis || ''),
        prognosis: String(result.output.prognosis || ''),
        precautions: String(result.output.precautions || ''),
        reviewAppointments: String(result.output.reviewAppointments || ''),
      };
      
      // Check for empty or placeholder-like responses
      if (processedOutput.rehabPlan.length < 50) {
          throw new Error("AI returned a very short or empty rehab plan.");
      }

      const validatedOutput = GenerateRehabPlanOutputSchema.parse(processedOutput);
      return validatedOutput;
      
    } catch (error: any) {
      console.error('Error in generateRehabPlanFlow:', error);
      
      // A more robust fallback response
      const fallbackResponse: GenerateRehabPlanOutput = {
        initialDiagnosis: `تعذر على الذكاء الاصطناعي إنشاء تشخيص دقيق. يتطلب التشخيص تقييمًا سريريًا مباشرًا للأعراض: ${input.symptoms}.`,
        prognosis: `تعتمد التوقعات بشكل كبير على شدة الحالة والتزام المريض. يجب وضع الأهداف بالتشاور المباشر مع المعالج.`,
        rehabPlan: `**خطة تأهيلية أولية مقترحة (تحتاج إلى تخصيص من قبل المعالج):**
        
*   **المرحلة الأولى (1-4 أسابيع):** التركيز على تخفيف الألم والالتهاب (إذا وجد) وتمارين الحركة الأساسية في نطاق غير مؤلم.
*   **المرحلة الثانية (5-8 أسابيع):** البدء بتمارين التقوية الخفيفة وتحسين التحكم العضلي.
*   **المرحلة الثالثة (9-12 أسابيع):** التدرج في تمارين التقوية والبدء في التمارين الوظيفية المتعلقة بأنشطة المريض اليومية ووظيفته (${input.job}).`,
        precautions: `**احتياطات عامة:** يجب إيقاف أي تمرين يسبب ألمًا حادًا. يجب مراعاة تأثير الأدوية (${input.medications}) والكسور السابقة (${input.fractures}) على الخطة العلاجية. استشر الطبيب دائمًا.`,
        reviewAppointments: `يوصى بمراجعة أسبوعية في البداية لتقييم الاستجابة للعلاج، ثم يمكن تباعد الجلسات بناءً على التقدم.`
      };
      
      console.warn('Using fallback response due to error:', error.message);
      return fallbackResponse;
    }
  }
);
