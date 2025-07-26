import { consultRehabExpert } from "@/ai/flows/consult-rehab-expert";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // مرر الـ request مباشرة للدالة
    return await consultRehabExpert(req);
  } catch (error) {
    console.error("API Route Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}