import { z } from 'zod';

export const createStorySchema = z.object({
	storyteller: z.string().min(5, { message: 'Name is required' }).max(100),
	recording_link: z.string().min(5, { message: 'Cloudinary Link is required' }).max(500).optional(),
	tags: z.array(z.string()).min(1, { message: 'At least one tag is required' }),
	role: z.enum(['community', 'technician']),
	image: z.array(z.string()).min(2, { message: 'At least two images are required' }),
});

export type CreateStorySchema = typeof createStorySchema;

export const deleteStorySchema = z.object({
	id: z.number(),
});

export type DeleteStorySchema = typeof deleteStorySchema;

export const unpublishStorySchema = z.object({
	id: z.number(),
});

export type UnpublishStorySchema = typeof unpublishStorySchema;
