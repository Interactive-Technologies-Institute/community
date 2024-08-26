<script lang="ts">
	import { PUBLIC_OPENAI_API_KEY, PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
	import { afterUpdate, onMount } from 'svelte';
	import PageHeader from '@/components/page-header.svelte';
	import { Button } from '@/components/ui/button';
  import * as Form from '@/components/ui/form';
	import { PencilLine } from 'lucide-svelte';
	import OpenAI from "openai";
	import { updateStoryTranscriptionSchema, type UpdateStoryTranscriptionSchema } from '@/schemas/story-transcription';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { applyAction, deserialize } from '$app/forms';
  import { Loader2 } from 'lucide-svelte';

	export let data: SuperValidated<Infer<UpdateStoryTranscriptionSchema>>;

	const form = superForm(data, {
    validators: zodClient(updateStoryTranscriptionSchema),
		taintedMessage: true,
		dataType: 'json',
		resetForm: false,
	});
    
  const { form: formData, enhance } = form;

	let updateStoryForm: HTMLFormElement;

	
	const openai = new OpenAI({ apiKey: PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true });
	$: transcription = "";
  $: submitting = false;
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

	const getIdentifier = (url: string) => {
		const regex = /\/([^/]+)\.(mov|mp3|mp4|3gp|avi|mkv|flv|wmv|wav|ogg)$/i;
		const match = url.match(regex);
		return match ? match[1] : null;
	};

	const getExtension = (url:string) => {
		const match = url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
		return match ? match[1] : null;
	};

	const getBlobFromUrl = async (url:string) => {
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

      if (extension !== "mp4") {
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

  afterUpdate(() => {
      if (textarea) {
          adjustTextareaHeight(textarea);
      }
  });
});

	async function submitUpdateStoryForm(event) {
    submitting = true;
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
    if(result.status === 200) {
      submitting = false;
    }

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
      <Button variant="outline" type="submit" disabled={transcription === '' || submitting}>
        {#if submitting}
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
        {/if}
        Guardar
      </Button>
    </div>
  </div>
</form>