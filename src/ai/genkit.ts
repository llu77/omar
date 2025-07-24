/**
 * @fileoverview This file initializes and a default Genkit configuration.
 */

import {genkit} from '@genkit-ai/ai';
import {configureGenkit} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';

export {z};

configureGenkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export const ai = genkit();
