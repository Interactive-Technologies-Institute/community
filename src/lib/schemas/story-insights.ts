import { z } from 'zod';

export const updateStoryInsightsSchema = z.object({
	role: z.enum(['community', 'technician']).optional(),
	recording_link: z.string().min(5, { message: 'Cloudinary Link is required' }).max(500).optional(),
	insights_gpt: z.string().min(5, { message: 'Insight is required' }),
	transcription: z.string().optional(),
});

export type UpdateStoryInsightsSchema = typeof updateStoryInsightsSchema;
