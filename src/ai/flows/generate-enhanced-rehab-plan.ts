'use server';

/**
 * @fileOverview نسخة محسّنة من مولد خطط التأهيل مع تحسينات الأداء
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// نفس المخططات
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
  initialDiagnosis: z.string(),
  prognosis: z.string(),
  rehabPlan: z.string(),
  precautions: z.string(),
  medicationsInfluence: z.string(),
  fracturesInfluence: z.string(),
  reviewAppointments: z.string(),
});
export type GenerateEnhancedRehabPlanOutput = z.infer<typeof GenerateEnhancedRehabPlanOutputSchema>;

// Cache للتقليل من الطلبات المتكررة
const planCache = new Map<string, GenerateEnhancedRehabPlanOutput>();

// دالة لإنشاء مفتاح cache فريد
function createCacheKey(input: GenerateEnhancedRehabPlanInput): string {
  return JSON.stringify({
    age: input.age,
    gender: input.gender,
    symptoms: input.symptoms.toLowerCase().trim(),
    neck: input.neck,
    trunk: input.trunk,
    standing: input.standing,
    walking: input.walking,
    medications: input.medications.toLowerCase().trim(),
    fractures: input.fractures.toLowerCase().trim(),
  });
}

export async function generateEnhancedRehabPlan(input: GenerateEnhancedRehabPlanInput): Promise<GenerateEnhancedRehabPlanOutput> {
  // التحقق من الحقول المطلوبة
  if (!input.job || !input.symptoms) {
    console.error('Missing required fields:', { job: input.job, symptoms: input.symptoms });
    throw new Error('الحقول المطلوبة (الوظيفة والأعراض) مفقودة');
  }

  const cacheKey = createCacheKey(input);
  
  // التحقق من الـ cache أولاً
  if (planCache.has(cacheKey)) {
    console.log('🚀 Returning cached result');
    return planCache.get(cacheKey)!;
  }

  console.log('🔄 Generating new plan...');
  const result = await generateEnhancedRehabPlanFlow(input);
  
  // حفظ في الـ cache
  planCache.set(cacheKey, result);
  
  // تنظيف الـ cache إذا تجاوز الحد المسموح
  if (planCache.size > 50) {
    const firstKey = planCache.keys().next().value;
    planCache.delete(firstKey);
  }
  
  return result;
}

// برومبت محسّن وأقصر
const optimizedPrompt = ai.definePrompt({
  name: 'optimizedRehabPlanPrompt',
  input: { schema: GenerateEnhancedRehabPlanInputSchema },
  output: { schema: GenerateEnhancedRehabPlanOutputSchema },
  model: 'openai/gpt-3.5-turbo', // استخدام نموذج أسرع
  config: {
    temperature: 0.6,
    maxOutputTokens: 2500, // تقليل عدد التوكينز
    topP: 0.8,
  },
  prompt: `أنت خبير علاج طبيعي. أنشئ خطة تأهيل مخصصة بناءً على البيانات.

البيانات:
- العمر: {{age}}, الجنس: {{gender}}, الوظيفة: {{job}}
- الأعراض: {{symptoms}}
- القدرات: رقبة={{neck}}, جذع={{trunk}}, وقوف={{standing}}, مشي={{walking}}
- أدوية: {{medications}}, كسور: {{fractures}}

المطلوب (كن مختصراً ومباشراً):

1. initialDiagnosis: التشخيص الوظيفي المحتمل (فقرة واحدة)

2. prognosis: التوقعات خلال 12 أسبوع (فقرة واحدة)

3. rehabPlan: خطة تأهيل 12 أسبوع:
## المرحلة 1 (أسابيع 1-4)
- الأهداف: [3 أهداف]
- التمارين: [5 تمارين مع التكرارات]

## المرحلة 2 (أسابيع 5-8)  
- الأهداف: [3 أهداف]
- التمارين: [5 تمارين مع التكرارات]

## المرحلة 3 (أسابيع 9-12)
- الأهداف: [3 أهداف]
- التمارين: [5 تمارين مع التكرارات]

4. precautions: احتياطات مهمة (5 نقاط)

5. medicationsInfluence: تأثير الأدوية على التمارين (فقرة واحدة)

6. fracturesInfluence: اعتبارات الكسور (فقرة واحدة)

7. reviewAppointments: جدول المتابعة المقترح (4 نقاط)`,
});

const generateEnhancedRehabPlanFlow = ai.defineFlow(
  {
    name: 'generateEnhancedRehabPlanFlow',
    inputSchema: GenerateEnhancedRehabPlanInputSchema,
    outputSchema: GenerateEnhancedRehabPlanOutputSchema,
  },
  async (input) => {
    const startTime = Date.now();
    
    try {
      // التحقق اليدوي من الحقول المطلوبة قبل التحقق من المخطط
      if (!input.job || input.job.trim() === '') {
        throw new Error('حقل الوظيفة (job) مطلوب ولا يمكن أن يكون فارغاً');
      }
      if (!input.symptoms || input.symptoms.trim() === '') {
        throw new Error('حقل الأعراض (symptoms) مطلوب ولا يمكن أن يكون فارغاً');
      }
      
      const validatedInput = GenerateEnhancedRehabPlanInputSchema.parse(input);
      
      // استخدام Promise.race للـ timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 25000)
      );
      
      const resultPromise = optimizedPrompt(validatedInput);
      
      const result = await Promise.race([resultPromise, timeoutPromise]) as any;
      
      if (!result?.output) {
        throw new Error('Invalid AI response');
      }
      
      const elapsedTime = Date.now() - startTime;
      console.log(`✅ Generated in ${elapsedTime}ms`);
      
      // معالجة سريعة للنتائج
      const output = {
        initialDiagnosis: result.output.initialDiagnosis || getFallbackDiagnosis(input),
        prognosis: result.output.prognosis || getFallbackPrognosis(input),
        rehabPlan: result.output.rehabPlan || getFallbackPlan(input),
        precautions: result.output.precautions || getFallbackPrecautions(input),
        medicationsInfluence: result.output.medicationsInfluence || getFallbackMedications(input),
        fracturesInfluence: result.output.fracturesInfluence || getFallbackFractures(input),
        reviewAppointments: result.output.reviewAppointments || getFallbackAppointments(),
      };
      
      return GenerateEnhancedRehabPlanOutputSchema.parse(output);
      
    } catch (error: any) {
      console.error('Error:', error.message);
      
      // إرجاع نتائج سريعة في حالة الخطأ
      return {
        initialDiagnosis: getFallbackDiagnosis(input),
        prognosis: getFallbackPrognosis(input),
        rehabPlan: getFallbackPlan(input),
        precautions: getFallbackPrecautions(input),
        medicationsInfluence: getFallbackMedications(input),
        fracturesInfluence: getFallbackFractures(input),
        reviewAppointments: getFallbackAppointments(),
      };
    }
  }
);

// دوال Fallback محسّنة وقصيرة
function getFallbackDiagnosis(input: GenerateEnhancedRehabPlanInput): string {
  return `بناءً على الأعراض المذكورة (${input.symptoms})، يُحتمل وجود اضطراب وظيفي يتطلب تقييماً مباشراً. العمر ${input.age} سنة والقدرات الحركية الحالية تشير إلى حاجة لبرنامج تأهيلي متدرج.`;
}

function getFallbackPrognosis(input: GenerateEnhancedRehabPlanInput): string {
  const mobility = input.walking === 'yes' ? 'جيدة' : 'محدودة';
  return `التوقعات ${mobility} مع احتمالية تحسن 60-80% خلال 12 أسبوع. العوامل المؤثرة: العمر (${input.age})، القدرة الحركية، والالتزام بالبرنامج.`;
}

function getFallbackPlan(input: GenerateEnhancedRehabPlanInput): string {
  return `## المرحلة 1 (أسابيع 1-4): تخفيف الألم
- الأهداف: تقليل الألم 50%، تحسين المرونة، تعليم وضعيات صحيحة
- التمارين: تنفس عميق (10×3)، إطالة خفيفة (30ث×3)، تقوية Core (10×3)

## المرحلة 2 (أسابيع 5-8): بناء القوة
- الأهداف: زيادة القوة 40%، تحسين التوازن، أنشطة وظيفية
- التمارين: مقاومة خفيفة (12×3)، توازن (30ث×3)، محاكاة ${input.job}

## المرحلة 3 (أسابيع 9-12): العودة للنشاط
- الأهداف: استقلالية كاملة، وقاية من الإصابة، لياقة وظيفية
- التمارين: تمارين متقدمة (15×3)، أنشطة رياضية خفيفة، برنامج منزلي`;
}

function getFallbackPrecautions(input: GenerateEnhancedRehabPlanInput): string {
  const meds = input.medications.includes('نعم') ? '\n• مراقبة تأثير الأدوية' : '';
  const fractures = input.fractures.includes('نعم') ? '\n• تجنب الضغط على مناطق الكسور' : '';
  return `• توقف عند الألم الحاد\n• تدرج في زيادة الشدة\n• حافظ على وضعيات صحيحة${meds}${fractures}`;
}

function getFallbackMedications(input: GenerateEnhancedRehabPlanInput): string {
  if (!input.medications.includes('نعم')) return 'لا توجد أدوية مؤثرة على البرنامج.';
  return 'يجب مراقبة الآثار الجانبية للأدوية وتعديل شدة التمارين حسب الحاجة. التنسيق مع الطبيب ضروري.';
}

function getFallbackFractures(input: GenerateEnhancedRehabPlanInput): string {
  if (!input.fractures.includes('نعم')) return 'لا توجد كسور سابقة تؤثر على البرنامج.';
  return 'تجنب التحميل الكامل على مناطق الكسور حتى اكتمال الشفاء. التدرج البطيء ضروري.';
}

function getFallbackAppointments(): string {
  return 'أسبوع 1-2: مرتين أسبوعياً | أسبوع 3-4: مرة أسبوعياً | أسبوع 5-8: كل أسبوعين | أسبوع 9-12: شهرياً';
}
