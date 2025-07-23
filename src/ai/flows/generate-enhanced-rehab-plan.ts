'use server';

/**
 * @fileOverview Generates a personalized and enhanced 12-week rehabilitation plan for a patient based on their assessment data.
 * This flow combines diagnosis, prognosis, planning, and medical considerations into a single, efficient AI call.
 */

import { ai, DEFAULT_MODEL } from '@/ai/genkit';
import { z } from 'zod';

// تعريف مخطط البيانات المدخلة
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

// تعريف مخطط البيانات المخرجة
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

// الدالة الرئيسية المصدرة
export async function generateEnhancedRehabPlan(input: GenerateEnhancedRehabPlanInput): Promise<GenerateEnhancedRehabPlanOutput> {
  console.log('🚀 Starting generateEnhancedRehabPlan with input:', input);
  return generateEnhancedRehabPlanFlow(input);
}

// تعريف البرومبت مع إعدادات محسنة
const prompt = ai.definePrompt({
  name: 'generateEnhancedRehabPlanPrompt',
  input: {
    schema: GenerateEnhancedRehabPlanInputSchema,
  },
  output: {
    schema: GenerateEnhancedRehabPlanOutputSchema,
  },
  // استخدام الصيغة الصحيحة للنموذج
  model: `openai/${DEFAULT_MODEL}`,
  config: {
    temperature: 0.7, // رفع درجة الحرارة قليلاً للحصول على نتائج أكثر تنوعاً
    maxOutputTokens: 3500, // تقليل عدد التوكينز لتجنب الأخطاء
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
  },
  prompt: `أنت استشاري تأهيل طبي خبير ومحترف. مهمتك هي إنشاء تقرير تأهيلي شامل ومتكامل وشخصي للغاية، مبني على أسس علمية قوية، لمريض بناءً على بياناته المدخلة. يجب أن تكون جميع أقسام التقرير واقعية، دقيقة، وقابلة للتطبيق العملي من قبل أخصائي العلاج الطبيعي. استخدم المصطلحات الطبية الدقيقة.

**بيانات المريض الأساسية:**
- **الوظيفة:** {{job}} (مهم لتخصيص التمارين الوظيفية)
- **الأعراض الرئيسية:** {{symptoms}}
- **العمر:** {{age}} سنة
- **الجنس:** {{gender}}
- **القدرة الوظيفية:**
    - التحكم بالرقبة: {{neck}}
    - التحكم بالجذع: {{trunk}}
    - القدرة على الوقوف: {{standing}}
    - القدرة على المشي: {{walking}}
- **التاريخ الطبي:**
    - الأدوية: {{medications}}
    - الكسور: {{fractures}}

**تعليمات صارمة (يجب الالتزام بها):**
- **التحليل المتكامل:** يجب أن تكون جميع المخرجات مترابطة. على سبيل المثال، يجب أن تعكس "الاحتياطات" تأثير "الأدوية" و "الكسور" المذكورة في الأقسام الخاصة بها.
- **التخصيص العميق:** اربط كل جزء من الخطة ببيانات المريض بشكل واضح. مثال: "بسبب ضعف التحكم بالجذع ({{trunk}}), سنبدأ بتمارين..." أو "لأن وظيفة المريض هي {{job}}, سنركز على..."
- **الأساس العلمي:** برر اختيار التمارين والأهداف بناءً على الأدلة السريرية والحالة الفردية للمريض.
- **الواقعية:** قدم خطة منطقية ومناسبة للحالة. تجنب التوصيات العامة والغامضة.
- **التنسيق:** استخدم تنسيق Markdown بشكل احترافي مع العناوين والنقاط الواضحة لتسهيل القراءة.

**المطلوب منك إعداد التقرير المتكامل التالي (يجب أن يكون كل قسم فقرة نصية متصلة ومفصلة باللغة العربية الطبية):**

1. **التشخيص المبدئي (initialDiagnosis):**
   بناءً على الأعراض ({{symptoms}}) والتقييم الحركي، قدم تشخيصًا وظيفيًا محتملاً. ما هي المشكلة الرئيسية من منظور العلاج الطبيعي؟

2. **التوقعات العلمية (prognosis):**
   بناءً على عمر المريض ({{age}}), حالته العامة، والتزامه المتوقع، قدم توقعات واقعية. ما هي نسبة التحسن المحتملة خلال 12 أسبوعًا؟ اذكر العوامل التي قد تسرع أو تبطئ عملية الشفاء.

3. **خطة التأهيل المفصلة لـ 12 أسبوع (rehabPlan):**
   هذا هو الجزء الأهم. قدم خطة مفصلة ومنظمة كنص متصل باستخدام Markdown. قسم الخطة إلى 3 مراحل (4 أسابيع لكل مرحلة). لكل مرحلة، اذكر بوضوح:
   - **الأهداف الرئيسية للمرحلة:** (مثال: تقليل الألم بنسبة 50%، تحسين نطاق حركة العمود الفقري القطني، تمكين المريض من الجلوس لمدة 20 دقيقة متواصلة).
   - **التمارين العلاجية:** (اذكر أسماء التمارين، عدد المجموعات والتكرارات، ومدة الراحة). اشرح لماذا اخترت هذه التمارين تحديدًا لهذه الحالة.
   - **التمارين الوظيفية:** اربطها مباشرة بمهنة المريض ({{job}}) وأنشطته اليومية.
   - **تثقيف المريض:** نصائح حول وضعيات الجسم الصحيحة، أهمية الالتزام بالتمارين المنزلية، استراتيجيات التعامل مع الألم.

4. **الاحتياطات والموانع (precautions):**
   اذكر قائمة واضحة بالاحتياطات والموانع بناءً على جميع بيانات المريض (الأعراض، الأدوية، الكسور). (مثال: تجنب الانحناء الكامل للظهر في الأسابيع الأربعة الأولى، عدم حمل أوزان تزيد عن 5 كجم، مراقبة ضغط الدم قبل وبعد الجلسة بسبب دواء X).

5. **تحليل تأثير الأدوية (medicationsInfluence):**
   بناءً على الأدوية المذكورة "{{medications}}", اشرح بالتفصيل كيف تؤثر هذه الأدوية على قدرة المريض على أداء التمارين. ركز على الآثار الجانبية المحتملة، احتياطات محددة للمعالج، توصيات عملية، وعلامات الخطر.

6. **تحليل تأثير الكسور (fracturesInfluence):**
   بناءً على تاريخ الكسور المذكور "{{fractures}}", قدم توجيهات واضحة للمعالج. ركز على مراحل الشفاء، التمارين الممنوعة، التمارين الآمنة، والتدرج في حمل الوزن.

7. **جدول المتابعة (reviewAppointments):**
   اقترح جدولًا منطقيًا لمواعيد المراجعة مع المعالج لتقييم التقدم وتعديل الخطة.`,
});

