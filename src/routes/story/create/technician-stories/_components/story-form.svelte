<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Form from '$lib/components/ui/form';
  import { createStorySchema, type CreateStorySchema } from '$lib/schemas/story';
  
  import { superForm, type SuperValidated } from 'sveltekit-superforms';
  import { zodClient, type Infer } from 'sveltekit-superforms/adapters';

  import * as Carousel from "$lib/components/ui/carousel/index.js";

  import VideoAudio from "./video-audio.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { ArrowRight, Loader2 } from "lucide-svelte";
  import Camera from "./camera.svelte";

  const questions = [
    "Fale-nos de si (o seu nome, idade, o que faz no Balcão do Bairro)",
    "Diga-nos porque é que contribui com o seu tempo para o Balcão do Bairro (É uma ligação pessoal? Um sentido de justiça? Já foi atendido(a) e agora está em condições de retribuir?)",
    "Conte-nos uma história de uma pessoa que tenha ajudado e que nunca esquecerá",
    "Diga-nos como se sentiu quando ajudou essa pessoa",
    "Diga-nos como acha que trabalhar no Balcão do Bairro mudou a sua vida"
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

    $formData.role = "technician";
    
    async function handleUpdateStep(event) {
      page = event.detail.page;
      recording = event.detail.file;
      audio = event.detail.audio;
      $formData.recording = recording;
      $formData.recording_link = "";
      updateHiddenFileInput(recording);
      updateHiddenAudioFileInput(audio);
    }
  
    $: imageInputElements = Array(3).fill(null);
    let fileInputElement;
    let audioFileInputElement;

    async function handleImagesCaptured(event) {
      images = event.detail.images;
      if (images.length > 2) {
        updateHiddenImageInputs(images);
      }
    }
    
    function updateHiddenFileInput(file) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputElement.files = dataTransfer.files;
    }

    function updateHiddenAudioFileInput(file) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      audioFileInputElement.files = dataTransfer.files;
    }

    function updateHiddenImageInputs(files) {
      console.log(files)
      files.forEach((file, index) => {
        if (imageInputElements[index]) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          imageInputElements[index].files = dataTransfer.files;
        }
      });
    }

</script>

<style>
  .page { display: none; }
  .page.show { display: block; }
</style>

<form method="POST" enctype="multipart/form-data" class="flex flex-col gap-y-10" >
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

      <Form.Field {form} hidden name="recording" class="text-center">
        <Form.Control let:attrs>
          <input hidden type="file" name="recording" bind:this={fileInputElement} />
          <Form.FieldErrors />
        </Form.Control>
      </Form.Field>

      <Form.Field {form} hidden name="audio" class="text-center">
        <Form.Control let:attrs>
          <input hidden type="file" name="audio" bind:this={audioFileInputElement} />
          <Form.FieldErrors />
        </Form.Control>
      </Form.Field>
    
        <Form.Field {form} hidden name="image_1" class="text-center">
          <Form.Control let:attrs>
              <input hidden type="file" name="image_1" bind:this={imageInputElements[0]}  />
            <Form.FieldErrors />
          </Form.Control>
        </Form.Field>
        <Form.Field {form} hidden name="image_2" class="text-center">
          <Form.Control let:attrs>
              <input hidden type="file" name="image_2" bind:this={imageInputElements[1]}  />
            <Form.FieldErrors />
          </Form.Control>
        </Form.Field>
        <Form.Field {form} hidden name="image_3" class="text-center">
          <Form.Control let:attrs>
              <input hidden type="file" name="image_3" bind:this={imageInputElements[2]}  />
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
        <VideoAudio {page} on:updateStep={handleUpdateStep} />
      </div>
    </div>

    <div class="page" class:show={page === 4}>
      <Camera bind:capturedImages={images} on:imagesCaptured={handleImagesCaptured}/>
      <div class="mt-28 text-center">
        <Button type="submit" disabled={$submitting ||images.length < 3}>
          {#if $submitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          Guardar História
        </Button>
      </div>
    </div>
</form>
