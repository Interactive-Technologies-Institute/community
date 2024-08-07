import { createStorySchema } from '$lib/schemas/story';
import { PUBLIC_YOUTUBE_CLIENT_ID, PUBLIC_YOUTUBE_SECRET_KEY, PUBLIC_OPENAI_API_KEY, PUBLIC_CLOUDINARY_API_KEY, PUBLIC_CLOUDINARY_API_SECRET, PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
import { handleFormAction, handleSignInRedirect } from '@/utils';
import type { StorageError } from '@supabase/storage-js';
import { error, fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate, withFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { v4 as uuidv4 } from 'uuid';
import { google } from 'googleapis';
import { Readable } from 'stream';
import OpenAI from "openai";
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import fs from 'fs';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: PUBLIC_CLOUDINARY_API_KEY,
  api_secret: PUBLIC_CLOUDINARY_API_SECRET
});

const openai = new OpenAI({ apiKey: PUBLIC_OPENAI_API_KEY });

export const load = async ({ event, locals, url }) => {
	const { session } = await locals.safeGetSession();
	if (!session) {
		return redirect(302, handleSignInRedirect(event));
	}

    return {
        createForm: await superValidate(zod(createStorySchema), {
            id: 'create-story',
        }),
    };
};


export const actions = {
	createStory: async (event) =>
	handleFormAction(event, createStorySchema, 'create-story', async (event, userId, form) => {
		console.log("form do createstory", form.data)

		function bufferToStream(buffer: ArrayBuffer) {
			return new Readable({
				read() {
					this.push(Buffer.from(buffer));
					this.push(null);
				}
			});
		} 

		const { error: supabaseError } = await event.locals.supabase
		.from('story')
		.insert({ ...form.data, user_id: userId });

		if (supabaseError) {
			console.log("supabaseError", supabaseError.message)
			setFlash({ type: 'error', message: supabaseError.message }, event.cookies);
			return fail(500, withFiles({ message: supabaseError.message, form }));
		}

		throw redirect(303, '/story');

		return { success: true };
	})
};