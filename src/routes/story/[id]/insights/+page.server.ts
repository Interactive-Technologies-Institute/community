import { error } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';

export const load = async (event) => {
	async function getStoryInfo(id: string): Promise<{id: number, insights_gpt: string| null}> {
		const { data: storyInfo, error: storyError } = await event.locals.supabase
			.from('story')
			.select('id, insights_gpt')
			.eq('id', id)
			.single();

		if (storyError) {
			const errorMessage = `Error fetching video link, please try again later.`;
			setFlash({ type: 'error', message: errorMessage }, event.cookies);
			return error(500, errorMessage);
		}

		return storyInfo;
	}

	return {
		story: await getStoryInfo(event.params.id),
	};
};
