import { createStorySchema } from '$lib/schemas/story';
import { handleFormAction, handleSignInRedirect } from '@/utils';
import type { StorageError } from '@supabase/storage-js';
import { error, fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate, withFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async ({ event, locals, url }) => {
	const { session } = await locals.safeGetSession();
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
			setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
			return fail(500, withFiles({ message: supabaseError.message, form }));
		}

		throw redirect(303, '/story');

		return { success: true };
	})
};