import { z } from 'zod';

export const previewStorySchema = z.object({
    storyteller: z.string().min(5, { message: 'Name is required' }).max(100),
    recording_link: z.string().min(5, { message: 'Cloudinary Link is required' }).max(500).optional(),
    tags: z.array(z.string()).min(1, { message: 'At least one tag is required' }),
    role: z.enum(['community', 'technician']),
    image: z.array(z.string()).min(2, { message: 'At least two images are required' }),
    user_id: z.string(),
    pub_story_text: z.array(z.string()).nullable(),
    pub_quotes: z.array(z.string()),
	transcription: z.string().nullable(),
    id: z.number(),
});

export type PreviewStorySchema = typeof previewStorySchema;
