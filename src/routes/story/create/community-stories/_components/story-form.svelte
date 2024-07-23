<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from "$lib/components/ui/button";
  import * as Form from '$lib/components/ui/form';
  import * as Carousel from "$lib/components/ui/carousel/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import { createStorySchema, type CreateStorySchema } from '$lib/schemas/story';
  
  import { superForm, type SuperValidated } from 'sveltekit-superforms';
  import { zodClient, type Infer } from 'sveltekit-superforms/adapters';
  
  import VideoAudio from "./video-audio.svelte";
  import Input from "$lib/components/ui/input/input.svelte";

  import { ArrowRight, Loader2 } from "lucide-svelte";
  import Camera from "./camera.svelte";
  
  const questions = [
    "Fale-nos de si (o seu nome, idade, bairro onde vive)",
    "Fale-nos de um problema que o Balcão o ajudou a resolver e das consequências desse problema",
    "Diga-nos como o Balcão o ajudou a resolver o problema, especificando ao máximo os passos e todas as barreiras que enfrentou",
    "Diz-nos como te sentiste quando o Balcão te ajudou, qual foi o impacto na tua vida?",
    "Como resolverias isso se o Balcão não existisse? Seria mais fácil ou mais difícil?"
  ]
  
  let altImg = 'Taking notes'
  
  let page = 1;
  let recording;
  let audio;
  let images = [];
  
  export let data: SuperValidated<Infer<CreateStorySchema>>;
    
    const form = superForm(data, {
      validators: zodClient(createStorySchema),
      taintedMessage: true,
      dataType: 'json',
    });
    
    const { form: formData, submitting, errors } = form;

    $formData.role = "community";


	  let uploadVideoForm: HTMLFormElement;
	  let createStoryForm: HTMLFormElement;

  function submitFormAndUpdatePage() {
    uploadVideoForm.requestSubmit();
    page = 4;
  }

  function submitCreateStoryForm() {
    createStoryForm.requestSubmit();
  }

</script>

<style>
  .page { display: none; }
  .page.show { display: block; }
</style>

<form method="POST" action="?/createStory" use:enhance bind:this={createStoryForm} on:submit|preventDefault={submitCreateStoryForm} enctype="multipart/form-data" class="flex flex-col gap-y-10">
    <div class="page" class:show={page === 1}>
      <img class="mx-auto" src="/app_images/taking_notes.png" alt={altImg} width={280}/>
      <Form.Field {form} name="storyteller" class="text-center">
        <Form.Control let:attrs>
          <Form.Label class="pb-2 text-3xl font-semibold tracking-tight transition-colors">Qual é o nome da pessoa?</Form.Label>
          <span class="flex justify-center gap-2 inline-block pt-3">
            <Input {...attrs} bind:value={$formData.storyteller}/>
            <Form.FieldErrors />
            <span><Button class="p-2" type="button" on:click={() => page = 2}><ArrowRight /></Button></span>
          </span>
        </Form.Control>
      </Form.Field>

      <Form.Field {form} hidden name="recording_link" class="text-center">
        <Form.Control let:attrs>
          <input hidden type="file" name="recording_link" bind:value={$formData.recording_link} />
          <Form.FieldErrors />
        </Form.Control>
      </Form.Field>
    </div>

    <div class="page" class:show={page === 2}>
      <img class="mx-auto" src="/app_images/taking_notes.png" alt={altImg} width={280}/>
      <Form.Field {form} name="tags" class="text-center">
				<Form.Control let:attrs>
          <Form.Label class="pb-2 text-3xl font-semibold tracking-tight transition-colors">Em qual Balcão você está?</Form.Label>
          <span class="flex justify-center gap-2 inline-block pt-3">
            <Input {...attrs} bind:value={$formData.tags} />
            <Form.FieldErrors />
            <span><Button class="p-2" type="button" on:click={() => page = 3}><ArrowRight /></Button></span>
          </span>
				</Form.Control>
			</Form.Field>
    </div>

    <div class="page" class:show={page === 4}>
      <Form.Field {form} name="images" class="text-center">
        <Form.Control let:attrs>
          <Input  {...attrs} type="file" bind:value={$formData.images[0]} capture="environment" accept="image/*" />
          <Input  {...attrs} type="file" bind:value={$formData.images[1]} capture="environment" accept="image/*" />
        </Form.Control>
      </Form.Field>
      <div class="mt-28 text-center">
        <Button type="submit" disabled={$submitting || $formData.images.length < 2}>
          {#if $submitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          Guardar História
        </Button>
      </div>
    </div>
</form>

<form  method="post" action="?/uploadVideo"  bind:this={uploadVideoForm} use:enhance enctype="multipart/form-data" on:submit|preventDefault={submitFormAndUpdatePage}>
  <div class="page" class:show={page === 3}>
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
      <Form.Field {form} name="recording" class="text-center">
        <Form.Control let:attrs>
          <label for="videoFile">Upload a video:</label>
          <span class="flex justify-center gap-2 inline-block pt-3">
            <Input  {...attrs} type="file" bind:value={$formData.recording} capture="environment" accept="video/*" />
            <Form.FieldErrors />
            <span><Button class="p-2" type="submit"><ArrowRight /></Button></span>
          </span>
        </Form.Control>
      </Form.Field>
    </div>
  </div>
</form>
