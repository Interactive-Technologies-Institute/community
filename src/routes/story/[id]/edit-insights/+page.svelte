<script lang="ts">
	import { applyAction, deserialize } from '$app/forms';
	import { PUBLIC_CLOUDINARY_CLOUD_NAME, PUBLIC_OPENAI_API_KEY } from '$env/static/public';
	import PageHeader from '@/components/page-header.svelte';
	import { Button } from '@/components/ui/button';
	import * as Form from '@/components/ui/form';
	import { updateStoryInsightsSchema, type UpdateStoryInsightsSchema } from '@/schemas/story-insights';
	import { PencilLine } from 'lucide-svelte';
	import OpenAI from "openai";
	import { afterUpdate, onMount } from 'svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	export let data: SuperValidated<Infer<UpdateStoryInsightsSchema>>;

	const form = superForm(data, {
    validators: zodClient(updateStoryInsightsSchema),
		taintedMessage: true,
		dataType: 'json',
		resetForm: false,
	});
    
  const { form: formData, enhance, submitting } = form;

	let updateStoryForm: HTMLFormElement;

	
	const openai = new OpenAI({ apiKey: PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true });
  $: insights = ""
  $: transcription = ""
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

	async function generate_insights(transcription:string) {
		try {
			const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            "role": "system",
            "content": "Eu tenho uma transcrição de uma atendente e um cliente. A atendente faz as seguintes perguntas: Fale-nos de si (o seu nome, idade, bairro onde vive), Fale-nos de um problema que o Balcão o ajudou a resolver e das consequências desse problema, Diga-nos como o Balcão o ajudou a resolver o problema, especificando ao máximo os passos e todas as barreiras que enfrentou, Diz-nos como te sentiste quando o Balcão te ajudou, qual foi o impacto na tua vida?, Como resolverias isso se o Balcão não existisse? Seria mais fácil ou mais difícil? A partir da transcrição, diga quais são os pontos fortes do balcão e quais pontos precisam ser melhorados. No máximo 3 de cada e escolha os mais importantes e relevantes."
          },
          {
            "role": "user",
            "content": transcription
          }
        ],
        temperature: 1,
        max_tokens: 1600,
        top_p: 1,
      });

			return response;

		} catch (error) {
			console.log("error in generating insights", error)
			return null;
		}
	}

	const getIdentifier = (url: string) => {
		const regex = /\/([^/]+)\.mov$/;
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
  const formData = $formData.updateInsightsForm.data;

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
          insights = await generate_insights(transcription);
      } catch (error) {
          console.error("Failed to transcribe recording:", error);
      }
  } else {
    if (formData.insights) {
      insights = formData.insights;
    } else {
      let insightsResult = await generate_insights(formData.transcription);
      insights = insightsResult.choices[0].message.content
    }
	}

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

    if (!$formData.updateInsightsForm.data.transcription) {
      newFormData.append("transcription", transcription);
    }

    newFormData.append("insights_gpt", insights);

    const response = await fetch('?/updateStory', {
      method: 'POST',
      body: newFormData,
      headers: {
        'x-sveltekit-action': 'true'
      }
    });

		const result =  deserialize(await response.text());

		applyAction(result);
	}

	function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

</script>

<PageHeader title={"Insights"} subtitle="" />
<form method="POST" action="?/updateStory" bind:this={updateStoryForm} on:submit|preventDefault={submitUpdateStoryForm}>
  <div class="container mx-auto space-y-10 pb-10">
    {#if insights === ''}
			<PencilLine class="h-32 w-32 mx-auto" />
      <h2 class="mb-2 text-2xl font-medium text-center">A gerar insights...</h2>
      <p class="text-center">Por favor, não recarregue a página.</p>
    {:else}
      <Form.Field {form} name="insights_gpt">
        <Form.Control let:attrs>
          <textarea {...attrs} bind:value={insights} class="w-full h-32 p-2 border rounded resize-none" bind:this={textarea} on:input={() => adjustTextareaHeight(textarea)}></textarea>
          <Form.FieldErrors />
        </Form.Control>
      </Form.Field>
    {/if}
    <div class="sticky bottom-0 flex w-full flex-row items-center justify-center gap-x-10 border-t bg-background/95 py-8 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button variant="outline" type="submit">
        Guardar
      </Button>
    </div>
  </div>
</form>