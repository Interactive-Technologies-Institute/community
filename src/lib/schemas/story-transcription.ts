import { z } from 'zod';

export const updateStoryTranscriptionSchema = z.object({
	recording_link: z.string().min(5, { message: 'Cloudinary Link is required' }).max(500),
	transcription: z.string().nullable(),
});

export type UpdateStoryTranscriptionSchema = typeof updateStoryTranscriptionSchema;
