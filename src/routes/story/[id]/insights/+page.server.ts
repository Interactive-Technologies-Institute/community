import { error, fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import axios from 'axios';

export const load = async (event) => {
	const { user } = await event.locals.safeGetSession();

	async function getStoryInfo(id: string): Promise<String> {
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