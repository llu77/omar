import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

// التحقق من وجود مفتاح API
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY is missing!');
  console.error('📝 Please add OPENAI_API_KEY to your .env.local file');
  console.error('Example: OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  throw new Error('OPENAI_API_KEY is required. Please add it to your .env.local file');
}

// التحقق من صحة مفتاح API (التحقق الأساسي)
if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
  console.error('❌ Invalid OPENAI_API_KEY format!');
  console.error('🔑 API key should start with "sk-" and be at least 40 characters long');
  throw new Error('Invalid OPENAI_API_KEY format');
}

console.log('🚀 Initializing Genkit with OpenAI...');
console.log('🔑 API Key detected:', apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4));

// إنشاء مثيل Genkit مع OpenAI
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: apiKey,
    }),
  ],
  // إعدادات إضافية
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enableTracking: true,
});

// النماذج المتاحة مع genkitx-openai
// ملاحظة: تأكد من استخدام أسماء النماذج الصحيحة
export const AVAILABLE_MODELS = {
  // GPT-4 Models
  GPT4_TURBO: 'gpt-4-turbo-preview',     // أحدث نموذج GPT-4 Turbo
  GPT4_TURBO_2024: 'gpt-4-0125-preview',  // نسخة محددة من GPT-4 Turbo
  GPT4: 'gpt-4',                          // GPT-4 الأساسي
  GPT4_32K: 'gpt-4-32k',                  // GPT-4 مع نافذة سياق أكبر
  
  // GPT-3.5 Models (أرخص وأسرع)
  GPT35_TURBO: 'gpt-3.5-turbo',           // الأكثر استخداماً
  GPT35_TURBO_16K: 'gpt-3.5-turbo-16k',   // نافذة سياق أكبر
  GPT35_TURBO_0125: 'gpt-3.5-turbo-0125', // أحدث نسخة من 3.5
  
  // Legacy Models
  GPT35_TURBO_INSTRUCT: 'gpt-3.5-turbo-instruct', // للتعليمات المباشرة
} as const;

// نموذج افتراضي - نستخدم أحدث وأسرع نموذج من GPT-3.5 للتوفير والسرعة
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL || AVAILABLE_MODELS.GPT35_TURBO_0125;

// التحقق من صحة النموذج المختار
const validModels = Object.values(AVAILABLE_MODELS);
if (!validModels.includes(DEFAULT_MODEL as any)) {
  console.warn(`⚠️ Unknown model: ${DEFAULT_MODEL}, falling back to ${AVAILABLE_MODELS.GPT35_TURBO_0125}`);
}

console.log('✅ Genkit initialized successfully');
console.log('🤖 Using model:', DEFAULT_MODEL);
console.log('📊 Available models:', Object.keys(AVAILABLE_MODELS).join(', '));

// دالة مساعدة للتحقق من تكلفة النموذج
export function getModelCost(model: string): { input: number; output: number } {
  const costs = {
    'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
    'gpt-4-0125-preview': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-32k': { input: 0.06, output: 0.12 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
    'gpt-3.5-turbo-0125': { input: 0.0005, output: 0.0015 },
    'gpt-3.5-turbo-instruct': { input: 0.0015, output: 0.002 },
  };
  
  return costs[model] || { input: 0, output: 0 };
}

// دالة للتحقق من الاتصال الأساسي
export async function checkOpenAIStatus(): Promise<{ connected: boolean; message: string }> {
  try {
    // محاولة بسيطة للتحقق من الاتصال
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    if (response.ok) {
      return { connected: true, message: 'Connected to OpenAI successfully' };
    } else {
      const error = await response.text();
      return { connected: false, message: `OpenAI API error: ${response.status} - ${error}` };
    }
  } catch (error: any) {
    return { connected: false, message: `Connection error: ${error.message}` };
  }
}
