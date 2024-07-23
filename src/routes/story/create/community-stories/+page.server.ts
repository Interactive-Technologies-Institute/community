import { createStorySchema } from '$lib/schemas/story';
import { PUBLIC_YOUTUBE_CLIENT_ID, PUBLIC_YOUTUBE_SECRET_KEY, PUBLIC_OPENAI_API_KEY } from '$env/static/public';
import { handleFormAction, handleSignInRedirect } from '@/utils';
import type { StorageError } from '@supabase/storage-js';
import { error, fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate, withFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { v4 as uuidv4 } from 'uuid';
import { google } from 'googleapis';
import { Readable } from 'stream';
//import readline from 'readline';
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: PUBLIC_OPENAI_API_KEY });

const youtube = google.youtube('v3');

let recording_link;
let transcription;

//const REDIRECT_URI = 'http://localhost:5173/story/create/community-stories';
const REDIRECT_URI = 'https://comunidade-balcao.vercel.app/story/create/community-stories';
let gTokens = {};

export const load = async ({ event, locals, url }) => {
	console.log("eu entro aqui no load")
	const { session } = await locals.safeGetSession();
	if (!session) {
		return redirect(302, handleSignInRedirect(event));
	}

	const oauth2Client = new google.auth.OAuth2(
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

		const tempImages = [
			{
				imageUrl: "",
				image: form.data.images[0] as File
			},
			{
				imageUrl: "",
				image: form.data.images[1] as File
			},
			{
				imageUrl: "",
				image: form.data.images[2] as File
			},
		]
		
		let recordingFile = form.data.recording as File;
		//let audioFile = form.data.audio as File;

		/* function bufferToStream(buffer: ArrayBuffer) {
			return new Readable({
				read() {
					this.push(Buffer.from(buffer));
					this.push(null);
				}
			});
		} */

 		async function uploadImage(image: File): Promise<{ path: string; error: StorageError | null }> {
			const fileExt = image.name.split('.').pop();
			const filePath = `${userId}_${uuidv4()}.${fileExt}`;

			const { data: imageFileData, error: imageFileError } = await event.locals.supabase.storage
				.from('story')
				.upload(filePath, image);

			if (imageFileError) {
				console.log(imageFileError)
				setFlash({ type: 'error', message: imageFileError.message }, event.cookies);
				return { path: '', error: imageFileError };
			}

			return { path: imageFileData.path, error: null };
		}

		const userImages = await Promise.all(
			tempImages.map(async (s) => {
				let imagePath = '';
				if (s.image) {
					const { path } = await uploadImage(s.image);
					// TODO: handle error
					imagePath = path;
				} else if (s.imageUrl) {
					imagePath = s.imageUrl.split('/').pop() ?? '';
				}
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { imageUrl, ...data } = s;
				return { ...data, image: imagePath };
			})
		);

		
		/* async function uploadVideoYoutube(video: File) {
			const recordingBuffer = await video.arrayBuffer();
			const recordingStream = bufferToStream(recordingBuffer);
			let today = new Date();

			const res = await youtube.videos.insert(
				{
					auth: oauth2Client,
					part: 'id,snippet,status',
					notifySubscribers: false,
					requestBody: {
						snippet: {
							title: 'Comunidade: ' + form.data.storyteller + '_' + today.toISOString(),
							description: 'História de ' + form.data.storyteller,
						},
						status: {
							privacyStatus: 'private',
						},
					},
					media: {
						body: recordingStream,
					},
				},
				{
					// Use the `onUploadProgress` event from Axios to track the
					// number of bytes uploaded to this point.
					onUploadProgress: evt => {
						const progress = (evt.bytesRead / form.data.recording.size) * 100;
						/* readline.clearLine(process.stdout, 0);
						readline.cursorTo(process.stdout, 0, null);
						process.stdout.write(`${Math.round(progress)}% complete\n`); 
					},
				}
			);
				
			return {
				success: true,
				videoId: res.data.id
			};
		}  


		/* if (recordingFile) {
			try {
				let youtubeData = await uploadVideoYoutube(recordingFile);
				form.data = { ...form.data, recording_link: "https://www.youtube.com/watch?v=" + youtubeData.videoId }
			} catch (error) {
				console.error('Error uploading video:', error);
				return fail(500, { message: 'Failed to upload video' });
			}
		} else {
			return fail(400, { message: 'No recording file provided' });
		} */ 

		const {
			recording,
			audio,
			image_1,
			image_2,
			image_3,
			image_1_url,
			image_2_url,
			image_3_url,
			images,
			...data
		} = form.data;

		const { error: supabaseError } = await event.locals.supabase
		.from('story')
		.insert({ ...data, image: userImages.map(img => img.image), recording_link: recording_link, user_id: userId, transcription: transcription });

		if (supabaseError) {
			console.log("supabaseError", supabaseError.message)
			setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
			return fail(500, withFiles({ message: supabaseError.message, form }));
		}

		throw redirect(303, '/story');

		return;
	}),
	uploadVideo: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());
		let recordingFile = formData.recording as File;

		// transcription
		async function transcribe() {
			try {
				const transcription = await openai.audio.transcriptions.create({
					file: recordingFile,
					model: "whisper-1",
					response_format: "text"
				});
				console.log(transcription)
				return transcription;

			} catch (error) {
				console.log("error in transcription", error)
				return null;
			}
		}

		transcription = await transcribe();
	/* 
		function bufferToStream(buffer: ArrayBuffer) {
			return new Readable({
				read() {
					this.push(Buffer.from(buffer));
					this.push(null);
				}
			});
		}

		const oauth2Client = new google.auth.OAuth2(
			PUBLIC_YOUTUBE_CLIENT_ID,
			PUBLIC_YOUTUBE_SECRET_KEY,
			REDIRECT_URI
		);

		try {
			oauth2Client.setCredentials(gTokens);
		} catch (error) {
			console.log("Not possible to set credentials:", error)
		}


		async function uploadVideoYoutube(video: File) {
			const recordingBuffer = await video.arrayBuffer();
			const recordingStream = bufferToStream(recordingBuffer);
			let today = new Date();

			const res = await youtube.videos.insert(
				{
					auth: oauth2Client,
					part: 'id,snippet,status',
					notifySubscribers: false,
					requestBody: {
						snippet: {
							title: 'Comunidade: ' + formData.storyteller + '_' + today.toISOString(),
							description: 'História de ' + formData.storyteller,
						},
						status: {
							privacyStatus: 'private',
						},
					},
					media: {
						body: recordingStream,
					},
				},
				{
					// Use the `onUploadProgress` event from Axios to track the
					// number of bytes uploaded to this point.
					onUploadProgress: evt => {
						const progress = (evt.bytesRead / formData.recording.size) * 100;
					},
				}
			);
				
			return {
				success: true,
				videoId: res.data.id
			};
		}  


		if (recordingFile) {
			try {
				let youtubeData = await uploadVideoYoutube(recordingFile);
				recording_link = "https://www.youtube.com/watch?v=" + youtubeData.videoId;
			} catch (error) {
				console.error('Error uploading video:', error);
				return fail(500, { message: 'Failed to upload video' });
			}
		} else {
			return fail(400, { message: 'No recording file provided' });
		} */
		console.log("eu entro aqui");

		recording_link = "https://www.youtube.com/watch?v="

		return { status: 200 };
	}
};