//import { deleteStorychema } from '@/schemas/story';
import type { Story, ModerationInfo } from '@/types/types';
import { handleFormAction } from '@/utils';
import { error, fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (event) => {
	const { user } = await event.locals.safeGetSession();
	async function getStory(id: string): Promise<Story> {
		const { data: story, error: storyError } = await event.locals.supabase
			.from('story')
			.select('*')
			.eq('id', id)
			.single();

    if (storyError) {
      const errorMessage = `Error fetching story ${id}, please try again later.`;
      setFlash({ type: 'error', message: errorMessage }, event.cookies);
      return error(500, errorMessage);
    }

		//const image = event.locals.supabase.storage.from('story').getPublicUrl(story.image);
		const imagesUrl = story.image.map((i) => {
			const storytellerImage = event.locals.supabase.storage.from('story').getPublicUrl(i.image);
			return { ...i, image: storytellerImage.data.publicUrl };
		});
		return { ...story, images: imagesUrl };
	}

	async function getStoryModeration(id: string): Promise<ModerationInfo> {
		const { data: moderation, error: moderationError } = await event.locals.supabase
			.from('story_moderation')
			.select('*')
			.eq('story_id', id)
			.single();

		if (moderationError) {
			const errorMessage = 'Error fetching moderation, please try again later.';
			setFlash({ type: 'error', message: errorMessage }, event.cookies);
			return error(500, errorMessage);
		}

		return moderation;
	}

	return {
		story: await getStory(event.params.id),
		moderation: await getStoryModeration(event.params.id),
		// usefulCount: usefulCount.count,
		/* deleteForm: await superValidate(zod(deleteStorySchema), {
			id: 'delete-story',
		}) */
		/* toggleUsefulForm: await superValidate(
			{ value: usefulCount.userUseful },
			zod(toggleHowToUsefulSchema),
			{
				id: 'toggle-howto-useful',
			}
		), */
	};
};
/* 
export const actions = {
	delete: async (event) =>
		handleFormAction(event, deleteHowToSchema, 'delete-howto', async (event, userId, form) => {
			const { error: supabaseError } = await event.locals.supabase
				.from('howtos')
				.delete()
				.eq('id', form.data.id);

			if (supabaseError) {
				setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
				return fail(500, { message: supabaseError.message, form });
			}

			return redirect(303, '/how-to');
		}),

	toggleUseful: async (event) =>
		handleFormAction(
			event,
			toggleHowToUsefulSchema,
			'toggle-howto-useful',
			async (event, userId, form) => {
				if (form.data.value) {
					const { error: supabaseError } = await event.locals.supabase
						.from('howtos_useful')
						.insert([
							{
								howto_id: parseInt(event.params.id),
								user_id: userId,
							},
						]);

					if (supabaseError) {
						console.error(supabaseError);
						setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
						return fail(500, { message: supabaseError.message, form });
					}
				} else {
					const { error: supabaseError } = await event.locals.supabase
						.from('howtos_useful')
						.delete()
						.eq('howto_id', parseInt(event.params.id))
						.eq('user_id', userId);

					if (supabaseError) {
						setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
						return fail(500, { message: supabaseError.message, form });
					}
				}

				console.log('done');
				return { form };
			}
		),
}; */
