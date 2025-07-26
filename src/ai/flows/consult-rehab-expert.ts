import OpenAI from "openai";
import { StreamingTextResponse } from "ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function consultRehabExpert(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      stream: true,
      messages: [
        {
          role: "system",
          content: `أنت خبير متخصص في إعادة التأهيل الطبي. قدم نصائح مهنية ومفصلة باللغة العربية.
          
          تخصصاتك تشمل:
          - العلاج الطبيعي
          - العلاج الوظيفي  
          - علاج النطق واللغة
          - إعادة التأهيل العصبي
          - إعادة التأهيل الحركي
          
          قدم إجابات:
          - علمية ودقيقة
          - مبنية على الأدلة والبراهين
          - مناسبة لمستوى فهم المريض
          - تتضمن تمارين عملية عند الحاجة
          - تحذيرات للحالات التي تحتاج مراجعة طبية`
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2000,
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
    console.error("Consult rehab expert error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ في معالجة طلبك" }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}