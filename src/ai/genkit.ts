import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

// التحقق من وجود مفتاح API
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('OPENAI_API_KEY is missing!');
  throw new Error('OPENAI_API_KEY is required. Please add it to your .env.local file');
}

console.log('Initializing Genkit with OpenAI...');

// إنشاء مثيل Genkit مع OpenAI
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: apiKey,
    }),
  ],
  // إعدادات إضافية
  logLevel: 'debug', // تغيير إلى debug لرؤية المزيد من التفاصيل
  enableTracking: true,
});

// النماذج المتاحة مع genkitx-openai
export const AVAILABLE_MODELS = {
  GPT4_TURBO: 'gpt-4-turbo',
  GPT4: 'gpt-4',
  GPT35_TURBO: 'gpt-3.5-turbo',
  GPT35_TURBO_16K: 'gpt-3.5-turbo-16k',
} as const;

// نموذج افتراضي
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL || AVAILABLE_MODELS.GPT4_TURBO;

console.log('Using model:', DEFAULT_MODEL);
