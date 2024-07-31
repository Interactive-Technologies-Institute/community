//import { deleteStorychema } from '@/schemas/story';
import { PUBLIC_YOUTUBE_CLIENT_ID, PUBLIC_YOUTUBE_SECRET_KEY, PUBLIC_OPENAI_API_KEY, PUBLIC_CLOUDINARY_API_KEY, PUBLIC_CLOUDINARY_API_SECRET, PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
import type { Story, ModerationInfo } from '@/types/types';
import { handleFormAction } from '@/utils';
import { error, fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import { Readable } from 'stream';
import OpenAI from "openai";

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: PUBLIC_CLOUDINARY_API_KEY,
  api_secret: PUBLIC_CLOUDINARY_API_SECRET
});

const openai = new OpenAI({ apiKey: PUBLIC_OPENAI_API_KEY });

export const load = async (event) => {
	const { user } = await event.locals.safeGetSession();
	let transcription;
	let mp4Url

	function bufferToStream(buffer: ArrayBuffer) {
		return new Readable({
			read() {
				this.push(Buffer.from(buffer));
				this.push(null);
			}
		});
	} 

	async function toMp4(videoFile) {
		try {
			// Convert File to stream if needed
			const buffer = await videoFile.arrayBuffer();
			const stream = bufferToStream(buffer); 

			// Upload video to Cloudinary
			const uploadResult = await new Promise((resolve, reject) => {
				const uploadStream = cloudinary.uploader.upload_stream(
					{
						resource_type: 'video',
						format: 'mp4',
						eager: [{ format: 'mp4' }],
						eager_async: true,
					},
					(error, result) => {
						if (error) return reject(error);
						resolve(result);
					}
				);

				stream.pipe(uploadStream);
			});

			if (!uploadResult) throw new Error('Failed to upload video to Cloudinary');

			return uploadResult.secure_url; 

		} catch (error) {
			console.error('Error converting video to audio:', error);
		}
	}

	async function getCloudinaryVideo(url, format) {
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
	}

	// transcription
	async function transcribe(audioFile) {
		try {
			const transcription = await openai.audio.transcriptions.create({
				file: audioFile,
				model: "whisper-1",
				response_format: "text"
			});

			return transcription;

		} catch (error) {
			console.log("error in transcription", error)
			return null;
		}
	}

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

		if (!story.transcription) {
			let movVideo = await getCloudinaryVideo(story.recording_link, "mov")
			mp4Url = await toMp4(movVideo);
			let mp4Video = await getCloudinaryVideo(mp4Url, "mp4")

			transcription = await transcribe(mp4Video) 

			const {
				recording_link,
				...data
			} = story;

			const { error: supabaseError } = await event.locals.supabase
					.from('story')
					.update({ ...data, transcription: transcription, recording_link: mp4Url })
					.eq('id', event.params.id);

			if (supabaseError) {
				console.log(supabaseError)
				setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
				return fail(500, { message: supabaseError.message });
			}
		} else {
			console.log("eu entro aqui?")
			return story;
		}

		const { data: newStory, error: newStoryError } = await event.locals.supabase
			.from('story')
			.select('*')
			.eq('id', id)
			.single();

    if (newStoryError) {
      const errorMessage = `Error fetching story ${id}, please try again later.`;
      setFlash({ type: 'error', message: errorMessage }, event.cookies);
      return error(500, errorMessage);
    }
		
		return newStory;
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
