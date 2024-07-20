import type { Story } from '@/types/types';
import { error } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';

export const load = async (event) => {
	const { session, user, profile } = await event.parent();
	async function getStories(): Promise<Story[]> {
		const { data: stories, error: storiesError } = await event.locals.supabase
		  .from('story_view')
			.select('*');

		if (storiesError) {
			const errorMessage = 'Error fetching stories, please try again later.';
			setFlash({ type: 'error', message: errorMessage }, event.cookies);
			return error(500, errorMessage);
		}

		return stories;
	}

	async function getTags(): Promise<Map<string, number>> {
		const { data: tags, error: tagsError } = await event.locals.supabase
			.from('story_tags')
			.select();

		if (tagsError) {
			const errorMessage = 'Error fetching tags, please try again later.';
			setFlash({ type: 'error', message: errorMessage }, event.cookies);
			return error(500, errorMessage);
		}

		const tagMap = new Map<string, number>();
		if (tags) {
			tags.forEach((tag) => {
				const { count, tag: tagName } = tag;
				if (count !== null && tagName !== null) {
					tagMap.set(tagName, count);
				}
			});
		}

		return tagMap;
	}

	function getUserPermission() {
		return user ? user.role !== 'user' : false;
	}


	return {
		stories: await getStories(),
		permission: await getUserPermission(),
		tags: await getTags()
	};
};