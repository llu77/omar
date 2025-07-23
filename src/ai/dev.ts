'use server';

import { ai } from './genkit';
import { generateEnhancedRehabPlan } from './flows/generate-enhanced-rehab-plan';

// تسجيل التدفقات للتطوير
console.log('🚀 Genkit Development Server Started');
console.log('📋 Available Flows:');
console.log('  - generateEnhancedRehabPlan');


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
export async function testFlow() {
  try {
    console.log('🔄 Testing generateEnhancedRehabPlan...');
    const result = await generateEnhancedRehabPlan(sampleInput);
    console.log('✅ Rehab Plan Generated Successfully');
    console.log('✅ Result:', result);
    return { result };
  } catch (error) {
    console.error('❌ Error in test:', error);
    throw error;
  }
}

// تصدير التدفقات
export { generateEnhancedRehabPlan };
