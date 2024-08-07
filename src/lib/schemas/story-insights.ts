import { z } from 'zod';

export const updateStoryInsightsSchema = z.object({
  insights_gpt: z.string().min(5, { message: 'Insight is required' }),
  transcription: z.string().optional(),
});

export type UpdateStoryInsightsSchema = typeof updateStoryInsightsSchema;