import type { Guide } from '@/types/types';
import { arrayQueryParam, stringQueryParam } from '@/utils';
import { error } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';

export const load = async (event) => {
	const { user } = await event.locals.safeGetSession();
	const search = stringQueryParam().decode(event.url.searchParams.get('s')) ?? '';
	const tags = arrayQueryParam().decode(event.url.searchParams.get('tags')) ?? null;
	const sortBy = stringQueryParam().decode(event.url.searchParams.get('sortBy')) ?? 'date_updated';
	const sortOrder = stringQueryParam().decode(event.url.searchParams.get('sortOrder')) ?? 'desc';

	async function getGuides(): Promise<Guide[]> {
		let query = event.locals.supabase.from('guides_view').select('*');

		if (sortBy === 'date_updated') {
			query = query.order('updated_at', { ascending: sortOrder === 'asc' });
		} else if (sortBy === 'difficulty') {
			query = query.order('difficulty', { ascending: sortOrder === 'asc' });
		} else if (sortBy === 'duration') {
			query = query.order('duration', { ascending: sortOrder === 'asc' });
		} else if (sortBy === 'likes') {
			const { data: guides, error: guidesError } = await event.locals.supabase
				.rpc('get_guides_ordered_by_useful', {
					sort_order: sortOrder,
					tag_filters: tags,
				})
				.ilike('title', `%${search}%`);

			if (guidesError) {
				const errorMessage = 'Error fetching guides by likes, please try again later.';
				setFlash({ type: 'error', message: errorMessage }, event.cookies);
				return error(500, errorMessage);
			}

			return guides;
		}

		if (search) {
			query = query.ilike('title', `%${search}%`);
		}

		if (tags && tags.length) {
			query = query.overlaps('tags', tags);
		}

		const { data: guides, error: guidesError } = await query;

		if (guidesError) {
			const errorMessage = 'Error fetching guides, please try again later.';
			setFlash({ type: 'error', message: errorMessage }, event.cookies);
			return error(500, errorMessage);
		}
		return guides;
	}

	async function getTags(): Promise<Map<string, number>> {
		const { data: tags, error: tagsError } = await event.locals.supabase
			.from('guides_tags')
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

	async function getUsefulCount(id: number): Promise<{ count: number; userUseful: boolean }> {
		const { data: usefuls, error: usefulsError } = await event.locals.supabase
			.rpc('get_guide_useful_count', {
				guide_id: id,
				user_id: user?.id,
			})
			.single();

		if (usefulsError) {
			const errorMessage = 'Error fetching useful count, please try again later.';
			setFlash({ type: 'error', message: errorMessage }, event.cookies);
			return error(500, errorMessage);
		}
		return { count: usefuls.count, userUseful: usefuls.has_useful };
	}

	async function getBookmark(id: number): Promise<{ userBookmark: boolean }> {
		const { data: bookmark, error: bookmarkError } = await event.locals.supabase
			.rpc('get_guide_bookmark', {
				guide_id: id,
				user_id: user?.id,
			})
			.single();

		if (bookmarkError) {
			const errorMessage = 'Error fetching bookmark, please try again later.';
			setFlash({ type: 'error', message: errorMessage }, event.cookies);
			return error(500, errorMessage);
		}

		return { userBookmark: bookmark.has_bookmark };
	}

	async function getGuidesInfoMap(
		guides: Guide[]
	): Promise<
		Map<
			Guide,
			{ useful: { count: number; userUseful: boolean }; bookmark: { userBookmark: boolean } }
		>
	> {
		const guideInfoMap = new Map<
			Guide,
			{ useful: { count: number; userUseful: boolean }; bookmark: { userBookmark: boolean } }
		>();

		const guideInfos = await Promise.all(
			guides.map(async (guide) => {
				const { id } = guide;
				const [useful, bookmark] = await Promise.all([getUsefulCount(id), getBookmark(id)]);
				return { guide, useful, bookmark };
			})
		);

		guideInfos.forEach(({ guide, useful, bookmark }) =>
			guideInfoMap.set(guide, { useful, bookmark })
		);

		return guideInfoMap;
	}

	const guides = await getGuides();
	const guidesInfoMap = await getGuidesInfoMap(guides);

	return {
		guides: guidesInfoMap,
		tags: await getTags(),
	};
};
