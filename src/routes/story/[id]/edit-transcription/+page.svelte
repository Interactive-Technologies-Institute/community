<script lang="ts">
	import { PUBLIC_OPENAI_API_KEY, PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
	import { afterUpdate, onMount } from 'svelte';
	import ModerationBanner from '@/components/moderation-banner.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import { Button } from '@/components/ui/button';
  import * as Form from '@/components/ui/form';
  import { Input } from '@/components/ui/input';
	import * as Card from "$lib/components/ui/card";
	import { PencilLine } from 'lucide-svelte';
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
	let textarea: HTMLTextAreaElement;


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
  const formData = $formData.updateTranscriptionForm.data;

  const transcribeRecording = async (recordingLink: string) => {
      const extension = getExtension(recordingLink);
      let videoUrl = recordingLink;

      if (extension === "mov") {
          const identifier = getIdentifier(recordingLink);
          videoUrl = `https://res.cloudinary.com/${PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/f_mp4/${identifier}.mp4`;
      }

      try {
          const blob = await getBlobFromUrl(videoUrl);
          const videoFile = new File([blob], 'audio_file.mp4', { type: 'video/mp4' });

          console.log("Transcribing...");
          return await transcribe(videoFile);
      } catch (error) {
          console.error("Error during transcription:", error);
          throw error;
      }
  };

  if (!formData.transcription) {
      try {
          const transcriptionResult = await transcribeRecording(formData.recording_link);
          transcription = transcriptionResult;
      } catch (error) {
          console.error("Failed to transcribe recording:", error);
      }
  } else {
		transcription = formData.transcription;
	}
// BE03 9676 6264 7984
  afterUpdate(() => {
      if (textarea) {
          adjustTextareaHeight(textarea);
      }
  });
});

	async function submitUpdateStoryForm(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
		console.log("current", event.currentTarget)

		let newFormData = new FormData();

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

	function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

</script>

<PageHeader title={"Transcrição"} subtitle="" />
<form method="POST" action="?/updateStory" bind:this={updateStoryForm} on:submit|preventDefault={submitUpdateStoryForm}>
  <div class="container mx-auto space-y-10 pb-10">
    {#if transcription === ''}
			<PencilLine class="h-32 w-32 mx-auto" />
      <h2 class="mb-2 text-2xl font-medium text-center">A gerar transcrição...</h2>
      <p class="text-center">Por favor, não recarregue a página.</p>
    {:else}
      <Form.Field {form} name="transcription">
        <Form.Control let:attrs>
          <textarea {...attrs} bind:value={transcription} class="w-full h-32 p-2 border rounded resize-none" bind:this={textarea} on:input={() => adjustTextareaHeight(textarea)}></textarea>
          <Form.FieldErrors />
        </Form.Control>
      </Form.Field>
    {/if}
    <div class="sticky bottom-0 flex w-full flex-row items-center justify-center gap-x-10 border-t bg-background/95 py-8 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button variant="outline" type="submit">
        Save
      </Button>
    </div>
  </div>
</form>