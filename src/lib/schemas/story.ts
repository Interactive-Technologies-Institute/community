import { z } from 'zod';

/* export const createStorySchema = z
	.object({
		storyteller: z.string().min(5, { message: 'Name is required' }).max(100),
		recording_link: z.string().min(5, { message: 'Youtube Link is required' }).max(500).optional(),
		recording: z.instanceof(File, { message: 'Recording is required.' }),
		audio: z.instanceof(File, { message: 'Audio is required.' }).optional(),
		tags: z.array(z.string()).min(1, { message: 'At least one tag is required' }),
		role: z.enum(['community', 'technician']),
		image_1: z.instanceof(File, { message: 'Image is required.' }).optional(),
		image_2: z.instanceof(File, { message: 'Image is required.' }).optional(),
		image_3: z.instanceof(File, { message: 'Image is required.' }).optional(),
		image_1_url: z.string().optional().optional(),
		image_2_url: z.string().optional().optional(),
		image_3_url: z.string().optional().optional(),
		images: z.array(z.instanceof(File, { message: 'Images are required.' })).min(3, { message: 'At least three images are required' })
	}); */
export const createStorySchema = z
	.object({
		storyteller: z.string().min(5, { message: 'Name is required' }).max(100),
		recording_link: z.string().min(5, { message: 'Youtube Link is required' }).max(500).optional(),
		recording: z.instanceof(File, { message: 'Recording is required.' }).optional(),
		tags: z.array(z.string()).min(1, { message: 'At least one tag is required' }),
		role: z.enum(['community', 'technician']),
		images: z.array(z.instanceof(File, { message: 'Images are required.' })).min(2, { message: 'At least two images are required' })
	});

export type CreateStorySchema = typeof createStorySchema;

export const deleteStorySchema = z.object({
	id: z.number(),
});

export type DeleteStorySchema = typeof deleteStorySchema;