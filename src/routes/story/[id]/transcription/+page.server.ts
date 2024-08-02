import { PUBLIC_OPENAI_API_KEY, PUBLIC_CLOUDINARY_API_KEY, PUBLIC_CLOUDINARY_API_SECRET, PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
import { error, fail, redirect } from '@sveltejs/kit';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
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

	async function getStoryInfo(id: string): Promise<String> {
    const { data: storyInfo, error: storyError } = await event.locals.supabase
			.from('story_view')
			.select('id, recording_link, transcription')
			.eq('id', id)
			.single();
    
      console.log(storyInfo)

    if (storyError) {
      const errorMessage = `Error fetching video link, please try again later.`;
      setFlash({ type: 'error', message: errorMessage }, event.cookies);
      return error(500, errorMessage);
    }

    if (!storyInfo.transcription) {
      let mp4Video = await getCloudinaryVideo(storyInfo.recording_link, "mp4")
      let transcription = await transcribe(mp4Video) 

      const { error: supabaseError } = await event.locals.supabase
					.from('story')
					.update({transcription: transcription})
					.eq('id', event.params.id);

			if (supabaseError) {
				console.log(supabaseError)
				setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
				return fail(500, { message: supabaseError.message });
			}

      return { ...storyInfo, transcription: transcription };
    }

    return storyInfo;
  }

  return {
		story: await getStoryInfo(event.params.id),
	};
};