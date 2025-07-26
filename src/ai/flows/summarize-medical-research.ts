import OpenAI from "openai";
import { StreamingTextResponse } from "ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function summarizeMedicalResearch(input: any): Promise<Response> {
  try {
    const { question } = input;

    const systemPrompt = `You are a medical research expert. Always respond in Arabic.
    
قواعدك:
1. لخص 1-3 أبحاث طبية حديثة
2. اكتب باللغة العربية فقط
3. اذكر المصادر والروابط
4. 20-80 سطر للملخص الكامل`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `لخص أحدث الأبحاث الطبية عن: ${question}` }
      ],
      temperature: 0.4,
      stream: true,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              const bytes = encoder.encode(text);
              controller.enqueue(bytes);
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
        } finally {
          controller.close();
        }
      },
    });

    return new StreamingTextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      }
    });
  } catch (error) {
    console.error("[SummarizeMedicalResearch] Error:", error);
    return new Response("عذراً، حدث خطأ أثناء تلخيص الأبحاث", { status: 500 });
  }
}
