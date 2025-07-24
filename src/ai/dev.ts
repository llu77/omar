'use server';

import { ai } from './genkit';
import { generateEnhancedRehabPlan } from './flows/generate-enhanced-rehab-plan';
import { consultRehabExpert } from './flows/consult-rehab-expert';

// تسجيل التدفقات للتطوير
console.log('🚀 Genkit Development Server Started');
console.log('📋 Available Flows:');
console.log('  - generateEnhancedRehabPlan');
console.log('  - consultRehabExpert');


// مثال على البيانات للاختبار
const sampleInput = {
  job: 'مهندس برمجيات',
  symptoms: 'آلام في الرقبة والظهر، صعوبة في الجلوس لفترات طويلة',
  age: 35,
  gender: 'ذكر',
  neck: 'جزئياً',
  trunk: 'نعم',
  standing: 'نعم',
  walking: 'نعم',
  medications: 'نعم - مسكنات الألم (باراسيتامول)',
  fractures: 'لا',
};

// دالة اختبار
export async function testFlows() {
  try {
    console.log('🔄 Testing generateEnhancedRehabPlan...');
    const rehabResult = await generateEnhancedRehabPlan(sampleInput);
    console.log('✅ Rehab Plan Generated Successfully');
    console.log('✅ Result:', rehabResult);

    console.log('🔄 Testing consultRehabExpert...');
    const consultResult = await consultRehabExpert({
      question: "ما هي أفضل التمارين لآلام أسفل الظهر؟",
      history: []
    });
    console.log('✅ Consultation successful');
    console.log('✅ Result:', consultResult);

  } catch (error) {
    console.error('❌ Error in test:', error);
    throw error;
  }
}

// تصدير التدفقات
export { generateEnhancedRehabPlan, consultRehabExpert };
