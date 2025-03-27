import type { Story } from '@/types/types.js';
import { error } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';

export const load = async (event) => {
	async function getStoryInfo(id: string): Promise<Story> {
		const { data: storyInfo, error: storyError } = await event.locals.supabase
			.from('story')
			.select('id, recording_link, transcription')
			.eq('id', id)
			.single();

		if (storyError) {
			const errorMessage = `Error fetching video link, please try again later.`;
			setFlash({ type: 'error', message: errorMessage }, event.cookies);
			return error(500, errorMessage);
		}

		return storyInfo as Story;
	}

	return {
		story: await getStoryInfo(event.params.id),
	};
};
