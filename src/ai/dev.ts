import { ai } from './genkit';
import { considerPatientInfo } from './flows/consider-patient-info';
import { generateRehabPlan } from './flows/generate-rehab-plan';

// تسجيل التدفقات للتطوير
console.log('🚀 Genkit Development Server Started');
console.log('📋 Available Flows:');
console.log('  - considerPatientInfo');
console.log('  - generateRehabPlan');

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
    console.log('🔄 Testing considerPatientInfo...');
    const consideration = await considerPatientInfo(sampleInput);
    console.log('✅ Consideration Result:', consideration);
    
    console.log('\n🔄 Testing generateRehabPlan...');
    const rehabPlan = await generateRehabPlan(sampleInput);
    console.log('✅ Rehab Plan Generated Successfully');
    
    return { consideration, rehabPlan };
  } catch (error) {
    console.error('❌ Error in test:', error);
    throw error;
  }
}

// تصدير التدفقات
export { considerPatientInfo, generateRehabPlan };