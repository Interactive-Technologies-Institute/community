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
/* import ffmpeg from 'fluent-ffmpeg';
import PassThrough from 'stream'; */

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: PUBLIC_CLOUDINARY_API_KEY,
  api_secret: PUBLIC_CLOUDINARY_API_SECRET
});

const openai = new OpenAI({ apiKey: PUBLIC_OPENAI_API_KEY });

const youtube = google.youtube('v3');

let recordingFile;

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
		//console.log("form do createstory", form)

		const tempImages = [
			{
				imageUrl: "",
				image: form.data.images[0] as File
			},
			{
				imageUrl: "",
				image: form.data.images[1] as File
			},
		]
		
		console.log(recordingFile);

		function bufferToStream(buffer: ArrayBuffer) {
			return new Readable({
				read() {
					this.push(Buffer.from(buffer));
					this.push(null);
				}
			});
		} 

		// Function to upload video and convert to audio
	async function videoToAudio(videoFile, format) {
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
						eager: [{ format: format }],
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

	async function getVideo(url) {
		try {
			// Fetch the audio data as a buffer
			const response = await axios({
				url: url,
				method: 'GET',
				responseType: 'arraybuffer'
			});

			let audioBuffer = response.data;
			let audioFileTemp = new File([audioBuffer], 'audio_file.mp4', { type: 'audio/mp4' });

			return audioFileTemp;
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

		let video_url = await videoToAudio(recordingFile, "mp4");
		let audio_file = await getVideo(video_url)
		let recording_link = "https://www.youtube.com/watch?v=";

		const {
			recording,
			images,
			...data
		} = form.data;

		console.log("audio para publicar", audio_file)

		const { error: supabaseError } = await event.locals.supabase
		.from('story')
		.insert({ ...data, image: userImages.map(img => img.image), recording_link: recording_link, user_id: userId, transcription: await transcribe(audio_file) });

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
		recordingFile = formData.recording as File;
		console.log("isso nao funcionando?")
		console.log("recebo algo", formData)

		/* const oauth2Client = new google.auth.OAuth2(
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

/* 
async function transcribeChunk(blobChunk) {
	try {
			const transcription = await openai.audio.transcriptions.create({
					file: blobChunk,
					model: "whisper-1",
					response_format: "text"
			});

			return transcription;
	} catch (error) {
			console.error("Error in transcription:", error);
			return null;
	}
}

async function transcribeFile(file, chunkSizeMB) {
	const chunkSize = chunkSizeMB * 1024 * 1024;
	const totalChunks = Math.ceil(file.size / chunkSize);
	let fullTranscription = '';

	for (let i = 0; i < totalChunks; i++) {
			const start = i * chunkSize;
			const end = Math.min(start + chunkSize, file.size);
			const chunk = file.slice(start, end);

			const transcription = await transcribeChunk(chunk);
			if (transcription) {
					fullTranscription += transcription;
			} else {
					console.error(`Failed to transcribe chunk ${i}`);
			}
	}

	return fullTranscription;
} */

// Usage example
/* const file = new File([/* your file data ], "large-audio-file.mp3");
const chunkSizeMB = 25; */

	// Example usage: assume videoFile is a File object obtained from an upload or other source
	/* console.log("recordingFile", recordingFile)
	let video_file = await videoToAudio(recordingFile, "mp4");
	audio_file = await videoToAudio(video_file, "mp3"); */

		// Assuming 'fileBuffer' is the buffer containing the file's data
	/* const audioBuffer = await audio_file.arrayBuffer();
	const fileBuffer = Buffer.from(audioBuffer);
	const filename = 'teste.wav'; // The desired filename on the server

	fs.writeFile(filename, fileBuffer, (err) => {
		if (err) {
			console.error('Error saving the file:', err);
		} else {
			console.log('File saved successfully.');
		}
	});
 */
	
	//console.log(audio_file)
	//audio_file = await videoToAudio(recordingFile, "webm");

	/* if(audioFile) {
		 transcribeFile(audioFile, chunkSizeMB)
		.then(fullTranscription => {
				console.log('Full Transcription:', fullTranscription);
				transcription = fullTranscription;
		})
		.catch(error => {
				console.error('Error during transcription process:', error);
		}); 
		//transcription = await transcribe(audioFile);
		//console.log(transcription)
	} */


	// Assume `videoFile` is a Buffer or File instance containing your .mov data
//const videoFile = ...; // your .mov file data
/* const buffer = await recordingFile.arrayBuffer();
const videoBuffer = Buffer.from(buffer);
const outputFormat = 'mp3'; // change to desired format, e.g., 'wav', 'ogg', etc. */

// Create a readable stream from the video buffer using bufferToStream
/* const videoStream = bufferToStream(videoBuffer); */


// Prepare to collect the output audio data
/* const audioStream = new PassThrough();
let audioData = [];

audioStream.on('data', chunk => {
	audioData.push(chunk);
});

audioStream.on('end', () => {
	// Combine the chunks into a single Buffer
	audioData = Buffer.concat(audioData);
	console.log('Conversion finished. Audio data length:', audioData.length);

	// Create a File object from the buffer
	audio_file = new File([audioData], 'audio_file.mp3', { type: 'audio/mp3' });
	console.log('Audio File:', audio_file);

	// Return or process the audio file as needed
});

// Perform the conversion
ffmpeg(videoStream)
	.toFormat(outputFormat)
	.on('error', (err) => {
		console.error('An error occurred:', err.message);
	})
	.pipe(audioStream, { end: true }); */

	//recording_link = "https://www.youtube.com/watch?v=";

	return { success: true };
	},
};