import OpenAI from "openai";
import { StreamingTextResponse } from "ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function discussResearch(input: any): Promise<Response> {
  try {
    const { question, history } = input;
    
    const messages: any[] = [];
    
    const systemMessage = history?.find((m: any) => m.role === "system");
    if (systemMessage) {
      messages.push({ role: "system", content: systemMessage.content });
    }
    
    const conversationHistory = history?.filter((m: any) => m.role !== "system") || [];
    conversationHistory.forEach((msg: any) => {
      const role = msg.role === "model" ? "assistant" : msg.role;
      messages.push({ role, content: msg.content });
    });
    
    messages.push({ role: "user", content: question });

    const completion = await openai.chat.completions.create({
      model: process.env.DEFAULT_MODEL || "gpt-4-turbo",
      messages: messages,
      temperature: 0.5,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
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
    console.error("[DiscussResearch] Error:", error);
    return new Response("عذراً، حدث خطأ أثناء معالجة سؤالك", { status: 500 });
  }
}
