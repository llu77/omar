
import { summarizeMedicalResearch } from '@/ai/flows/summarize-medical-research';
import { ConsultRehabExpertInputSchema } from '@/types';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages } = json;

    // The last message is the user's question
    const lastMessage = messages[messages.length - 1];
    const question = lastMessage.content;

    // Validate the input for the AI flow
    const flowInput = ConsultRehabExpertInputSchema.parse({
      question,
      history: [], // History is not needed for this flow
    });

    // Call the research summarization flow and return its streaming response
    return await summarizeMedicalResearch(flowInput);

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
