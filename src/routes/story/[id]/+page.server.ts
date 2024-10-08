//import { deleteStorychema } from '@/schemas/story';
import type { Story, ModerationInfo } from '@/types/types';
import { handleFormAction } from '@/utils';
import { error, fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { deleteStorySchema, unpublishStorySchema } from '@/schemas/story';

export const load = async (event) => {
	const { session, user, profile } = await event.parent();

	async function getStory(id: string): Promise<Story> {
		const { data: story, error: storyError } = await event.locals.supabase
			.from('story_view')
			.select('*')
			.eq('id', id)
			.single();

    if (storyError) {
      const errorMessage = `Error fetching story ${id}, please try again later.`;
      setFlash({ type: 'error', message: errorMessage }, event.cookies);
      return error(500, errorMessage);
    }
		
		return story;
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

	function getUserPermission() {
		return user ? user.role !== 'user' : false;
	}

	return {
		story: await getStory(event.params.id),
		moderation: await getStoryModeration(event.params.id),
		permission: await getUserPermission(),
		deleteForm: await superValidate(zod(deleteStorySchema), {
			id: 'delete-story',
		}),
		unpublishForm: await superValidate(zod(unpublishStorySchema), {
			id: 'unpublish-story',
		}),
	};
};

export const actions = {
	delete: async (event) =>
		handleFormAction(event, deleteStorySchema, 'delete-story', async (event, userId, form) => {
			const { error: supabaseError } = await event.locals.supabase
				.from('story')
				.delete()
				.eq('id', form.data.id);

			if (supabaseError) {
				setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
				return fail(500, { message: supabaseError.message, form });
			}

			return redirect(303, '/story');
		}),
	unpublish: async (event) =>
		handleFormAction(event, unpublishStorySchema, 'unpublish-story', async (event, userId, form) => {
			const { error: supabaseModerationError } = await event.locals.supabase
			.from('story_moderation')
			.update({ status: 'pending', comment: 'Pending moderation' })
			.eq('id', form.data.id);

			if (supabaseModerationError) {
				setFlash({ type: 'error', message: supabaseModerationError.message }, event.cookies);
				return fail(500, { message: supabaseModerationError.message, form });
			}

			return redirect(303, '/story');
		}),
}
