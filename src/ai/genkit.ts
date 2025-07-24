
'use server';
/**
 * @fileoverview This file initializes and a default Genkit configuration.
 */
import {genkit, defineFlow, generate} from '@genkit-ai/ai';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';

export const ai = genkit({
  plugins: [googleAI({apiVersion: "v1beta"})],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export {z, defineFlow, generate};
