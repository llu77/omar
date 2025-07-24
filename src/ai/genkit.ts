'use server';
/**
 * @fileoverview This file initializes and configures the Genkit AI system.
 *
 * It sets up the AI instance with the necessary plugins and exports
 * the core AI functionality to be used throughout the application.
 *
 * - `ai`: The main Genkit instance.
 * - `z`: The Zod schema definition utility.
 */

import {genkit} from '@genkit-ai/ai';
import {configureGenkit} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from '@genkit-ai/openai';
import {z} from 'zod';

// Export Zod for use in other parts of the application
export {z};

// Configure Genkit with necessary plugins
configureGenkit({
  plugins: [
    // Initialize Google AI plugin if the API key is available
    process.env.GOOGLE_API_KEY ? googleAI() : undefined,

    // Initialize OpenAI plugin if the API key is available
    process.env.OPENAI_API_KEY
      ? openAI({
          apiKey: process.env.OPENAI_API_KEY,
        })
      : undefined,
  ],
  // Log all errors to the console
  logLevel: 'error',
  // Disable tracing and metrics for production performance
  enableTracingAndMetrics: false,
});

// Define and export the global AI instance
export const ai = genkit();
