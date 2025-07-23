import {genkit} from 'genkit';
import {openAI} from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENAI_API_KEY || "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",
    }),
  ],
});
