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

  /* const getIdentifier = (url) => {
    const regex = /\/([^/]+)\.mp4$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }; */

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

	async function getStoryInfo(id: string): Promise<String> {
    const { data: storyInfo, error: storyError } = await event.locals.supabase
			.from('story')
			.select('id, recording_link, transcription')
			.eq('id', id)
			.single();
    
      console.log(storyInfo)

    if (storyError) {
      const errorMessage = `Error fetching video link, please try again later.`;
      setFlash({ type: 'error', message: errorMessage }, event.cookies);
      return error(500, errorMessage);
    }

		let videoFileTemp;

    if (!storyInfo.transcription) {
     /*  //let mp4Video = await getCloudinaryVideo(storyInfo.recording_link, "mp4")
			console.log(getIdentifier(storyInfo.recording_link));
			let mp4Url = await cloudinary.video(getIdentifier(storyInfo.recording_link), {fetch_format: "mp4"})
			console.log(mp4Url)

			const getBlobFromUrl = async (url) => {
				const response = await event.fetch(url);
				const arrayBuffer = await response.arrayBuffer();
				const blob = new Blob([arrayBuffer], { type: response.headers.get('content-type') });
				return blob;
			};
			
			const blob = await getBlobFromUrl('https://res.cloudinary.com/ded2amjlb/video/upload/f_mp4/rrvre74uogivm5iiokdd.mp4?_a=BAMAEuca0');

			videoFileTemp = new File([blob], `audio_file.mp4`, { type: `video/mp4` }); */
				/* let transc = await transcribe(videoFileTemp)
				console.log(transc)

			const {
				transcription,
				...data
			} = storyInfo; */

     /*  const { error: supabaseError } = await event.locals.supabase
					.from('story')
					.update({transcription: transc})
					.eq('id', event.params.id);

			if (supabaseError) {
				console.log(supabaseError)
				setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
				return fail(500, { message: supabaseError.message });
			}*/

    } 

    return storyInfo;
  }

  return {
		story: await getStoryInfo(event.params.id),
	};
};