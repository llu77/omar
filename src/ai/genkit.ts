'use server';

/**
 * @fileoverview This file initializes the Genkit AI platform.
 * It is used to define and configure AI models, flows, and tools.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin.
// You can add other plugins to this array as needed.
export const ai = genkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
