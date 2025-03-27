import { updateStoryInsightsSchema } from '@/schemas/story-insights';
import type { StoryWithInsights } from '@/types/types';
import { handleFormAction } from '@/utils';
import { error, fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (event) => {
	const getExtension = (url : string) => {
		const match = url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
		return match ? match[1] : null;
	};

	async function getStoryInfo(id: string): Promise<String> {
		let videoFileTemp;

		const { data: storyInfo, error: storyError } = await event.locals.supabase
			.from('story')
			.select('role, recording_link, insights_gpt, transcription')
			.eq('id', id)
			.single();

		if (storyError) {
			const errorMessage = `Error fetching insights and transcription, please try again later.`;
			setFlash({ type: 'error', message: errorMessage }, event.cookies);
			return error(500, errorMessage);
		}

		if (getExtension(storyInfo.recording_link) === 'mov') {
			const { error: supabaseError } = await event.locals.supabase
				.from('story')
				.update({ recording_link: storyInfo.recording_link.replace('.mov', '.mp4') })
				.eq('id', event.params.id);

			if (supabaseError) {
				setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
				return fail(500, { message: supabaseError.message });
			}
		}

		return storyInfo;
	}

	let story: StoryWithInsights | null = null;
	const storyData = await getStoryInfo(event.params.id);
	if (storyData) story = storyData;

	return {
		updateInsightsForm: await superValidate(story, zod(updateStoryInsightsSchema), {
			id: 'update-story-insights',
		}),
	};
};

export const actions = {
	updateStory: async (event) => {
		try {
			await handleFormAction(
				event,
				updateStoryInsightsSchema,
				'update-story-insights',
				async (event, userId, form) => {
					if (form.data.transcription) {
						const { error: supabaseError } = await event.locals.supabase
							.from('story')
							.update({
								transcription: form.data.transcription,
								insights_gpt: form.data.insights_gpt,
							})
							.eq('id', event.params.id);

						if (supabaseError) {
							setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
							return fail(500, { message: supabaseError.message, form });
						}
					} else {
						const { error: supabaseError } = await event.locals.supabase
							.from('story')
							.update({ insights_gpt: form.data.insights_gpt })
							.eq('id', event.params.id);

						if (supabaseError) {
							setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
							return fail(500, { message: supabaseError.message, form });
						}
					}

					throw redirect(303, `/story/${event.params.id}`);

					return { success: true };
				}
			);
		} catch (error) {
			if (error.status === 303) {
				return redirect(303, error.location);
			}
			return fail(500, { message: 'Internal Server Error' });
		}
	},
};
