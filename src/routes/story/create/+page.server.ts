import { PUBLIC_YOUTUBE_CLIENT_ID, PUBLIC_YOUTUBE_SECRET_KEY } from '$env/static/public';
import { google } from 'googleapis';
import { redirect } from '@sveltejs/kit'; 

export const load = async ({ locals, url, cookies }) => {
};