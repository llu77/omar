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
    temperature: 0.7,
    maxOutputTokens: 4000,
  },
  prompt: `أنت استشاري تأهيل طبي ذو خبرة عالية. مطلوب منك إعداد خطة تأهيل شاملة ومبنية على أسس علمية لمريض يحتاج برنامج تأهيلي متخصص.

**بيانات المريض:**
- الوظيفة: {{{job}}}
- الأعراض: {{{symptoms}}}
- العمر: {{{age}}} سنة
- الجنس: {{{gender}}}
- التحكم بالرقبة: {{{neck}}}
- التحكم بالجذع: {{{trunk}}}
- القدرة على الوقوف: {{{standing}}}
- القدرة على المشي: {{{walking}}}
- الأدوية: {{{medications}}}
- الكسور: {{{fractures}}}

**تعليمات مهمة جداً:**
- يجب أن تكون جميع الإجابات نصوص كاملة باللغة العربية وليست JSON objects
- اكتب كل قسم كنص متصل وليس كـ JSON
- استخدم الفقرات والتنسيق النصي العادي

**المطلوب منك تقديم الأقسام التالية:**

1. **التشخيص الأولي (initialDiagnosis):**
اكتب فقرة واحدة متصلة تحتوي على التشخيص الطبي الأولي بناءً على البيانات المقدمة.

2. **التوقعات العلمية (prognosis):**
اكتب فقرة واحدة متصلة تحتوي على نسبة التحسن المتوقعة والجدول الزمني للتعافي.

3. **خطة التأهيل لـ 12 أسبوع (rehabPlan):**
اكتب خطة تأهيلية مفصلة كنص متصل يحتوي على:

الأسابيع 1-4 (المرحلة الأولية):
- التمارين العلاجية مع عدد المجموعات والتكرارات
- مدة كل جلسة وفترات الراحة
- الأهداف المرحلية

الأسابيع 5-8 (المرحلة المتوسطة):
- التمارين المتقدمة مع التفاصيل
- التدرج في الشدة
- التمارين الوظيفية

الأسابيع 9-12 (المرحلة المتقدمة):
- التمارين المتخصصة
- التحضير للعودة للعمل
- برنامج المحافظة

4. **الاحتياطات الطبية (precautions):**
اكتب فقرة واحدة متصلة تحتوي على جميع الاحتياطات والموانع.

5. **جدول المتابعة (reviewAppointments):**
اكتب فقرة واحدة متصلة تحتوي على مواعيد المراجعة الموصى بها.

**تذكير مهم:** اكتب كل قسم كفقرة نصية متصلة وليس كـ JSON أو قائمة منقطة.`,
});

