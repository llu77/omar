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

// استخدام نماذج أسرع وأرخص
export const AVAILABLE_MODELS = {
  // نماذج سريعة للإنتاج
  FAST: 'gpt-3.5-turbo', // الأسرع والأرخص
  FAST_16K: 'gpt-3.5-turbo-16k', // للمحتوى الطويل
  
  // نماذج متقدمة (للحالات الخاصة فقط)
  ADVANCED: 'gpt-4-turbo-preview',
  ADVANCED_LEGACY: 'gpt-4',
} as const;

// استخدام النموذج السريع كافتراضي
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL || AVAILABLE_MODELS.FAST;

console.log('🚀 Genkit optimized for performance');
console.log('⚡ Using fast model:', DEFAULT_MODEL);

// دالة مساعدة لاختيار النموذج حسب الحاجة
export function selectModelForTask(taskComplexity: 'simple' | 'medium' | 'complex'): string {
  switch (taskComplexity) {
    case 'simple':
      return AVAILABLE_MODELS.FAST;
    case 'medium':
      return AVAILABLE_MODELS.FAST_16K;
    case 'complex':
      return AVAILABLE_MODELS.ADVANCED;
    default:
      return DEFAULT_MODEL;
  }
}

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
    return connectionChecked;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
}