// تعريف التدفق مع معالجة محسنة للأخطاء
const generateEnhancedRehabPlanFlow = ai.defineFlow(
  {
    name: 'generateEnhancedRehabPlanFlow',
    inputSchema: GenerateEnhancedRehabPlanInputSchema,
    outputSchema: GenerateEnhancedRehabPlanOutputSchema,
  },
  async (input) => {
    try {
      // تسجيل البداية
      console.log('🔄 Starting flow execution...');
      console.log('📝 Input data:', JSON.stringify(input, null, 2));
      
      // التحقق من صحة المدخلات
      const validatedInput = GenerateEnhancedRehabPlanInputSchema.parse(input);
      console.log('✅ Input validation passed');
      
      // استدعاء نموذج AI
      console.log('🤖 Calling AI model...');
      console.log('📊 Using model:', `openai/${DEFAULT_MODEL}`);
      
      const startTime = Date.now();
      const result = await prompt(validatedInput);
      const endTime = Date.now();
      
      console.log(`⏱️ AI response received in ${endTime - startTime}ms`);
      
      // التحقق من وجود النتيجة
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response format from AI model');
      }
      
      if (!result.output || typeof result.output !== 'object') {
        console.error('❌ AI Response:', result);
        throw new Error('No valid output received from AI model');
      }
      
      // معالجة وتنظيف المخرجات
      console.log('🔍 Processing AI output...');
      const processedOutput = {
        initialDiagnosis: String(result.output.initialDiagnosis || '').trim() || 
          'لم يتمكن النظام من تحديد التشخيص المبدئي. يرجى مراجعة البيانات المدخلة.',
        
        prognosis: String(result.output.prognosis || '').trim() || 
          'التوقعات تعتمد على عوامل متعددة. يُنصح بالتقييم المباشر من قبل المعالج.',
        
        rehabPlan: String(result.output.rehabPlan || '').trim() || 
          'تعذر إنشاء خطة تأهيل مفصلة. يرجى التواصل مع المعالج لوضع خطة مخصصة.',
        
        precautions: String(result.output.precautions || '').trim() || 
          'يجب مراعاة الاحتياطات العامة وتجنب أي تمرين يسبب ألمًا حادًا.',
        
        medicationsInfluence: String(result.output.medicationsInfluence || '').trim() || 
          'يجب مراجعة تأثير الأدوية مع الطبيب المعالج قبل البدء بالبرنامج التأهيلي.',
        
        fracturesInfluence: String(result.output.fracturesInfluence || '').trim() || 
          'في حالة وجود كسور سابقة، يجب الحصول على موافقة الطبيب قبل البدء بأي تمارين.',
        
        reviewAppointments: String(result.output.reviewAppointments || '').trim() || 
          'يُنصح بمراجعة أسبوعية في الشهر الأول، ثم كل أسبوعين حسب التقدم.',
      };
      
      // التحقق من جودة المخرجات
      console.log('📏 Checking output quality...');
      if (processedOutput.rehabPlan.length < 200) {
        console.warn('⚠️ Rehab plan seems too short, length:', processedOutput.rehabPlan.length);
        throw new Error('Generated rehab plan is too short or incomplete');
      }
      
      // التحقق النهائي وإرجاع النتيجة
      console.log('✅ Output validation...');
      const validatedOutput = GenerateEnhancedRehabPlanOutputSchema.parse(processedOutput);
      
      console.log('🎉 Flow completed successfully!');
      return validatedOutput;
      
    } catch (error: any) {
      // معالجة تفصيلية للأخطاء
      console.error('❌ Error in generateEnhancedRehabPlanFlow:', error);
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode,
        response: error.response,
      });
      
      // معالجة أخطاء محددة
      if (error.message?.toLowerCase().includes('api key') || 
          error.message?.toLowerCase().includes('unauthorized') ||
          error.statusCode === 401) {
        console.error('🔑 API Key issue detected');
        throw new Error('مشكلة في مفتاح OpenAI API. تحقق من صحة المفتاح في ملف .env.local');
      }
      
      if (error.message?.toLowerCase().includes('rate limit') ||
          error.statusCode === 429) {
        console.error('⏱️ Rate limit exceeded');
        throw new Error('تجاوزت الحد المسموح من الطلبات. انتظر دقيقة وحاول مرة أخرى.');
      }
      
      if (error.message?.toLowerCase().includes('model') ||
          error.message?.toLowerCase().includes('not found')) {
        console.error('🤖 Model issue detected');
        throw new Error(`النموذج ${DEFAULT_MODEL} غير متاح. تحقق من اسم النموذج.`);
      }
      
      if (error.message?.toLowerCase().includes('timeout')) {
        console.error('⏱️ Timeout detected');
        throw new Error('انتهت مهلة الطلب. حاول مرة أخرى.');
      }
      
      // إرجاع استجابة احتياطية في حالة الأخطاء
      console.warn('🔄 Using fallback response...');
      const fallbackResponse: GenerateEnhancedRehabPlanOutput = {
        initialDiagnosis: `بناءً على الأعراض المذكورة (${input.symptoms})، يتطلب الأمر تقييمًا سريريًا مباشرًا لوضع تشخيص دقيق. العمر: ${input.age} سنة، الجنس: ${input.gender}.`,
        
        prognosis: `التوقعات العامة للحالة تعتمد على عدة عوامل:
- شدة الأعراض الحالية
- مستوى النشاط الوظيفي (التحكم بالرقبة: ${input.neck}, التحكم بالجذع: ${input.trunk})
- الالتزام بالبرنامج التأهيلي
- العوامل الصحية الأخرى

يُتوقع تحسن تدريجي خلال 12 أسبوعًا مع الالتزام بالخطة العلاجية.`,
        
        rehabPlan: `## خطة التأهيل الأولية (12 أسبوع)

### المرحلة الأولى (الأسابيع 1-4): مرحلة تخفيف الألم واستعادة الحركة الأساسية
**الأهداف:**
- تقليل الألم والالتهاب
- تحسين نطاق الحركة الأساسي
- تعليم المريض وضعيات الجسم الصحيحة

**التمارين المقترحة:**
- تمارين التنفس العميق والاسترخاء
- حركات لطيفة في نطاق غير مؤلم
- تمارين الإطالة الخفيفة
- تقوية عضلات البطن العميقة (Core stabilization)

### المرحلة الثانية (الأسابيع 5-8): مرحلة التقوية والثبات
**الأهداف:**
- تحسين القوة العضلية تدريجيًا
- تعزيز الثبات والتوازن
- البدء بالأنشطة الوظيفية البسيطة

**التمارين المقترحة:**
- تمارين المقاومة الخفيفة
- تمارين التوازن والتناسق الحركي
- أنشطة وظيفية متعلقة بطبيعة عمل المريض (${input.job})

### المرحلة الثالثة (الأسابيع 9-12): مرحلة العودة للنشاط الكامل
**الأهداف:**
- العودة التدريجية للأنشطة اليومية الكاملة
- الوقاية من تكرار الإصابة
- تحقيق الاستقلالية الوظيفية

**التمارين المقترحة:**
- تمارين وظيفية متقدمة
- محاكاة أنشطة العمل والحياة اليومية
- برنامج تمارين منزلي للمحافظة على المكتسبات`,
        
        precautions: `**احتياطات عامة يجب مراعاتها:**
- تجنب أي تمرين يسبب ألمًا حادًا أو يزيد الأعراض سوءًا
- المحافظة على وضعيات الجسم الصحيحة أثناء الأنشطة اليومية
- التدرج في زيادة شدة التمارين
- مراعاة تأثير الأدوية الحالية (${input.medications})
- الانتباه لتاريخ الكسور السابقة (${input.fractures})
- التوقف فورًا عند الشعور بدوخة أو ضيق تنفس
- استشارة الطبيب عند ظهور أعراض جديدة`,
        
        medicationsInfluence: `بخصوص الأدوية المذكورة (${input.medications}):
- يجب مراقبة العلامات الحيوية قبل وبعد الجلسات العلاجية
- قد تؤثر بعض الأدوية على قدرة المريض على التحمل
- ضرورة التنسيق مع الطبيب المعالج حول توقيت تناول الأدوية وجلسات العلاج
- الانتباه لأي آثار جانبية قد تؤثر على الأداء الحركي`,
        
        fracturesInfluence: `بخصوص تاريخ الكسور (${input.fractures}):
- في حالة وجود كسور سابقة، يجب التأكد من اكتمال الشفاء قبل البدء بالتمارين
- تجنب الضغط المباشر أو الأحمال العالية على مناطق الكسور السابقة
- التدرج البطيء في تحميل الوزن
- قد تحتاج لتعديل بعض التمارين لتناسب الحالة`,
        
        reviewAppointments: `**جدول المتابعة المقترح:**
- الأسبوع 1-2: جلستان أسبوعيًا
- الأسبوع 3-4: جلسة أسبوعية
- الأسبوع 5-8: جلسة كل أسبوعين
- الأسبوع 9-12: جلسة شهرية للمتابعة
- بعد انتهاء البرنامج: متابعة كل 3 أشهر للوقاية`
      };
      
      console.log('✅ Fallback response prepared');
      return fallbackResponse;
    }
  }
);

// دالة مساعدة للتحقق من الاتصال بـ OpenAI
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    console.log('🔌 Testing OpenAI connection...');
    const testInput: GenerateEnhancedRehabPlanInput = {
      job: 'اختبار',
      symptoms: 'اختبار الاتصال',
      age: 30,
      gender: 'ذكر',
      neck: 'نعم',
      trunk: 'نعم',
      standing: 'نعم',
      walking: 'نعم',
      medications: 'لا',
      fractures: 'لا',
    };
    
    // محاولة استدعاء بسيط
    const simplePrompt = ai.definePrompt({
      name: 'testPrompt',
      model: `openai/${DEFAULT_MODEL}`,
      config: { maxOutputTokens: 10 },
      prompt: 'قل "مرحبا"',
    });
    
    const result = await simplePrompt({});
    console.log('✅ OpenAI connection successful:', result);
    return true;
  } catch (error: any) {
    console.error('❌ OpenAI connection failed:', error.message);
    return false;
  }
}