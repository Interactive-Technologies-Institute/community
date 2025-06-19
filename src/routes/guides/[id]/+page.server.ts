import { deleteGuideSchema, toggleGuideUsefulSchema, toggleGuideBookmarkSchema } from '@/schemas/guide';
import type { GuideWithAuthor, ModerationInfo } from '@/types/types';
import { handleFormAction } from '@/utils';
import { error, fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (event) => {
	const { user } = await event.locals.safeGetSession();

	async function getGuide(id: string): Promise<GuideWithAuthor> {
		const { data: guide, error: guideError } = await event.locals.supabase
			.from('guides_view')
			.select('*, author:profiles_view!inner(*)')
			.eq('id', id)
			.single();

		if (guideError) {
			const errorMessage = 'Error fetching guide, please try again later.';
			setFlash({ type: 'error', message: errorMessage }, event.cookies);
			return error(500, errorMessage);
		}

		const image = event.locals.supabase.storage.from('guides').getPublicUrl(guide.image);
		const stepsWithImageUrl = guide.steps.map((step) => {
			const stepImage = event.locals.supabase.storage.from('guides').getPublicUrl(step.image);
			return { ...step, image: stepImage.data.publicUrl };
		});
		return { ...guide, image: image.data.publicUrl, steps: stepsWithImageUrl };
	}

	async function getGuideModeration(id: string): Promise<ModerationInfo[]> {
		const { data: moderation, error: moderationError } = await event.locals.supabase
			.from('guides_moderation')
			.select('*')
			.eq('guide_id', id)
			.order('inserted_at', { ascending: false });

		if (moderationError) {
			const errorMessage = 'Error fetching moderation, please try again later.';
			setFlash({ type: 'error', message: errorMessage }, event.cookies);
			return error(500, errorMessage);
		}

		return moderation;
	}

	async function getUsefulCount(id: string): Promise<{ count: number; userUseful: boolean }> {
		const { data: usefuls, error: usefulsError } = await event.locals.supabase
			.rpc('get_guide_useful_count', {
				guide_id: parseInt(id),
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

	async function getBookmark(id: string): Promise<{ userBookmark: boolean }> {
		const { data: bookmark, error: bookmarkError } = await event.locals.supabase
			.rpc('get_guide_bookmark', {
				guide_id: parseInt(id),
				user_id: user?.id,
			})
			.single();
    
		if (bookmarkError) {
			const errorMessage = 'Error fetching bookmark, please try again later.';
			setFlash({ type: 'error', message: errorMessage }, event.cookies);
			return error(500, errorMessage);
		}

		return { userBookmark: bookmark.has_bookmark } 
	}

	const usefulCount = await getUsefulCount(event.params.id);
	const hasBookmark = await getBookmark(event.params.id);

	return {
		guide: await getGuide(event.params.id),
		moderation: await getGuideModeration(event.params.id),
		usefulCount: usefulCount.count,
		deleteForm: await superValidate(zod(deleteGuideSchema), {
			id: 'delete-guide',
		}),
		toggleUsefulForm: await superValidate(
			{ value: user ? usefulCount.userUseful : false }, // Ensures only current user sees their state
			zod(toggleGuideUsefulSchema),
			{ id: 'toggle-guide-useful' }
		),
		toggleBookmarkForm: await superValidate(
			{ value: user ? hasBookmark.userBookmark : false }, // Ensures only current user sees their state
			zod(toggleGuideBookmarkSchema),
			{ id: 'toggle-guide-bookmark' }
		),
		toggleBookmarkForm: await superValidate(
			{ value: bookmark.userBookmark },
			zod(toggleGuideBookmarkSchema),
			{
				id: 'toggle-guide-bookmark',
			}
		),
	};
};

export const actions = {
	delete: async (event) =>
		handleFormAction(event, deleteGuideSchema, 'delete-guide', async (event, userId, form) => {
			const { error: supabaseError } = await event.locals.supabase
				.from('guides')
				.delete()
				.eq('id', form.data.id);

			if (supabaseError) {
				setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
				return fail(500, { message: supabaseError.message, form });
			}

			return redirect(303, '/guides');
		}),

	toggleUseful: async (event) =>
		handleFormAction(
			event,
			toggleGuideUsefulSchema,
			'toggle-guide-useful',
			async (event, userId, form) => {
				if (form.data.value) {
					const { error: supabaseError } = await event.locals.supabase
						.from('guides_useful')
						.insert([
							{
								guide_id: parseInt(event.params.id),
								user_id: userId,
							},
						]);

					if (supabaseError) {
						setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
						return fail(500, { message: supabaseError.message, form });
					}
				} else {
					const { error: supabaseError } = await event.locals.supabase
						.from('guides_useful')
						.delete()
						.eq('guide_id', parseInt(event.params.id))
						.eq('user_id', userId);

					if (supabaseError) {
						setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
						return fail(500, { message: supabaseError.message, form });
					}
				}

				return { form };
			}
		),
  
		toggleBookmark: async (event) =>
			handleFormAction(
				event,
				toggleGuideBookmarkSchema,
				'toggle-guide-bookmark',
				async (event, userId, form) => {
					if (form.data.value) {
						const { error: supabaseError } = await event.locals.supabase
							.from('guides_bookmark')
							.insert([
								{
									guide_id: parseInt(event.params.id),
									user_id: userId,
								},
							]);
	
						if (supabaseError) {
							setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
							return fail(500, { message: supabaseError.message, form });
						}
					} else {
						const { error: supabaseError } = await event.locals.supabase
							.from('guides_bookmark')
							.delete()
							.eq('guide_id', parseInt(event.params.id))
							.eq('user_id', userId);
	
						if (supabaseError) {
							setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
							return fail(500, { message: supabaseError.message, form });
						}
					}
	
					return { form };
				}
			),
};
