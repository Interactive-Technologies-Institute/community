<script lang="ts">
	import { applyAction, deserialize } from '$app/forms';
	import { PUBLIC_CLOUDINARY_CLOUD_NAME, PUBLIC_OPENAI_API_KEY } from '$env/static/public';
	import PageHeader from '@/components/page-header.svelte';
	import { Button } from '@/components/ui/button';
	import * as Form from '@/components/ui/form';
	import {
		updateStoryInsightsSchema,
		type UpdateStoryInsightsSchema,
	} from '@/schemas/story-insights';
	import { PencilLine } from 'lucide-svelte';
	import OpenAI from 'openai';
	import { afterUpdate, onMount } from 'svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Loader2 } from 'lucide-svelte';

	export let data: { updateInsightsForm: SuperValidated<Infer<UpdateStoryInsightsSchema>> };


	const form = superForm(data.updateInsightsForm, {
		validators: zodClient(updateStoryInsightsSchema),
		taintedMessage: true,
		dataType: 'json',
		resetForm: false,
	});

	const { form: formData, enhance } = form;

	let updateStoryForm: HTMLFormElement;

	const openai = new OpenAI({ apiKey: PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true });
	$: insights = '';
	$: transcription = '';
	$: submitting = false;
	$: generated = false;
	let textarea: HTMLTextAreaElement;

	let technician_text =
		'Eu tenho uma transcrição de uma atendente e um cliente. A atendente faz as seguintes perguntas: Fale-nos de si (o seu nome, idade, o que faz no Balcão do Bairro), Diga-nos porque é que contribui com o seu tempo para o Balcão do Bairro (É uma ligação pessoal? Um sentido de justiça? Já foi atendido(a) e agora está em condições de retribuir?), Conte-nos uma história de uma pessoa que tenha ajudado e que nunca esquecerá, Diga-nos como se sentiu quando ajudou essa pessoa, Diga-nos como acha que trabalhar no Balcão do Bairro mudou a sua vida. A partir da transcrição, diga quais são os pontos fortes do balcão e quais pontos precisam ser melhorados. No máximo 3 de cada e escolha os mais importantes e relevantes.';
	let community_text =
		'Eu tenho uma transcrição de uma atendente e um cliente. A atendente faz as seguintes perguntas: Fale-nos de si (o seu nome, idade, bairro onde vive), Fale-nos de um problema que o Balcão o ajudou a resolver e das consequências desse problema, Diga-nos como o Balcão o ajudou a resolver o problema, especificando ao máximo os passos e todas as barreiras que enfrentou, Diz-nos como te sentiste quando o Balcão te ajudou, qual foi o impacto na tua vida?, Como resolverias isso se o Balcão não existisse? Seria mais fácil ou mais difícil? E a partir da transcrição, diga quais são os pontos fortes do balcão e quais pontos precisam ser melhorados. No máximo 3 de cada e escolha os mais importantes e relevantes.';

	async function transcribe(audioFile: File) {
		try {
			const transcription = await openai.audio.transcriptions.create({
				file: audioFile,
				model: 'whisper-1',
				response_format: 'text',
			});

			return transcription;
		} catch (error) {
			console.log('error in transcription', error);
			return null;
		}
	}

	async function generate_insights(role: string, transcription: string) {
		try {
			const response = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: role === 'technician' ? `${technician_text}` : `${community_text}`,
					},
					{
						role: 'user',
						content: transcription,
					},
				],
				temperature: 1,
				max_tokens: 1600,
				top_p: 1,
			});

			generated = true;

			return response;
		} catch (error) {
			console.log('error in generating insights', error);
			return null;
		}
	}

	const getIdentifier = (url: string) => {
		const regex = /\/([^/]+)\.(mov|mp3|mp4|3gp|avi|mkv|flv|wmv|wav|ogg|aac)$/i;
		const match = url.match(regex);
		return match ? match[1] : null;
	};

	const getExtension = (url: string) => {
		const match = url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
		return match ? match[1] : null;
	};

	const getBlobFromUrl = async (url: string) => {
		const response = await fetch(url);
		const arrayBuffer = await response.arrayBuffer();
		const contentType = response.headers.get('content-type') || 'application/octet-stream';
		const blob = new Blob([arrayBuffer], { type: contentType });
		return blob;
	};

	onMount(async () => {
		const formData = $formData;

		const transcribeRecording = async (recordingLink: string) => {
			const extension = getExtension(recordingLink);
			let videoUrl = recordingLink;

			if (extension !== 'mp4') {
				const identifier = getIdentifier(recordingLink);
				videoUrl = `https://res.cloudinary.com/${PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/f_mp4/${identifier}.mp4`;
			}

			try {
				const blob = await getBlobFromUrl(videoUrl);
				const videoFile = new File([blob], 'audio_file.mp4', { type: 'video/mp4' });

				console.log('Transcribing...');
				return await transcribe(videoFile);
			} catch (error) {
				console.error('Error during transcription:', error);
				throw error;
			}
		};

		try {
			if (formData.role !== undefined){
				if (!formData.transcription) {
						if (formData.recording_link !== undefined){
							const transcriptionResult = await transcribeRecording(formData.recording_link);
							transcription = transcriptionResult ?? "";
							let insightsResult = await generate_insights(formData.role, transcription) ?? "";
							insights = typeof insightsResult === 'string' ? insightsResult : insightsResult?.choices[0]?.message.content ?? '';
						}
						else{
							throw new Error("Failed to edit insight")
						}
				} else {
					if (formData.insights_gpt) {
						insights = formData.insights_gpt;
						generated = true;
					} else {
						let insightsResult = await generate_insights(formData.role, transcription) ?? "";
						insights = typeof insightsResult === 'string' ? insightsResult : insightsResult?.choices[0]?.message.content ?? '';
					}
				}
			}
			else{
				throw new Error("Failed to edit insight");
			}
		} catch (error) {
			console.error(error);
		}

		afterUpdate(() => {
			if (textarea) {
				adjustTextareaHeight(textarea);
			}
		});
	});

	async function submitUpdateStoryForm(event: { preventDefault: () => void; currentTarget: HTMLFormElement | undefined; }) {
		submitting = true;
		event.preventDefault();

		const formData = new FormData(event.currentTarget);
		console.log('current', event.currentTarget);

		let newFormData = new FormData();

		if (!$formData.transcription) {
			newFormData.append('transcription', transcription);
		}

		newFormData.append('insights_gpt', insights);

		const response = await fetch('?/updateStory', {
			method: 'POST',
			body: newFormData,
			headers: {
				'x-sveltekit-action': 'true',
			},
		});

		const result = deserialize(await response.text());
		if (result.status === 200) {
			submitting = false;
		}

		applyAction(result);
	}

	function adjustTextareaHeight(textarea: HTMLTextAreaElement) {
		textarea.style.height = 'auto';
		textarea.style.height = `${textarea.scrollHeight}px`;
	}
</script>

<PageHeader title={'Análise'} subtitle="" />
<form
	method="POST"
	action="?/updateStory"
	bind:this={updateStoryForm}
	on:submit|preventDefault={submitUpdateStoryForm}
>
	<div class="container mx-auto space-y-10 pb-10">
		{#if insights === '' && !generated}
			<PencilLine class="mx-auto h-32 w-32" />
			<h2 class="mb-2 text-center text-2xl font-medium">A gerar a análise...</h2>
			<p class="text-center">Por favor, não recarregue a página.</p>
		{:else}
			<Form.Field {form} name="insights_gpt">
				<Form.Control let:attrs>
					<textarea
						{...attrs}
						bind:value={insights}
						class="h-32 w-full resize-none rounded border p-2"
						bind:this={textarea}
						on:input={() => adjustTextareaHeight(textarea)}
					></textarea>
					<Form.FieldErrors />
				</Form.Control>
			</Form.Field>
		{/if}
		<div
			class="sticky bottom-0 flex w-full flex-row items-center justify-center gap-x-10 border-t bg-background/95 py-8 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<Button variant="outline" type="submit" disabled={insights.length < 5 || submitting}>
				{#if submitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Guardar
			</Button>
		</div>
	</div>
</form>
