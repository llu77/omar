/**
 * @fileoverview This file initializes and a default Genkit configuration.
 */

import {defineFlow, generate} from '@genkit-ai/ai';
import {configureGenkit} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';

export {z, defineFlow, generate};

configureGenkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