const generateRehabPlanFlow = ai.defineFlow(
  {
    name: 'generateRehabPlanFlow',
    inputSchema: GenerateRehabPlanInputSchema,
    outputSchema: GenerateRehabPlanOutputSchema,
  },
  async (input) => {
    try {
      // تحقق من صحة المدخلات
      const validatedInput = GenerateRehabPlanInputSchema.parse(input);
      
      console.log('Calling AI model with input:', validatedInput);
      
      // استدعاء النموذج
      const result = await prompt(validatedInput);
      
      console.log('AI model result:', result);
      
      // التحقق من وجود مخرجات
      if (!result) {
        throw new Error('No result received from AI model');
      }
      
      // التحقق من وجود output
      if (!result.output) {
        console.error('No output in result:', result);
        throw new Error('No output field in AI model result');
      }
      
      // معالجة خاصة إذا كان rehabPlan كائن بدلاً من نص
      let processedOutput = result.output;
      
      // التأكد من أن processedOutput ليس null
      if (!processedOutput) {
        throw new Error('Output is null or undefined');
      }
      
      // معالجة rehabPlan إذا كان object
      if (processedOutput.rehabPlan && typeof processedOutput.rehabPlan === 'object') {
        // تحويل الكائن إلى نص منسق
        const plan = processedOutput.rehabPlan as any;
        let rehabPlanText = 'خطة التأهيل الشاملة لمدة 12 أسبوع:\n\n';
        
        if (plan['weeks1-4']) {
          rehabPlanText += `الأسابيع 1-4 (المرحلة الأولية):\n`;
          rehabPlanText += `التمارين العلاجية: ${plan['weeks1-4'].therapeuticExercises || 'تمارين أساسية للحركة والمرونة'}\n`;
          rehabPlanText += `عدد المجموعات والتكرارات: ${plan['weeks1-4'].setsAndReps || '3 مجموعات × 10 تكرارات'}\n`;
          rehabPlanText += `مدة الجلسة: ${plan['weeks1-4'].sessionDuration || '30 دقيقة'}\n`;
          rehabPlanText += `فترات الراحة: ${plan['weeks1-4'].restPeriods || 'دقيقة واحدة بين المجموعات'}\n`;
          rehabPlanText += `الأهداف: ${plan['weeks1-4'].goals || 'تحسين نطاق الحركة وتقليل الألم'}\n\n`;
        }
        
        if (plan['weeks5-8']) {
          rehabPlanText += `الأسابيع 5-8 (المرحلة المتوسطة):\n`;
          rehabPlanText += `التمارين المتقدمة: ${plan['weeks5-8'].advancedExercises || 'تمارين تقوية متدرجة'}\n`;
          rehabPlanText += `التدرج في الشدة: ${plan['weeks5-8'].gradualIntensityIncrease ? 'نعم، مع زيادة تدريجية' : 'التدرج حسب القدرة'}\n`;
          rehabPlanText += `التمارين الوظيفية: ${plan['weeks5-8'].functionalExercises || 'تمارين مرتبطة بالأنشطة اليومية'}\n`;
          rehabPlanText += `قياس التقدم: ${plan['weeks5-8'].progressMeasurement || 'تقييم أسبوعي للتحسن'}\n\n`;
        }
        
        if (plan['weeks9-12']) {
          rehabPlanText += `الأسابيع 9-12 (المرحلة المتقدمة):\n`;
          rehabPlanText += `التمارين الوظيفية المتخصصة: ${plan['weeks9-12'].specializedFunctionalExercises || 'تمارين متخصصة حسب طبيعة العمل'}\n`;
          rehabPlanText += `التحضير للعودة للعمل: ${plan['weeks9-12'].preparationForReturnToWork || 'برنامج تدريجي للعودة للأنشطة المهنية'}\n`;
          rehabPlanText += `برنامج المحافظة: ${plan['weeks9-12'].maintenanceProgram || 'تمارين منزلية للمحافظة على المكتسبات'}\n`;
          rehabPlanText += `التقييم النهائي: ${plan['weeks9-12'].finalEvaluation || 'تقييم شامل للنتائج المحققة'}`;
        }
        
        // إذا لم يكن هناك أي محتوى في الأسابيع، استخدم نص افتراضي
        if (!plan['weeks1-4'] && !plan['weeks5-8'] && !plan['weeks9-12']) {
          rehabPlanText = JSON.stringify(plan, null, 2);
        }
        
        processedOutput = {
          ...processedOutput,
          rehabPlan: rehabPlanText
        };
      }
      
      // التأكد من وجود جميع الحقول المطلوبة
      const outputWithDefaults = {
        rehabPlan: processedOutput.rehabPlan || 'خطة تأهيلية شاملة سيتم تخصيصها بناءً على التقييم الأولي',
        initialDiagnosis: processedOutput.initialDiagnosis || 'يتطلب تقييماً شاملاً لتحديد التشخيص الدقيق',
        prognosis: processedOutput.prognosis || 'التوقعات إيجابية مع الالتزام بالبرنامج التأهيلي',
        precautions: processedOutput.precautions || 'يجب مراعاة الحالة الصحية العامة وتجنب الإجهاد المفرط',
        reviewAppointments: processedOutput.reviewAppointments || 'مراجعة كل أسبوعين لتقييم التقدم'
      };
      
      // التحقق من صحة المخرجات
      const validatedOutput = GenerateRehabPlanOutputSchema.parse(outputWithDefaults);
      
      return validatedOutput;
      
    } catch (error: any) {
      console.error('Error in generateRehabPlanFlow:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // في حالة الفشل، نرجع خطة تأهيلية أساسية باللغة العربية
      const fallbackResponse: GenerateRehabPlanOutput = {
        initialDiagnosis: `التشخيص الأولي:
        
بناءً على التقييم الشامل للمريض:
• العمر: ${input.age} سنة - ${input.gender}
• الوظيفة: ${input.job}
• الأعراض الرئيسية: ${input.symptoms}
• القدرات الحركية: تحكم بالرقبة (${input.neck})، تحكم بالجذع (${input.trunk})
• القدرات الوظيفية: الوقوف (${input.standing})، المشي (${input.walking})

التشخيص: ضعف في القدرات الحركية والوظيفية يتطلب برنامج تأهيل متكامل مع التركيز على استعادة القدرات الوظيفية اللازمة لأداء متطلبات العمل.`,
        
        prognosis: `التوقعات العلمية للحالة:

• نسبة التحسن المتوقعة: 65-85% خلال 12 أسبوع
• الجدول الزمني للتعافي:
  - الأسابيع 1-4: تحسن في القدرات الأساسية (20-30%)
  - الأسابيع 5-8: تحسن في القدرات الوظيفية (40-60%)
  - الأسابيع 9-12: استعادة القدرات المتقدمة (65-85%)
• العوامل الإيجابية: العمر المناسب، الدافعية للتحسن
• العوامل التي تحتاج متابعة: الأدوية الحالية، وجود كسور سابقة`,
        
        rehabPlan: `خطة التأهيل الشاملة لمدة 12 أسبوع:

═══════════════════════════════════════
【 المرحلة الأولى: الأسابيع 1-4 】
═══════════════════════════════════════

الأهداف:
✓ تحسين نطاق الحركة
✓ تقوية العضلات الأساسية
✓ تحسين التوازن الأولي

البرنامج اليومي:

▸ تمارين التنفس العميق:
  - 10 تكرارات × 3 مجموعات
  - الاستنشاق 4 ثوان، الزفير 6 ثوان
  - راحة 30 ثانية بين المجموعات

▸ تمارين الرقبة:
  - دوران الرقبة: 5 تكرارات لكل جهة × 3 مجموعات
  - ثني وبسط الرقبة: 10 تكرارات × 3 مجموعات
  - راحة دقيقة بين المجموعات

▸ تمارين الجذع:
  - تقوية عضلات البطن: 10 تكرارات × 2 مجموعة
  - تمارين الظهر الأساسية: 10 تكرارات × 2 مجموعة
  - مدة كل تمرين: 5 ثوان

▸ المشي العلاجي:
  - 5-10 دقائق × 2-3 مرات يومياً
  - استخدام الأدوات المساعدة حسب الحاجة

═══════════════════════════════════════
【 المرحلة المتوسطة: الأسابيع 5-8 】
═══════════════════════════════════════

الأهداف:
✓ تحسين القوة العضلية
✓ تطوير التوازن الديناميكي
✓ البدء بالتمارين الوظيفية

البرنامج المتقدم:

▸ تمارين المقاومة:
  - استخدام أحزمة المقاومة الخفيفة
  - 15 تكرار × 3 مجموعات لكل مجموعة عضلية
  - زيادة المقاومة تدريجياً

▸ تمارين التوازن:
  - الوقوف على قدم واحدة: 30 ثانية × 3 مرات لكل قدم
  - المشي على خط مستقيم: 10 خطوات × 3 مجموعات
  - تمارين نقل الوزن

▸ التمارين الوظيفية:
  - محاكاة حركات العمل الأساسية
  - التدريب على الجلوس والوقوف: 15 مرة × 3 مجموعات
  - تمارين الوصول والإمساك

▸ المشي المتقدم:
  - 20-30 دقيقة يومياً
  - تضمين تغييرات في السرعة والاتجاه

═══════════════════════════════════════
【 المرحلة المتقدمة: الأسابيع 9-12 】
═══════════════════════════════════════

الأهداف:
✓ استعادة القدرات الوظيفية الكاملة
✓ التحضير للعودة للعمل
✓ وضع برنامج المحافظة

البرنامج المتخصص:

▸ التمارين الوظيفية المتقدمة:
  - محاكاة مهام العمل الكاملة
  - تمارين التحمل: 30-45 دقيقة
  - تمارين القوة المتقدمة

▸ برنامج العودة للعمل:
  - محاكاة يوم عمل كامل
  - التدريب على المهام المتخصصة
  - إدارة التعب والإجهاد

▸ برنامج المحافظة:
  - تمارين منزلية 3 مرات أسبوعياً
  - تمارين الإطالة اليومية
  - نصائح الوقاية من الإصابات`,
        
        precautions: `الاحتياطات الطبية المهمة:

⚠️ موانع الاستخدام:
• ألم حاد مفاجئ
• دوخة شديدة أو فقدان التوازن
• ضيق في التنفس غير طبيعي
• تورم أو احمرار في المفاصل

⚠️ احتياطات خاصة بالأدوية:
• مراقبة ضغط الدم قبل وبعد التمارين
• تجنب التمارين الشاقة بعد تناول الأدوية مباشرة
• التنسيق مع الطبيب المعالج لتعديل الجرعات إذا لزم

⚠️ احتياطات خاصة بالكسور:
• تجنب التحميل المباشر على منطقة الكسر
• استخدام الدعامات الواقية أثناء التمارين
• المتابعة بالأشعة حسب توجيهات الطبيب

📋 إرشادات عامة:
• الإحماء قبل كل جلسة (5-10 دقائق)
• التبريد بعد الجلسة (5 دقائق)
• شرب الماء بانتظام
• الراحة الكافية بين الجلسات`,
        
        reviewAppointments: `جدول المتابعة والمراجعة:

📅 الأسبوع الثاني:
• تقييم الاستجابة الأولية للبرنامج
• تعديل شدة التمارين حسب الحاجة
• مراجعة تقنيات أداء التمارين

📅 الأسبوع الرابع:
• تقييم شامل للتقدم المحرز
• قياس نطاق الحركة والقوة العضلية
• تحديث الأهداف للمرحلة التالية

📅 الأسبوع الثامن:
• تقييم منتصف البرنامج
• اختبارات وظيفية متقدمة
• مناقشة خطة العودة للعمل

📅 الأسبوع الثاني عشر:
• التقييم النهائي الشامل
• وضع برنامج المحافظة طويل المدى
• توصيات للمتابعة المستقبلية

📞 متى تحتاج لمراجعة طارئة:
• ظهور أعراض جديدة
• تدهور في الحالة
• عدم تحسن بعد 4 أسابيع
• أي مضاعفات غير متوقعة`
      };
      
      // إذا كان الخطأ متعلق بالنموذج، نرجع القيم الافتراضية
      if (error.message && (error.message.includes('Model') || error.message.includes('NOT_FOUND'))) {
        console.warn('Using fallback response due to model error');
        return fallbackResponse;
      }
      
      // في حالات أخرى، نعيد رمي الخطأ
      throw new Error(`Failed to generate rehabilitation plan: ${error.message}`);
    }
  }
);

// دالة مساعدة لتنسيق الخطة التأهيلية للطباعة أو العرض
export async function formatRehabPlan(plan: GenerateRehabPlanOutput): Promise<string> {
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `
╔═══════════════════════════════════════════════════════════╗
║                   تقرير التأهيل الطبي الشامل                    ║
║                      برنامج "وصّل" الطبي                        ║
╚═══════════════════════════════════════════════════════════╝

📅 تاريخ التقرير: ${currentDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ التشخيص الأولي
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${plan.initialDiagnosis}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2️⃣ التوقعات العلمية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${plan.prognosis}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3️⃣ خطة التأهيل التفصيلية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${plan.rehabPlan}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4️⃣ الاحتياطات الطبية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${plan.precautions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5️⃣ جدول المتابعة
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${plan.reviewAppointments}

╔═══════════════════════════════════════════════════════════╗
║         هذا التقرير صادر من برنامج "وصّل" للتأهيل الطبي          ║
║            جميع الحقوق محفوظة © 2025                          ║
╚═══════════════════════════════════════════════════════════╝
  `.trim();
}

// دالة لحفظ التقرير كـ PDF (يمكن استخدامها مع مكتبة PDF)
export async function prepareReportForPDF(plan: GenerateRehabPlanOutput, patientInfo: GenerateRehabPlanInput): Promise<{
  title: string;
  metadata: {
    subject: string;
    author: string;
    creator: string;
    producer: string;
    creationDate: Date;
  };
  content: {
    patientInfo: {
      age: number;
      gender: string;
      job: string;
      symptoms: string;
    };
    report: GenerateRehabPlanOutput;
    formattedReport: string;
  };
}> {
  return {
    title: 'تقرير التأهيل الطبي',
    metadata: {
      subject: 'خطة تأهيل طبية شاملة',
      author: 'برنامج وصّل للتأهيل الطبي',
      creator: 'Wassel Medical Rehabilitation System',
      producer: 'Wassel System v1.0',
      creationDate: new Date(),
    },
    content: {
      patientInfo: {
        age: patientInfo.age,
        gender: patientInfo.gender,
        job: patientInfo.job,
        symptoms: patientInfo.symptoms,
      },
      report: plan,
      formattedReport: await formatRehabPlan(plan),
    }
  };
}