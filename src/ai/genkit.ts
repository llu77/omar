import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';
import { defineDotprompt } from 'genkit';

// التحقق من مفتاح API
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("The OPENAI_API_KEY environment variable is required. Please add it to your .env file.");
}

console.log('🚀 Genkit initializing with OpenAI...');

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
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  enableTracking: process.env.NODE_ENV !== 'production',
});


console.log('✅ Genkit initialized successfully.');
