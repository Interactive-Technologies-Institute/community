//import { deleteStorychema } from '@/schemas/story';
import { PUBLIC_OPENAI_API_KEY, PUBLIC_CLOUDINARY_API_KEY, PUBLIC_CLOUDINARY_API_SECRET, PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
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

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: PUBLIC_CLOUDINARY_API_KEY,
  api_secret: PUBLIC_CLOUDINARY_API_SECRET
});

const openai = new OpenAI({ apiKey: PUBLIC_OPENAI_API_KEY });

export const load = async (event) => {
	const { user } = await event.locals.safeGetSession();
	let mp4Url

	const getPublicId = (url) => {
    const regex = /\/([^/]+)\.mp4$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

	function bufferToStream(buffer: ArrayBuffer) {
		return new Readable({
			read() {
				this.push(Buffer.from(buffer));
				this.push(null);
			}
		});
	} 
 
	async function toMp4(publicId, videoFile) {
		try {
			// Convert File to stream if needed
			const buffer = await videoFile.arrayBuffer();
			const stream = bufferToStream(buffer); 

			// Upload video to Cloudinary
			const uploadResult = await new Promise((resolve, reject) => {
				const uploadStream = cloudinary.uploader.upload_stream(
					{
						public_id: publicId,
						resource_type: 'video',
						format: 'mp4',
						eager: [{ format: 'mp4' }],
						eager_async: true,
						overwrite: true,
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

		//let movVideo = await getCloudinaryVideo(story.recording_link.replace('.mp4', '.mov'), "mov");
		//mp4Url = await toMp4(getPublicId(story.recording_link), movVideo);
		//if (movVideo.name.split('.').pop() === "mov") {
		//	console.log("mov?")
		//	console.log("mp4", mp4Url)
			//mp4Url = await toMp4(getPublicId(story.recording_link));
			//let mp4Video = await getCloudinaryVideo(mp4Url, "mp4")

			//transcription = await transcribe(mp4Video) 

			/* const {
				recording_link,
				moderation_status,
				insights_gpt,
				pub_story_text,
				pub_quotes,
				pub_selected_images,
				...data
			} = story;

			const { error: supabaseError } = await event.locals.supabase
					.from('story_view')
					.update({ ...data, recording_link: mp4Url })
					.eq('id', event.params.id);

			if (supabaseError) {
				console.log(supabaseError)
				setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
				return fail(500, { message: supabaseError.message });
			}

			return { ...story, recording_link: mp4Url }; */

		/* const { data: newStory, error: newStoryError } = await event.locals.supabase
			.from('story')
			.select('*')
			.eq('id', id)
			.single();

    if (newStoryError) {
      const errorMessage = `Error fetching story ${id}, please try again later.`;
      setFlash({ type: 'error', message: errorMessage }, event.cookies);
      return error(500, errorMessage);
    } */
		
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
