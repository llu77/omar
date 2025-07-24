/**
 * @fileoverview This file initializes and a default Genkit configuration.
 */

import {genkit} from '@genkit-ai/ai';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';

export {z};

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
