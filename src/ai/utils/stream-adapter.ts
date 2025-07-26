import { OpenAIStream as OriginalOpenAIStream, StreamingTextResponse } from 'ai';

// Custom type guard
function isValidStream(stream: any): stream is Parameters<typeof OriginalOpenAIStream>[0] {
  return stream && (stream.body || stream[Symbol.asyncIterator]);
}

// Adapter function with proper typing
export function OpenAIStreamAdapter(response: any): ReadableStream {
  try {
    // Handle different response types
    if (response && response.body) {
      return OriginalOpenAIStream(response);
    }
    
    // For async iterable responses
    if (response && response[Symbol.asyncIterator]) {
      // Create a compatible stream
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              const text = chunk.choices?.[0]?.delta?.content || '';
              if (text) {
                controller.enqueue(new TextEncoder().encode(text));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
      return stream;
    }
    
    // Fallback: treat as raw response
    return OriginalOpenAIStream(response as any);
  } catch (e
# أنشئ مجلد utils
mkdir -p src/ai/utils

# ثم أنشئ الملف
cat > src/ai/utils/stream-adapter.ts << 'EOF'
import { OpenAIStream as OriginalOpenAIStream, StreamingTextResponse } from 'ai';

// Custom type guard
function isValidStream(stream: any): stream is Parameters<typeof OriginalOpenAIStream>[0] {
  return stream && (stream.body || stream[Symbol.asyncIterator]);
}

// Adapter function with proper typing
export function OpenAIStreamAdapter(response: any): ReadableStream {
  try {
    // Handle different response types
    if (response && response.body) {
      return OriginalOpenAIStream(response);
    }
    
    // For async iterable responses
    if (response && response[Symbol.asyncIterator]) {
      // Create a compatible stream
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              const text = chunk.choices?.[0]?.delta?.content || '';
              if (text) {
                controller.enqueue(new TextEncoder().encode(text));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
      return stream;
    }
    
    // Fallback: treat as raw response
    return OriginalOpenAIStream(response as any);
  } catch (error) {
    console.error('Stream adapter error:', error);
    // Return empty stream on error
    return new ReadableStream({
      start(controller) {
        controller.close();
      }
    });
  }
}

export { StreamingTextResponse };
