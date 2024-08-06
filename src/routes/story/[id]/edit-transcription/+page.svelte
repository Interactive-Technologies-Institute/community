<script lang="ts">
	import { PUBLIC_OPENAI_API_KEY, PUBLIC_CLOUDINARY_API_KEY, PUBLIC_CLOUDINARY_API_SECRET, PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
	import { onMount } from 'svelte';
	import ModerationBanner from '@/components/moderation-banner.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import { Button } from '@/components/ui/button';
  import * as Form from '@/components/ui/form';
  import { Input } from '@/components/ui/input';
	import * as Card from "$lib/components/ui/card";
	import { BarChart2, CircleUser, Clock, Footprints, Pen, Tag, Trash } from 'lucide-svelte';
	import { ArrowLeft, ArrowDownUp } from 'lucide-svelte';
	/* 	import UsefulButton from './_components/useful-button.svelte'; */
	import OpenAI from "openai";
	import { updateStoryTranscriptionSchema, type UpdateStoryTranscriptionSchema } from '@/schemas/story-transcription';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { applyAction, deserialize } from '$app/forms';

	export let data: SuperValidated<Infer<UpdateStoryTranscriptionSchema>>;
		console.log(data)

	const form = superForm(data, {
    validators: zodClient(updateStoryTranscriptionSchema),
		taintedMessage: true,
		dataType: 'json',
		resetForm: false,
	});
    
  const { form: formData, enhance, submitting } = form;

	let updateStoryForm: HTMLFormElement;

	
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
    console.log("eu faço load dessa página")
		console.log($formData.updateTranscriptionForm.data)
		if (!$formData.updateTranscriptionForm.data.transcription) {
			if(getExtension($formData.updateTranscriptionForm.data.recording_link) === "mov") {
				console.log("eu converto")
				const mp4Url = `https://res.cloudinary.com/${PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/f_mp4/${getIdentifier($formData.updateTranscriptionForm.data.recording_link)}.mp4`
				console.log(mp4Url);
		
				getBlobFromUrl(mp4Url).then((blob) => {
					let videoFileTemp = new File([blob], `audio_file.mp4`, { type: `video/mp4` });
					console.log("transcription?", $formData.updateTranscriptionForm.data.transcription)
					if (!$formData.updateTranscriptionForm.data.transcription) {
						console.log("transcribing...")
						transcribe(videoFileTemp).then((result) => {
							transcription = result;
						})
					}
				});
			} else {
				console.log("eu não preciso converter")
				getBlobFromUrl($formData.updateTranscriptionForm.data.recording_link).then((blob) => {
					let videoFileTemp = new File([blob], `audio_file.mp4`, { type: `video/mp4` });
					console.log("transcription?", $formData.updateTranscriptionForm.data.transcription)
					if (!$formData.transcription) {
						console.log("transcribing...")
						transcribe(videoFileTemp).then((result) => {
							transcription = result;
						})
					}
				});
			}
		} else {
			transcription = $formData.updateTranscriptionForm.data.transcription;
		}
	});

	async function submitUpdateStoryForm(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
		console.log("current", event.currentTarget)

		let newFormData = new FormData();

    // Iterate over the entries of the original FormData
    /* for (let [key, value] of formData.entries()) {
      if (key !== "image" || key !== "recording_link") {
        newFormData.append(key, value);
      }
    }*/

    newFormData.append("recording_link", $formData.updateTranscriptionForm.data.recording_link);
    newFormData.append("transcription", transcription);

    const response = await fetch('?/updateStory', {
      method: 'POST',
      body: newFormData,
      headers: {
        'x-sveltekit-action': 'true'
      }
    });

		const result =  deserialize(await response.text());
		console.log("Result:", result);

		applyAction(result);
	}

</script>

<form method="POST" action="?/updateStory" bind:this={updateStoryForm} on:submit|preventDefault={submitUpdateStoryForm} >
  <div class="container mx-auto space-y-10 pb-10">
    {#if transcription !== ''}
    <Form.Field {form} name="transcription">
      <Form.Control let:attrs>
        <Form.Label>Transcription</Form.Label>
        <Input {...attrs} bind:value={transcription} />
        <Form.FieldErrors />
      </Form.Control>
    </Form.Field>
    {/if}

    <div
      class="sticky bottom-0 flex w-full flex-row items-center justify-center gap-x-10 border-t bg-background/95 py-8 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <Button variant="outline" type="submit">
        Save
      </Button>
    </div>
  </div>
</form>