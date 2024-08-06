<script lang="ts">
	import { PUBLIC_OPENAI_API_KEY, PUBLIC_CLOUDINARY_API_KEY, PUBLIC_CLOUDINARY_API_SECRET, PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
	import { onMount } from 'svelte';
	import ModerationBanner from '@/components/moderation-banner.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import { Button } from '@/components/ui/button';
	import * as Card from "$lib/components/ui/card";
	import { ArrowLeft, Pen } from 'lucide-svelte';
	/* 	import UsefulButton from './_components/useful-button.svelte'; */
	import OpenAI from "openai";

	export let data;
	/* console.log(data.story.recording_link)

	
	const openai = new OpenAI({ apiKey: PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true });
	$: transcription = "";


	async function transcribe(audioFile) {
		try {
			const transcription = await openai.audio.transcriptions.create({
				file: audioFile,
				model: "whisper-1",
				response_format: "text"
			});

			return transcription;

		} catch (error) {
			console.log("error in transcription", error)
			return null;
		}
	}

	const getIdentifier = (url) => {
		const regex = /\/([^/]+)\.mov$/;
		const match = url.match(regex);
		return match ? match[1] : null;
	};

	const getExtension = (url) => {
		const match = url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
		return match ? match[1] : null;
	};

	const getBlobFromUrl = async (url) => {
		const response = await fetch(url);
		const arrayBuffer = await response.arrayBuffer();
		const blob = new Blob([arrayBuffer], { type: response.headers.get('content-type') });
		return blob;
	};

	onMount(async () => {
		//let mp4Url = await cloudinary.video(getIdentifier(data.story.recording_link), { fetch_format: "mp4" });
		if(getExtension(data.story.recording_link) === "mov") {
			console.log("eu converto")
			const mp4Url = `https://res.cloudinary.com/${PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/f_mp4/${getIdentifier(data.story.recording_link)}.mp4`
			console.log(mp4Url);
	
			getBlobFromUrl(mp4Url).then((blob) => {
				let videoFileTemp = new File([blob], `audio_file.mp4`, { type: `video/mp4` });
				console.log("transcription?", data.story.transcription)
				if (!data.story.transcription) {
					console.log("transcribing...")
					transcribe(videoFileTemp).then((result) => {
						transcription = result;
					})
				}
			});
		} else {
			console.log("eu não preciso converter")
			getBlobFromUrl(data.story.recording_link).then((blob) => {
				let videoFileTemp = new File([blob], `audio_file.mp4`, { type: `video/mp4` });
				console.log("transcription?", data.story.transcription)
				if (!data.story.transcription) {
					console.log("transcribing...")
					transcribe(videoFileTemp).then((result) => {
						transcription = result;
					})
				}
			});
		}
	}); */

</script>

<PageHeader title={"Transcrição"} subtitle="" />
<div class="container mx-auto space-y-10 pb-10">
	{#if data.story.transcription !== ''}
  	<p>{data.story.transcription}</p>
	{/if}

	<div
		class="sticky bottom-0 flex w-full flex-row items-center justify-center gap-x-10 border-t bg-background/95 py-8 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	>
		<Button variant="outline" href="/story/{data.story.id}"  class="w-full sm:w-auto">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Voltar
		</Button>
		<Button href="/story/{data.story.id}/edit-transcription">
			<Pen class="mr-2 h-4 w-4" />
			Editar transcrição
		</Button>
	</div>
</div>