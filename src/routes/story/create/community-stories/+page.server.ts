import { createStorySchema } from '$lib/schemas/story';
import { PUBLIC_YOUTUBE_CLIENT_ID, PUBLIC_YOUTUBE_SECRET_KEY, PUBLIC_OPENAI_API_KEY, PUBLIC_CLOUDINARY_API_KEY, PUBLIC_CLOUDINARY_API_SECRET, PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
import { handleFormAction, handleSignInRedirect } from '@/utils';
import type { StorageError } from '@supabase/storage-js';
import { error, fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate, withFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { v4 as uuidv4 } from 'uuid';
import { google } from 'googleapis';
import { Readable } from 'stream';
import OpenAI from "openai";
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import fs from 'fs';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: PUBLIC_CLOUDINARY_API_KEY,
  api_secret: PUBLIC_CLOUDINARY_API_SECRET
});

const openai = new OpenAI({ apiKey: PUBLIC_OPENAI_API_KEY });

//const youtube = google.youtube('v3');

//const REDIRECT_URI = 'http://localhost:5173/story/create/community-stories';
//const REDIRECT_URI = 'https://comunidade-balcao.vercel.app/story/create/community-stories';
//let gTokens = {};

export const load = async ({ event, locals, url }) => {
	const { session } = await locals.safeGetSession();
	if (!session) {
		return redirect(302, handleSignInRedirect(event));
	}

	/* const oauth2Client = new google.auth.OAuth2(
			PUBLIC_YOUTUBE_CLIENT_ID,
			PUBLIC_YOUTUBE_SECRET_KEY,
			REDIRECT_URI
		);

    google.options({ auth: oauth2Client });

		const code = url.searchParams.get('code');

		if (!code) {
			const scopes = [
				'https://www.googleapis.com/auth/youtube.upload',
				'https://www.googleapis.com/auth/youtube',
			];
			
				const authorizeUrl = oauth2Client.generateAuthUrl({
					access_type: 'offline',
					scope: scopes.join(' '),
				});
				
				const code = url.searchParams.get('code');

				throw redirect(302, authorizeUrl);
		} else {
			// Code is present, handle OAuth2 callback
			try {
				const { tokens } = await oauth2Client.getToken(code);
				oauth2Client.setCredentials(tokens);
				
				const redirectUrl =  new URL(REDIRECT_URI);
				redirectUrl.searchParams.append('access_token', tokens.access_token || '');
				gTokens = tokens;
				
				if (tokens.refresh_token) {
					redirectUrl.searchParams.append('refresh_token', tokens.refresh_token);
				}
				//throw redirect(302, redirectUrl.toString());
			} catch (error) {
				console.log(error)
				return {
					status: 500,
					body: `Error: ${error.message}`,
				};
			}
		} */

    return {
        createForm: await superValidate(zod(createStorySchema), {
            id: 'create-story',
        }),
    };
};


export const actions = {
	createStory: async (event) =>
	handleFormAction(event, createStorySchema, 'create-story', async (event, userId, form) => {
		console.log("form do createstory", form.data)

		function bufferToStream(buffer: ArrayBuffer) {
			return new Readable({
				read() {
					this.push(Buffer.from(buffer));
					this.push(null);
				}
			});
		} 

		// Function to upload video and convert to audio
	/*async function toMp4(videoFile) {
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

	let movVideo = await getCloudinaryVideo(form.data.recording_link as File, "mov")
	let mp4Url = await toMp4(movVideo); */
	//let mp4Video = await getCloudinaryVideo(mp4Url, "mp4")

		// transcription
		/* async function transcribe(audioFile) {
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

		let transcription = await transcribe(mp4Video) 
		console.log(transcription) */

/* 		const {
			recording_link,
			...data
		} = form.data; */

		const { error: supabaseError } = await event.locals.supabase
		.from('story')
		.insert({ ...form.data, user_id: userId });

		if (supabaseError) {
			console.log("supabaseError", supabaseError.message)
			setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
			return fail(500, withFiles({ message: supabaseError.message, form }));
		}

		throw redirect(303, '/story');

		return { success: true };
	})
};