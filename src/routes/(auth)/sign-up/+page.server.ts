import { goto } from '$app/navigation';
import { signUpSchema } from '@/schemas/sign-up';
import { handleFormAction } from '@/utils';
import { fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (event) => {
	const { session } = await event.locals.safeGetSession();
	if (session) {
		return redirect(303, '/');
	}

	return {
		form: await superValidate(zod(signUpSchema), { id: 'sign-up' }),
	};
};

export const actions = {
	default: async (event) =>
		handleFormAction(
			event,
			signUpSchema,
			'sign-up',
			async (event, userId, form) => {
				const { error } = await event.locals.supabase.auth.signUp({
					email: form.data.email,
					password: form.data.password,
					options: {
						data: {
							display_name: form.data.displayName,
						},
						emailRedirectTo: `${event.url.origin}/auth/callback`,
					},
				});

				if (error) {
					setFlash({ type: 'error', message: error.message }, event.cookies);
					return fail(500, { message: error.message, form });
				}

				redirect(302, '/sign-up/success');
				return { form };
			},
			{ requireAuth: false }
		),
};
