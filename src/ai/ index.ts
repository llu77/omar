/**
 * @fileoverview Central export point for AI rehabilitation services
 * Provides clean imports for all AI-powered functionality
 */

// ==================== Core Exports ====================

export {
    // Genkit instance and utilities
    ai,
    z,
    defineFlow,
    generate,
    getDefaultModel,
    // Types
    type GenerateConfig,
  } from './genkit';
  
  // ==================== Flow Exports ====================
  
  export {
    // Consultation flow
    consultRehabExpert,
    // Types
    type Message,
    type ConsultRehabExpertInput,
    type ConsultRehabExpertOutput,
  } from './flows/consult-rehab-expert';
  
  export {
    // Rehabilitation plan generation
    generateEnhancedRehabPlan,
    checkRateLimit,
    getRequestStats,
    // Monitoring
    requestMonitor,
    // Types
    type GenerateEnhancedRehabPlanInput,
    type GenerateEnhancedRehabPlanOutput,
  } from './flows/generate-enhanced-rehab-plan';
  
  // ==================== Integration Exports ====================
  
  export {
    // Core functions
    callModel,
    callModelWithMessages,
    // Medical functions
    extractMedicalInfo,
    summarizeConversation,
    // Evaluation functions
    evaluateRehabPlan,
    validateMedicalContent,
    // Utility functions
    generateExerciseRecommendations,
    analyzeSymptoms,
    // Schemas
    MessageSchema,
    MedicalInfoSchema,
    PlanEvaluationSchema,
    ContentValidationSchema,
    // Types
    type MedicalInfo,
    type PlanEvaluation,
    type ContentValidation,
  } from './genkit-integration';
  
  // ==================== Usage Examples ====================
  
  /**
   * Example: Generate a rehabilitation plan
   * ```typescript
   * import { generateEnhancedRehabPlan } from '@/ai';
   * 
   * const plan = await generateEnhancedRehabPlan({
   *   job: "مهندس",
   *   symptoms: "آلام أسفل الظهر",
   *   age: 35,
   *   gender: "ذكر",
   *   neck: "نعم",
   *   trunk: "جزئياً",
   *   standing: "نعم",
   *   walking: "نعم",
   *   medications: "لا",
   *   fractures: "لا"
   * });
   * ```
   */
  
  /**
   * Example: Consult with rehabilitation expert
   * ```typescript
   * import { consultRehabExpert } from '@/ai';
   * 
   * const response = await consultRehabExpert({
   *   question: "ما هي أفضل تمارين لتقوية عضلات الظهر؟",
   *   history: []
   * });
   * ```
   */
  
  /**
   * Example: Extract medical information
   * ```typescript
   * import { extractMedicalInfo } from '@/ai';
   * 
   * const medicalInfo = await extractMedicalInfo(
   *   "أعاني من السكري وارتفاع ضغط الدم وأتناول الأسبرين"
   * );
   * ```
   */