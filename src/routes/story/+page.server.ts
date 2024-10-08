import type { Story } from '@/types/types';
import { arrayQueryParam, stringQueryParam } from '@/utils';
import { error } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';

export const load = async (event) => {
	const { session, user, profile } = await event.parent();

	const search = stringQueryParam().decode(event.url.searchParams.get('s'));
	const tags = arrayQueryParam().decode(event.url.searchParams.get('tags'));

	async function getStories(): Promise<Story[]> {
		let query = event.locals.supabase
			.from('story_view')
			.select('*')
			.order('moderation_status', { ascending: true })
			.order('inserted_at', { ascending: false });

		if (search) {
			//query = query.textSearch('fts', search, { config: 'simple', type: 'websearch' });
			query = query.textSearch('storyteller', `${search}:*`, { config: 'simple', type: 'plain' });
			// alterar o storyteller para fts quando mudar a tabela
		}

		if (tags && tags.length) {
			query = query.overlaps('tags', tags);
		}

		const { data: stories, error: storiesError } = await query;

		if (storiesError) {
			console.log(storiesError)
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