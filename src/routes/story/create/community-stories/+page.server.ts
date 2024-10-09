import { createStorySchema } from '$lib/schemas/story';
import { handleFormAction, handleSignInRedirect } from '@/utils';
import { fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate, withFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (event) => {
	const { session } = await event.locals.safeGetSession();
	if (!session) {
		return redirect(302, handleSignInRedirect(event));
	}

	return {
		createForm: await superValidate(zod(createStorySchema), {
			id: 'create-story',
		}),
	};
};

export const actions = {
	createStory: async (event) =>
		handleFormAction(event, createStorySchema, 'create-story', async (event, userId, form) => {
			const { error: supabaseError } = await event.locals.supabase
				.from('story')
				.insert({ ...form.data, user_id: userId });

			if (supabaseError) {
				console.log('supabaseError', supabaseError.message);
				setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
				return fail(500, withFiles({ message: supabaseError.message, form }));
			}

			return redirect(303, '/story');
		}),
};
