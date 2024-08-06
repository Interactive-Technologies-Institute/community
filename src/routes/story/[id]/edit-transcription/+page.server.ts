import { PUBLIC_OPENAI_API_KEY, PUBLIC_CLOUDINARY_API_KEY, PUBLIC_CLOUDINARY_API_SECRET, PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
import { updateStoryTranscriptionSchema } from '@/schemas/story-transcription';
import { error, fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { handleFormAction } from '@/utils';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import axios from 'axios';
import OpenAI from "openai";
import type { StoryWithTranscription } from '@/types/types';

export const load = async (event) => {
	const { user } = await event.locals.safeGetSession();

  /* const getIdentifier = (url) => {
    const regex = /\/([^/]+)\.mp4$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }; */

	console.log("param", event.params.id)

	const getExtension = (url) => {
		const match = url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
		return match ? match[1] : null;
	};

  /* async function getCloudinaryVideo(url, format) {
		try {
			// Fetch the audio data as a buffer
			const response = await axios({
				url: url,
				method: 'GET',
				responseType: 'arraybuffer'
			});

			let videoBuffer = response.data;
			let videoFileTemp = new File([videoBuffer], `audio_file.${format}`, { type: `video/${format}` });

			return videoFileTemp;
		} catch (error) {
			console.error('Error getting video:', error);
		}
	} */

	async function getStoryInfo(id: string): Promise<String> {
    const { data: storyInfo, error: storyError } = await event.locals.supabase
			.from('story')
			.select('recording_link, transcription')
			.eq('id', id)
			.single();

    if (storyError) {
      const errorMessage = `Error fetching video link, please try again later.`;
      setFlash({ type: 'error', message: errorMessage }, event.cookies);
      return error(500, errorMessage);
    }

		let videoFileTemp;

		if (getExtension(storyInfo.recording_link) === "mov") {
			console.log("mov video")
			const { error: supabaseError } = await event.locals.supabase
					.from('story')
					.update({recording_link: storyInfo.recording_link.replace('.mov', '.mp4') })
					.eq('id', event.params.id);

			if (supabaseError) {
				console.log(supabaseError)
				setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
				return fail(500, { message: supabaseError.message });
			}
		}

		return storyInfo;
  }
	
	let story: StoryWithTranscription | null = null;
	const storyData = await getStoryInfo(event.params.id);
	if (storyData) story = storyData;

  return {
		updateTranscriptionForm: await superValidate(story, zod(updateStoryTranscriptionSchema), {
			id: 'update-story-transcription',
		}),
	};
};

export const actions = {
	updateStory: async (event) => {
		try {
			await handleFormAction(event, updateStoryTranscriptionSchema, 'update-story-transcription', async (event, userId, form) => {
				let data = form.data;
				console.log(data);

				const { error: supabaseError } = await event.locals.supabase
						.from('story')
						.update({ transcription: form.data.transcription })
						.eq('id', event.params.id);

				if (supabaseError) {
					console.log(supabaseError);
					setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
					return fail(500, { message: supabaseError.message, form });
				}

				/* console.log("eu paro aqui")
				console.log(event.params.id) */

				throw redirect(303, `/story/${event.params.id}`);
				//console.log("eu paro aqui 2")

				return { success: true };
			});
		} catch (error) {
			if (error.status === 303) {
				return redirect(303, error.location); // Properly handle the redirect response
			}
			console.error('Unhandled error:', error);
			return fail(500, { message: 'Internal Server Error' });
		}
	}
};