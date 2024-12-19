import { deleteGuideSchema, toggleGuideUsefulSchema } from '@/schemas/guide';
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

	const usefulCount = await getUsefulCount(event.params.id);

	return {
		guide: await getGuide(event.params.id),
		moderation: await getGuideModeration(event.params.id),
		usefulCount: usefulCount.count,
		deleteForm: await superValidate(zod(deleteGuideSchema), {
			id: 'delete-guide',
		}),
		toggleUsefulForm: await superValidate(
			{ value: usefulCount.userUseful },
			zod(toggleGuideUsefulSchema),
			{
				id: 'toggle-guide-useful',
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
};
