import { updateBrandingSchema, type UpdateBrandingSchema } from '@/schemas/branding';
import { updateFeaturesSchema } from '@/schemas/features';
import { updateUserTypesSchema } from '@/schemas/user-types';
import type { Feature, UserType } from '@/types/types';
import { handleFormAction, handleSignInRedirect } from '@/utils';
import type { StorageError } from '@supabase/storage-js';
import { fail, redirect } from '@sveltejs/kit';
import slugify from 'slugify';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate, withFiles, type Infer } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (event) => {
	const { session } = await event.locals.safeGetSession();
	if (!session) {
		return redirect(302, handleSignInRedirect(event));
	}

	let features: Feature[] = [];
	const { data } = await event.locals.supabase
		.from('feature_flags')
		.select('id')
		.eq('enabled', true);
	if (data) features = data.map((f: { id: Feature }) => f.id);

	let branding: Infer<UpdateBrandingSchema> | null = null;
	const { data: brandingData } = await event.locals.supabase.from('branding').select().single();
	if (brandingData) {
		branding = { ...brandingData, logo: undefined };
		if (brandingData.logo) {
			branding.logoUrl = await event.locals.supabase.storage
				.from('branding')
				.getPublicUrl(brandingData.logo).data.publicUrl;
		}
	}

	let userTypes: UserType[] = [];
	const { data: userTypesData } = await event.locals.supabase.from('user_types').select();
	if (userTypesData) userTypes = userTypesData;

	return {
		updateFeatures: await superValidate(
			{
				guides: features.includes('guides'),
				events: features.includes('events'),
				map: features.includes('map'),
				docs: features.includes('docs'),
				stories: features.includes('stories'),
			},
			zod(updateFeaturesSchema),
			{
				id: 'update-features',
			}
		),
		updateBranding: await superValidate(branding, zod(updateBrandingSchema), {
			id: 'update-branding',
		}),
		updateUserTypes: await superValidate(
			{
				types: userTypes.map((t) => t.label),
				default: userTypes.find((t) => t.is_default)?.label,
			},
			zod(updateUserTypesSchema),
			{
				id: 'update-user-types',
			}
		),
	};
};

export const actions = {
	updateFeatures: async (event) =>
		handleFormAction(
			event,
			updateFeaturesSchema,
			'update-features',
			async (event, userId, form) => {
				const { error: supabaseError } = await event.locals.supabase.from('feature_flags').upsert([
					{ id: 'guides', enabled: form.data.guides },
					{ id: 'events', enabled: form.data.events },
					{ id: 'map', enabled: form.data.map },
					{ id: 'docs', enabled: form.data.docs },
					{ id: 'stories', enabled: form.data.stories },
				]);

				if (supabaseError) {
					setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
					return fail(500, { message: supabaseError.message, form });
				}

				return { form };
			}
		),
	updateBranding: async (event) =>
		handleFormAction(
			event,
			updateBrandingSchema,
			'update-branding',
			async (event, userId, form) => {
				async function uploadImage(
					image: File
				): Promise<{ path: string; error: StorageError | null }> {
					const fileExt = image.name.split('.').pop();
					const filePath = `logo.${fileExt}`;

					const { data: imageFileData, error: imageFileError } = await event.locals.supabase.storage
						.from('branding')
						.upload(filePath, image, { upsert: true });

					if (imageFileError) {
						setFlash({ type: 'error', message: imageFileError.message }, event.cookies);
						return { path: '', error: imageFileError };
					}

					return { path: imageFileData.path, error: null };
				}

				let logoPath = '';
				if (form.data.logo) {
					const { path, error } = await uploadImage(form.data.logo);
					if (error) {
						return fail(500, withFiles({ message: error.message, form }));
					}
					logoPath = path;
				} else if (form.data.logoUrl) {
					logoPath = form.data.logoUrl.split('/').pop() ?? '';
				}

				const { error: supabaseError } = await event.locals.supabase.from('branding').upsert({
					id: 1,
					name: form.data.name,
					slogan: form.data.slogan,
					logo: logoPath,
					color_theme: form.data.color_theme,
					radius: form.data.radius,
				});

				if (supabaseError) {
					setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
					return fail(500, withFiles({ message: supabaseError.message, form }));
				}

				return withFiles({ form });
			}
		),
	updateUserTypes: async (event) =>
		handleFormAction(
			event,
			updateUserTypesSchema,
			'update-user-types',
			async (event, userId, form) => {
				const { error: supabaseError } = await event.locals.supabase.rpc('update_user_types', {
					types: form.data.types.map((t) => ({
						slug: slugify(t, { lower: true, trim: true }),
						label: t,
						is_default: t === form.data.default,
					})),
				});

				if (supabaseError) {
					setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
					return fail(500, { message: supabaseError.message, form });
				}

				return { form };
			}
		),
};
