import OpenAI from "openai";
import { StreamingTextResponse } from "ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

interface ResearchInput {
  question: string;
}

export async function summarizeMedicalResearch(input: ResearchInput): Promise<Response> {
  try {
    const { question } = input;

    const systemPrompt = `You are a medical research expert with high writing skills. Your task is to provide a professional and clear summary of 1 to 3 recent and relevant medical research papers on the given topic.

Your primary rules are:
1. **Summarize Concisely**: The total summary for all papers should be between 20 and 80 lines.
2. **Be Professional**: Use clear, scientific, and objective language.
3. **Cite Sources**: You MUST include the trusted sources for each research paper.
4. **Provide Links**: For each source, provide a valid link to the original paper.
5. **Relevance**: Ensure the research is recent (within the last 5 years).
6. **Language**: All responses must be in Arabic.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please summarize the latest medical research on: "${question}"` }
      ],
      temperature: 0.4,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("[SummarizeMedicalResearch] Error:", error);
    return new Response(
      "⚠️ عذراً، حدث خطأ أثناء تلخيص الأبحاث",
      { status: 500 }
    );
  }
}