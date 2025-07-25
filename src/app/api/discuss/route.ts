
import { discussResearch } from '@/ai/flows/discuss-research';
import { ConsultRehabExpertInputSchema, AIMessageSchema } from '@/types'; // Reusing for simplicity
import { z } from 'zod';

export const runtime = 'edge';

// The request now simply contains the messages array managed by useChat
const DiscussRequestSchema = z.object({
  messages: z.array(AIMessageSchema),
});


export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages } = DiscussRequestSchema.parse(json);

    // The last message is the user's question
    const lastMessage = messages[messages.length - 1];
    const question = lastMessage.content;

    // The entire message history, including the initial system prompt,
    // is now passed directly from the client.
    const history = messages;

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
