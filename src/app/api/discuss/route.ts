
import { discussResearch } from '@/ai/flows/discuss-research';
import { ConsultRehabExpertInputSchema, AIMessageSchema } from '@/types'; // Reusing for simplicity
import { z } from 'zod';

export const runtime = 'edge';

const DiscussRequestSchema = z.object({
  messages: z.array(AIMessageSchema),
  data: z.object({
    systemMessage: z.string(),
  }).optional(),
});


export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages, data } = DiscussRequestSchema.parse(json);

    // The last message is the user's question
    const lastMessage = messages[messages.length - 1];
    const question = lastMessage.content;

    // The system message comes from the 'data' property
    const systemMessageContent = data?.systemMessage || 'You are a helpful research assistant.';
    
    // Construct the history for the flow
    const history = [
        { role: 'system', content: systemMessageContent },
        // The rest of the messages are the history (user questions and assistant answers)
        ...messages.slice(0, -1).map((msg: any) => ({
            role: msg.role,
            content: msg.content,
        }))
    ].filter(m => m.content); // filter out any empty messages

    // Validate the input for the AI flow
    const flowInput = ConsultRehabExpertInputSchema.parse({
      question,
      history,
    });

    // Call the discussion flow and return its streaming response
    return await discussResearch(flowInput);

  } catch (error) {
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = String((error as { message: string }).message);
    }
    console.error('API Route Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
