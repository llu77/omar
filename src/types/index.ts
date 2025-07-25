
import { z } from "zod";
import type { Timestamp } from "firebase/firestore";

export interface PatientFormValues {
  name: string;
  age: string;
  gender: "male" | "female";
  job: string;
  symptoms: string;
  neck: "yes" | "partially" | "no";
  trunk: "yes" | "partially" | "no";
  standing: "yes" | "assisted" | "no";
  walking: "yes" | "assisted" | "no";
  medications: "yes" | "no";
  medications_details: string;
  fractures: "yes" | "no";
  fractures_details: string;
}

export interface PatientDataForAI {
  fileNumber: string;
  name: string;
  age: number;
  gender: "male" | "female";
  job: string;
  symptoms: string;
  neck: "yes" | "partially" | "no";
  trunk: "yes" | "partially" | "no";
  standing: "yes" | "assisted" | "no";
  walking: "yes" | "assisted" | "no";
  medications: string;
  fractures: string;
}

// ==================== New Feature Schemas ====================

export interface DashboardData {
  patientId: string;
  unifiedView: object; // To be defined in detail later
}

// Updated Communication Schemas for Real-Time Firestore implementation
export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp;
}

export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'bot';
  participants: string[];
  lastMessageContent?: string;
  lastMessageTimestamp?: Timestamp;
  unreadCounts?: { [userId: string]: number };
  createdAt: Timestamp;
  avatarUrl?: string;
}

export interface Goal {
  id: string;
  patient: string;
  title: string;
  category: 'medical' | 'functional';
  status: 'on_track' | 'needs_attention' | 'at_risk' | 'achieved';
  progress: number;
  team: string[];
  createdAt?: any;
  createdBy?: string;
}


// ==================== AI Flow Schemas ====================

// Schemas for consult-rehab-expert flow
export const AIMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'model']),
  content: z.string().min(1),
});

export const ConsultRehabExpertInputSchema = z.object({
  question: z.string().min(1, 'السؤال مطلوب'),
  history: z.array(AIMessageSchema).default([]),
});

export const ConsultRehabExpertOutputSchema = z.object({
  answer: z.string(),
});

export type AIMessage = z.infer<typeof AIMessageSchema>;
export type ConsultRehabExpertInput = z.infer<typeof ConsultRehabExpertInputSchema>;
export type ConsultRehabExpertOutput = z.infer<typeof ConsultRehabExpertOutputSchema>;


// Schemas for generate-enhanced-rehab-plan flow
export const GenerateEnhancedRehabPlanInputSchema = z.object({
  job: z.string().min(1, 'الوظيفة مطلوبة'),
  symptoms: z.string().min(1, 'الأعراض مطلوبة'),
  age: z.number().int().min(1).max(120),
  gender: z.enum(['male', 'female', 'ذكر', 'أنثى']),
  neck: z.enum(['yes', 'partially', 'no', 'نعم', 'جزئياً', 'لا']),
  trunk: z.enum(['yes', 'partially', 'no', 'نعم', 'جزئياً', 'لا']),
  standing: z.enum(['yes', 'assisted', 'no', 'نعم', 'بمساعدة', 'لا']),
  walking: z.enum(['yes', 'assisted', 'no', 'نعم', 'بمساعدة', 'لا']),
  medications: z.string(),
  fractures: z.string(),
});

export const GenerateEnhancedRehabPlanOutputSchema = z.object({
  initialDiagnosis: z.string().describe('The potential functional diagnosis based on the provided information.'),
  prognosis: z.string().describe('Expectations for improvement over 12 weeks with estimated percentages.'),
  rehabPlan: z.string().describe('A detailed 12-week rehabilitation plan including stages, exercises, and goals. Should be formatted as markdown.'),
  precautions: z.string().describe('Important precautions to consider during the program.'),
  medicationsInfluence: z.string().describe('The impact of the mentioned medications on the rehabilitation program.'),
  fracturesInfluence: z.string().describe('Special considerations for fractures, if any, and their impact on the plan.'),
  reviewAppointments: z.string().describe('The proposed follow-up schedule with details.'),
});

export type GenerateEnhancedRehabPlanInput = z.infer<typeof GenerateEnhancedRehabPlanInputSchema>;
export type GenerateEnhancedRehabPlanOutput = z.infer<typeof GenerateEnhancedRehabPlanOutputSchema>;
