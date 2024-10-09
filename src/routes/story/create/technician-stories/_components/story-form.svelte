<script lang="ts">
	import { applyAction, deserialize } from '$app/forms';
	import { PUBLIC_CLOUDINARY_CLOUD_NAME } from '$env/static/public';
	import { Button } from '$lib/components/ui/button';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import * as Form from '$lib/components/ui/form';
	import { createStorySchema, type CreateStorySchema } from '$lib/schemas/story';

	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient, type Infer } from 'sveltekit-superforms/adapters';

	import Input from '$lib/components/ui/input/input.svelte';

	import { ArrowLeft, ArrowRight, Camera, Check, Loader2, Mic, Video } from 'lucide-svelte';

	const questions = [
		'Fale-nos de si (o seu nome, idade, o que faz no Balcão do Bairro)',
		'Diga-nos porque é que contribui com o seu tempo para o Balcão do Bairro (É uma ligação pessoal? Um sentido de justiça? Já foi atendido(a) e agora está em condições de retribuir?)',
		'Conte-nos uma história de uma pessoa que tenha ajudado e que nunca esquecerá',
		'Diga-nos como se sentiu quando ajudou essa pessoa',
		'Diga-nos como acha que trabalhar no Balcão do Bairro mudou a sua vida',
	];

	let altImg = 'Taking notes';

	let page = 1;

	export let data: SuperValidated<Infer<CreateStorySchema>>;

	const form = superForm(data, {
		validators: zodClient(createStorySchema),
		taintedMessage: true,
		dataType: 'json',
	});

	const { form: formData, errors } = form;

	$formData.role = 'technician';

	let recordingState = 'idle'; // states: 'idle', 'recorded'
	let recordingType = ''; // 'video' or 'audio'
	let firstImageTaken = false;
	let secondImageTaken = false;

	let createStoryForm: HTMLFormElement;

	let mediaFile;
	$: imageFiles = [];
	$: submitting = false;

	function handleMediaUpload(event) {
		mediaFile = event.target.files[0];
		recordingState = 'recorded';
		console.log('video', mediaFile);
	}

	function handleImageUpload(event) {
		imageFiles.push(...event.target.files);
		console.log('images', imageFiles);
		if (!firstImageTaken) {
			firstImageTaken = true;
		} else if (!secondImageTaken) {
			secondImageTaken = true;
		}
	}

	const startRecording = (type) => {
		recordingType = type;
		document.getElementById(type === 'video' ? 'videoFile' : 'audioFile').click();
	};

	const deleteRecording = () => {
		mediaFile = null;
		recordingState = 'idle';
		recordingType = '';
		document.getElementById(recordingType === 'video' ? 'videoFile' : 'audioFile').value = null;
	};

	async function submitCreateStoryForm(event) {
		submitting = true;
		event.preventDefault();

		const formData = new FormData(event.currentTarget);

		async function uploadVideo(video, type) {
			const tempFormData = new FormData();
			tempFormData.append('file', video);
			tempFormData.append('upload_preset', 'bb-comunidade');

			// Make the request to Cloudinary's upload endpoint
			try {
				const response = await fetch(
					`https://api.cloudinary.com/v1_1/${PUBLIC_CLOUDINARY_CLOUD_NAME}/${type}/upload`,
					{
						method: 'POST',
						body: tempFormData,
					}
				);

				const data = await response.json();

				return data.secure_url;
			} catch (error) {
				console.error('Error uploading the video:', error);
				return null;
			}
		}

		const videoUrl = await uploadVideo(mediaFile, 'video');

		if (!videoUrl) {
			console.error('Failed to upload video');
			return;
		}

		const urls = [];

		for (const image of imageFiles) {
			const url = await uploadVideo(image, 'image');
			urls.push(url);
		}

		// formData to send to server

		let newFormData = new FormData();

		// Iterate over the entries of the original FormData
		for (let [key, value] of formData.entries()) {
			if (key !== 'image' || key !== 'recording_link') {
				newFormData.append(key, value);
			}
		}

		newFormData.append('recording_link', videoUrl);
		urls.forEach((url) => newFormData.append('image', url));

		const response = await fetch('?/createStory', {
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

	function triggerFileInput(id) {
		document.getElementById(id).click();
	}
</script>

<div class="container mx-auto space-y-10 pb-10">
	<form
		method="POST"
		action="?/createStory"
		bind:this={createStoryForm}
		on:submit|preventDefault={submitCreateStoryForm}
		enctype="multipart/form-data"
		class="flex flex-col gap-y-10"
	>
		<div class="page" class:show={page === 1}>
			<img class="mx-auto" src="/app_images/taking_notes.png" alt={altImg} width={280} />
			<Form.Field {form} name="storyteller" class="text-center">
				<Form.Control let:attrs>
					<Form.Label class="pb-2 text-3xl font-semibold tracking-tight transition-colors"
						>Qual é o nome da pessoa?</Form.Label
					>
					<span class="inline-block flex justify-center gap-2 pt-3">
						<Input class="w-auto" {...attrs} bind:value={$formData.storyteller} required />
						<Form.FieldErrors />
						<span
							><Button class="p-2" type="button" on:click={() => (page = 2)}><ArrowRight /></Button
							></span
						>
					</span>
				</Form.Control>
			</Form.Field>
		</div>

		<div class="page" class:show={page === 2}>
			<img class="mx-auto" src="/app_images/taking_notes.png" alt={altImg} width={280} />
			<Form.Field {form} name="tags" class="text-center">
				<Form.Control let:attrs>
					<Form.Label class="pb-2 text-3xl font-semibold tracking-tight transition-colors"
						>Em qual Balcão você está?</Form.Label
					>
					<span class="inline-block flex justify-center gap-2 pt-3">
						<Input class="w-auto" {...attrs} bind:value={$formData.tags} required />
						<Form.FieldErrors />
						<span
							><Button class="p-2" type="button" on:click={() => (page = 3)}><ArrowRight /></Button
							></span
						>
					</span>
				</Form.Control>
			</Form.Field>

			<Form.Field {form} hidden name="role" class="text-center">
				<Form.Control let:attrs>
					<input hidden name="role" bind:value={$formData.role} />
					<Form.FieldErrors />
				</Form.Control>
			</Form.Field>
		</div>

		<div class="page" class:show={page === 3}>
			<Form.Field hidden {form} name="recording_link" class="text-center">
				<Form.Control let:attrs>
					<div class="flex flex-col items-center gap-2">
						<input
							type="file"
							accept="video/*"
							id="videoFile"
							on:change={handleMediaUpload}
							class="hidden"
						/>
					</div>
				</Form.Control>
			</Form.Field>

			<Form.Field hidden {form} name="recording_link" class="text-center">
				<Form.Control let:attrs>
					<div class="flex flex-col items-center gap-2">
						<input
							type="file"
							accept="audio/*"
							id="audioFile"
							on:change={handleMediaUpload}
							class="hidden"
						/>
					</div>
				</Form.Control>
			</Form.Field>

			<div class="mx-auto mt-6 h-[150px] w-[280px] px-4">
				<Carousel.Root>
					<Carousel.Content>
						{#each questions as question}
							<Carousel.Item class="w-full">
								<div class="p-2 text-center">
									<span class="text-sm font-semibold">{question}</span>
								</div>
							</Carousel.Item>
						{/each}
					</Carousel.Content>
					<Carousel.Previous />
					<Carousel.Next />
				</Carousel.Root>
			</div>
			<div class="mt-4 text-center">
				<div class="flex flex-col items-center gap-2">
					<!-- <Form.Field {form} name="recording_link" class="text-center">
            <Form.Control let:attrs>
              <div class="flex flex-col items-center gap-2">
                <input
                  type="file"
                  accept="video/*"
                  id="videoFile"
                  on:change={handleMediaUpload}
                  class="hidden"
                  required
                />
                <input
                  type="file"
                  accept="audio/*"
                  id="audioFile"
                  on:change={handleMediaUpload}
                  class="hidden"
                  required
                /> -->
					<div class="flex items-center gap-2">
						<!-- {#if recordingState === 'idle'}
                    <Button
                      type="button"
                      class="p-2 bg-black text-white cursor-pointer text-sm"
                      on:click={startRecording}
                    >
                      Iniciar gravação
                    </Button>
                  {:else if recordingState === 'recorded'}
                    <Button
                      type="button"
                      class="p-2 bg-red-500 text-white cursor-pointer text-sm"
                      on:click={deleteRecording}
                    >
                      Refazer gravação
                    </Button>
                  {/if} -->
						{#if recordingState === 'idle'}
							<Button
								type="button"
								class="cursor-pointer bg-black p-2 text-sm text-white"
								on:click={() => startRecording('video')}
								disabled={recordingState === 'recorded'}
							>
								<Video />
							</Button>
							<Button
								type="button"
								class="cursor-pointer bg-black p-2 text-sm text-white"
								on:click={() => startRecording('audio')}
								disabled={recordingState === 'recorded'}
							>
								<Mic />
							</Button>
						{:else}
							<Button
								type="button"
								class="cursor-pointer bg-red-500 p-2 text-sm text-white"
								on:click={deleteRecording}
							>
								Refazer gravação
							</Button>
						{/if}
						<Button
							class="p-2"
							on:click={() => (page = 4)}
							disabled={recordingState === 'recording' || recordingState === 'idle'}
						>
							<ArrowRight />
						</Button>
					</div>
				</div>
				<!-- <Form.FieldErrors />
              </div>
            </Form.Control>
          </Form.Field> -->
			</div>
		</div>

		<!-- <div class="page" class:show={page === 3}>
        <div class="mx-auto mt-6 w-[280px] h-[150px] px-4">
          <Carousel.Root>
            <Carousel.Content>
              {#each questions as question}
                <Carousel.Item class="w-full">
                  <div class="text-center p-2">
                    <span class="text-sm font-semibold">{question}</span>
                  </div>
                </Carousel.Item>
              {/each}
            </Carousel.Content>
            <Carousel.Previous />
            <Carousel.Next />
          </Carousel.Root>
        </div>
        <div class="mt-4 text-center">
          <Form.Field {form} name="recording_link" class="text-center">
            <Form.Control let:attrs>
              <div class="flex flex-col items-center gap-2">
                <input
                  type="file"
                  accept="video/*"
                  id="videoFile"
                  on:change={handleVideoUpload}
                  class="hidden"
                />
                <div class="flex items-center gap-2">
                  {#if recordingState === 'idle'}
                    <Button
                      type="button"
                      class="p-2 bg-black text-white cursor-pointer text-sm"
                      on:click={startRecording}
                    >
                      Iniciar gravação
                    </Button>
                  {:else if recordingState === 'recorded'}
                    <Button
                      type="button"
                      class="p-2 bg-red-500 text-white cursor-pointer text-sm"
                      on:click={deleteRecording}
                    >
                      Refazer gravação
                    </Button>
                  {/if}
                  <Button class="p-2" on:click={() => page = 4} disabled={recordingState === 'recording' || recordingState === 'idle'}>
                    <ArrowRight />
                  </Button>
                </div>
                <Form.FieldErrors />
              </div>
            </Form.Control>
          </Form.Field>
        </div>
      </div> -->

		<div class="page" class:show={page === 4}>
			<img class="mx-auto" src="/app_images/taking_notes.png" alt={altImg} width={280} />
			<Form.Field {form} name="image" class="text-center">
				<Form.Control let:attrs>
					<Form.Label class="pb-2 text-3xl font-semibold tracking-tight transition-colors"
						>Tire duas fotografias da pessoa.</Form.Label
					>
					<div class="flex flex-col items-center gap-2">
						<input
							type="file"
							accept="image/*"
							id="firstImageFile"
							capture="environment"
							on:change={handleImageUpload}
							class="hidden"
						/>
						<input
							type="file"
							accept="image/*"
							id="secondImageFile"
							capture="environment"
							on:change={handleImageUpload}
							class="hidden"
						/>
						<div class="flex items-center gap-2">
							{#if !firstImageTaken}
								<Button
									type="button"
									class="cursor-pointer bg-black p-2 text-sm text-white"
									on:click={() => triggerFileInput('firstImageFile')}
								>
									<Camera class="mr-2 h-4 w-4" />
									Tirar Primeira Fotografia
								</Button>
							{:else if !secondImageTaken}
								<Button
									type="button"
									class="cursor-pointer bg-black p-2 text-sm text-white"
									on:click={() => triggerFileInput('secondImageFile')}
								>
									<Camera class="mr-2 h-4 w-4" />
									Tirar Segunda Fotografia
								</Button>
							{/if}
						</div>
						{#if imageFiles.length > 1}
							<Check class="h-4 w-4 text-green-600" />
							<p class="text-green-600">Fotografias guardadas</p>
						{/if}
					</div>
				</Form.Control>
			</Form.Field>

			<div class="mt-28 text-center">
				<Button type="submit" disabled={submitting}>
					{#if submitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Guardar História
				</Button>
			</div>
		</div>
	</form>
	{#if page !== 1}
		<div
			class="sticky bottom-0 flex w-full flex-col items-center justify-center gap-y-4 border-t bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:flex-row sm:gap-x-10 sm:py-8"
		>
			<Button
				variant="outline"
				on:click={() => (page > 1 ? (page = page - 1) : page)}
				class="w-full sm:w-auto"
			>
				<ArrowLeft class="mr-2 h-4 w-4" />
				Voltar
			</Button>
		</div>
	{/if}
</div>

<style>
	.page {
		display: none;
	}
	.page.show {
		display: block;
	}
</style>
