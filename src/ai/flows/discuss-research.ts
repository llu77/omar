import OpenAI from "openai";
import { StreamingTextResponse } from "ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

interface DiscussResearchInput {
  question: string;
  history: Array<{
    role: string;
    content: string;
  }>;
}

export async function discussResearch(input: DiscussResearchInput): Promise<Response> {
  try {
    const { question, history } = input;
    
    const systemMessage = history.find(m => m.role === "system");
    const conversationHistory = history.filter(m => m.role !== "system");
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (systemMessage) {
      messages.push({ role: "system", content: systemMessage.content });
    }
    
    conversationHistory.forEach(msg => {
      const role = msg.role === "model" ? "assistant" : msg.role;
      messages.push({ 
        role: role as "user" | "assistant" | "system", 
        content: msg.content 
      });
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
    console.error("[DiscussResearch] Error:", error);
    return new Response(
      "⚠️ عذراً، حدث خطأ أثناء معالجة سؤالك",
      { status: 500 }
    );
  }
}