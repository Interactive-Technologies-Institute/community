import { z } from 'zod';

export const createEventSchema = z
	.object({
		title: z
			.string()
			.min(5, { message: 'Title is required' })
			.max(100, { message: 'Title must be less than 100 characters' }),
		description: z
			.string()
			.min(5, { message: 'Description is required' })
			.max(500, { message: 'Description must be less than 500 characters' }),
		imageUrl: z.string().nullish(),
		image: z.instanceof(File).nullish(),
		tags: z.array(z.string()),
		date: z.string().refine((date) => date, { message: 'Date is required' }),
		location: z.string().min(1, { message: 'Location is required' }),
	})
	.refine((data) => data.image || data.imageUrl, {
		message: 'Image is required',
		path: ['image'],
	});

export type CreateEventSchema = typeof createEventSchema;

export const deleteEventSchema = z.object({
	id: z.number(),
});

export type DeleteEventSchema = typeof deleteEventSchema;

export const toggleEventInterestSchema = z.object({
	value: z.boolean(),
});

export type ToggleEventInterestSchema = typeof toggleEventInterestSchema;
