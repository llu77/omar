
'use server';

/**
 * @fileoverview AI flow for summarizing the latest medical research.
 * This flow powers the "Scientific Research" feature, allowing users to get
 * summaries of recent medical studies from trusted sources.
 */
import OpenAI from 'openai';
import { ConsultRehabExpertInput } from '@/types'; // Reusing the same input type for simplicity
import { StreamingTextResponse, OpenAIStream } from 'ai';

// ==================== OpenAI Client Initialization ====================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================== Main Export ====================
/**
 * Summarizes medical research based on a user's query and streams the response.
 * @param input - The input containing the research topic/question.
 * @returns A streaming text response.
 */
export async function summarizeMedicalResearch(input: ConsultRehabExpertInput): Promise<Response> {
  try {
    const { question } = input;

    const systemPrompt = `You are a medical research expert with high writing skills. Your task is to provide a professional and clear summary of 1 to 3 recent and relevant medical research papers on the given topic.

Your primary rules are:
1.  **Summarize Concisely**: The total summary for all papers should be between 20 and 80 lines.
2.  **Be Professional**: Use clear, scientific, and objective language. High-quality writing is essential.
3.  **Cite Sources**: You MUST include the trusted sources for each research paper.
4.  **Provide Links**: For each source, you MUST provide a valid, clickable link to the original paper or its abstract (e.g., PubMed, Google Scholar, journal website).
5.  **Relevance**: Ensure the research is recent (ideally within the last 5 years) and highly relevant to the user's query.
6.  **Language**: All responses must be in Arabic.

Remember: All responses MUST be in Arabic, without exception.`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please summarize the latest medical research on the following topic: "${question}"` },
    ];

    const response = await openai.chat.completions.create({
        model: process.env.DEFAULT_MODEL || 'gpt-4-turbo',
        messages: messages,
        temperature: 0.4, // Lower temperature for more factual responses
        stream: true,
    });
    
    const stream = OpenAIStream(response);
    
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error('[SummarizeMedicalResearch] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(`⚠️ عذراً، حدث خطأ أثناء تلخيص الأبحاث. يرجى المحاولة مرة أخرى لاحقاً. (الخطأ: ${errorMessage})`, {
        status: 500
    });
  }
}
