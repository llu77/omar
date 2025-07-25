
import { discussResearch } from '@/ai/flows/discuss-research';
import { ConsultRehabExpertInputSchema } from '@/types'; // Reusing for simplicity

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages } = json;

    // The last message is the user's question
    const lastMessage = messages[messages.length - 1];
    const question = lastMessage.content;

    // The rest of the messages are the history (including the initial system prompt with the summary)
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));
    
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
