import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

// التحقق من مفتاح API
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required in .env.local');
}

// إعدادات محسنة للأداء
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: apiKey,
      // إعدادات إضافية للأداء
      timeout: 30000, // 30 ثانية timeout
      maxRetries: 2, // عدد أقل من المحاولات
    }),
  ],
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'info',
  enableTracking: process.env.NODE_ENV !== 'production',
});

// دالة للتحقق السريع من الاتصال
let connectionChecked = false;
export async function ensureConnection(): Promise<boolean> {
  if (connectionChecked) return true;
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(5000), // 5 ثواني timeout
    });
    
    connectionChecked = response.ok;
    if (connectionChecked) {
      console.log('✅ OpenAI connection verified.');
    }
    return connectionChecked;
  } catch (error) {
    console.error('❌ Connection check failed:', error);
    return false;
  }
}

console.log('🚀 Genkit initialized and optimized.');
ensureConnection();
