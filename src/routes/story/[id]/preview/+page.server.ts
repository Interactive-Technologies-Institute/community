import { PUBLIC_OPENAI_API_KEY, PUBLIC_CLOUDINARY_API_KEY, PUBLIC_CLOUDINARY_API_SECRET, PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
import { updateStoryInsightsSchema } from '@/schemas/story-insights';
import { error, fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { handleFormAction } from '@/utils';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import axios from 'axios';

export const load = async (event) => {
	const { user } = await event.locals.safeGetSession();

	const getExtension = (url) => {
		const match = url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
		return match ? match[1] : null;
	};

	async function getStory(id: string): Promise<Story> {
		console.log("eu entro aqui")

    const { data: story, error: storyError } = await event.locals.supabase
			.from('story')
			.select('*')
			.eq('id', id)
			.single();

    if (storyError) {
			console.log(storyError)
      const errorMessage = `Error fetching story, please try again later.`;
      setFlash({ type: 'error', message: errorMessage }, event.cookies);
      return error(500, errorMessage);
    }


		if (getExtension(story.recording_link) === "mov") {
			const { error: supabaseError } = await event.locals.supabase
					.from('story')
					.update({recording_link: story.recording_link.replace('.mov', '.mp4') })
					.eq('id', event.params.id);

			if (supabaseError) {
				setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
				return fail(500, { message: supabaseError.message });
			}
		}

		return story;
  }

  return {
		stories: await getStory(event.params.id),
	};
};
export const actions = {
  updateStory: async ({ locals, request }) => {
		try {
			const formData = await request.formData();
			let action;
			let id;
			let template;

			const storyTexts = [];
			const storyQuotes = [];
			const storyImages = [];

			for (let [key, value] of formData.entries()) {
				switch (key) {
					case 'action':
							action = value;
							break;
					case 'pub_story_text':
							storyTexts.push(value);
							break;
					case 'pub_quotes':
							storyQuotes.push(value);
							break;
					case 'pub_selected_images':
							storyImages.push(value);
							break;
					case 'id':
							id = value;
							break;
					case 'template':
							template = value;
							break;
				}
			}

			if (action === 'save') {
				console.log("Saving story...");
				const { error: supabaseError } = await locals.supabase
						.from('story')
						.update({ pub_story_text: storyTexts, pub_quotes: storyQuotes, pub_selected_images: storyImages })
						.eq('id', id);

				if (supabaseError) {
					setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
					return fail(500, { message: supabaseError.message });
				}

				return { success: true };
			}
	
			if (action === 'publish') {
				console.log("Publishing story...");
				const { error: supabaseStoryError } = await locals.supabase
				.from('story')
				.update({ pub_story_text: storyTexts, pub_quotes: storyQuotes, pub_selected_images: storyImages, template: template })
				.eq('id', id);

				const { error: supabaseModerationError } = await locals.supabase
				.from('story_moderation')
				.update({ status: 'approved', comment: '' })
				.eq('id', id);

			if (supabaseStoryError) {
				console.log(supabaseStoryError.message)

				return fail(500, { message: supabaseStoryError.message });
			}

			if (supabaseModerationError) {
				console.log(supabaseModerationError.message)
				return fail(500, { message: supabaseModerationError.message });
			}

			throw redirect(303, `/story/${id}`);

			return { success: true };
			}

			return { success: false, error: 'Unknown action' };

		} catch (error) {
			if (error.status === 303) {
				return redirect(303, error.location);
			}
			return fail(500, { message: 'Internal Server Error' });
		}
  }
};