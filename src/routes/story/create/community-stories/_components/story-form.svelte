<script lang="ts">
  import { applyAction, deserialize, enhance } from '$app/forms';
  import { Button } from "$lib/components/ui/button";
  import * as Form from '$lib/components/ui/form';
  import * as Carousel from "$lib/components/ui/carousel/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import { createStorySchema, type CreateStorySchema } from '$lib/schemas/story';
  import { PUBLIC_CLOUDINARY_CLOUD_NAME  } from '$env/static/public'
  
  import { superForm, type SuperValidated } from 'sveltekit-superforms';
  import { zodClient, type Infer } from 'sveltekit-superforms/adapters';

  import { Cloudinary } from "@cloudinary/url-gen";
  import { format } from '@cloudinary/url-gen/actions/delivery';
  
  import Input from "$lib/components/ui/input/input.svelte";

  import { ArrowRight, Loader2 } from "lucide-svelte";
  
  const questions = [
    "Fale-nos de si (o seu nome, idade, bairro onde vive)",
    "Fale-nos de um problema que o Balcão o ajudou a resolver e das consequências desse problema",
    "Diga-nos como o Balcão o ajudou a resolver o problema, especificando ao máximo os passos e todas as barreiras que enfrentou",
    "Diz-nos como te sentiste quando o Balcão te ajudou, qual foi o impacto na tua vida?",
    "Como resolverias isso se o Balcão não existisse? Seria mais fácil ou mais difícil?"
  ]

  // Configure Cloudinary with your credentials
  const cld = new Cloudinary({
  cloud: {
    cloudName: PUBLIC_CLOUDINARY_CLOUD_NAME
  }
});
  
  let altImg = 'Taking notes'
  
  let page = 1;
  
  export let data: SuperValidated<Infer<CreateStorySchema>>;
    
    const form = superForm(data, {
      validators: zodClient(createStorySchema),
      taintedMessage: true,
      dataType: 'json',
    });
    
    const { form: formData, submitting, errors } = form;

    $formData.role = "community";

	  let createStoryForm: HTMLFormElement;

    let videoFile;
    $: imageFiles = [];

    function handleVideoUpload(event) {
      videoFile = event.target.files[0];
      console.log("video", videoFile)
    }

    function handleImageUpload(event) {
      imageFiles.push(...event.target.files);
      console.log("images", imageFiles)
    }

  async function submitCreateStoryForm(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    //const file = formData.get('recording_link'); 
    //const images = formData.getAll('image'); 
    //console.log(images);

    async function uploadVideo(video, type) {
      // Create a form data object to store the file and other parameters
      const tempFormData = new FormData();
      tempFormData.append('file', video);
      tempFormData.append('upload_preset', 'bb-comunidade'); // Ensure you have an unsigned upload preset
      

      // Make the request to Cloudinary's upload endpoint
      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${PUBLIC_CLOUDINARY_CLOUD_NAME}/${type}/upload`, {
          method: 'POST',
          body: tempFormData,
        });

        const data = await response.json();
        console.log("data secure url", data.secure_url); // URL of the uploaded file

        return data.secure_url;

      } catch (error) {
        console.error('Error uploading the video:', error);
        return null;
      }
    }

    const videoUrl = await uploadVideo(videoFile, "video");
    if (!videoUrl) {
      console.error('Failed to upload video');
      return;
    }

    const urls = [];

    for (const image of imageFiles) {
      const url = await uploadVideo(image, "image");
      urls.push(url);
    }

    // Replace the 'images' field in formData with the array of URLs
    //formData.delete('image');
    //formData.delete('recording_link');
    //urls.forEach(url => formData.append('image', url));

    // Set recording_link field in formData
   // formData.set('recording_link', videoUrl);

    let newFormData = new FormData();

    // Iterate over the entries of the original FormData
    for (let [key, value] of formData.entries()) {
      if (key !== "image" || key !== "recording_link") {
        newFormData.append(key, value);
      }
    }

    newFormData.append("recording_link", videoUrl);
    urls.forEach(url => newFormData.append('image', url));

    const response = await fetch('?/createStory', {
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

<style>
  .page { display: none; }
  .page.show { display: block; }
</style>

<form method="POST" action="?/createStory" bind:this={createStoryForm} on:submit|preventDefault={submitCreateStoryForm} enctype="multipart/form-data" class="flex flex-col gap-y-10">
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

      <Form.Field {form} hidden name="role" class="text-center">
        <Form.Control let:attrs>
          <input hidden name="role" bind:value={$formData.role} />
          <Form.FieldErrors />
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
        <Form.Field {form} name="recording_link" class="text-center">
          <Form.Control let:attrs>
            <label for="videoFile">Upload a video:</label>
            <span class="flex justify-center gap-2 inline-block pt-3">
              <input type="file" accept="video/*" on:change={handleVideoUpload} />
              <Form.FieldErrors />
              <span><Button class="p-2" on:click={() => page = 4}><ArrowRight /></Button></span>
            </span>
          </Form.Control>
        </Form.Field>
      </div>
    </div>

    <div class="page" class:show={page === 4}>
      <Form.Field {form} name="image" class="text-center">
        <Form.Control let:attrs>
          <input type="file" on:change={handleImageUpload} capture="environment" accept="image/*" />
          <input type="file" on:change={handleImageUpload} capture="environment" accept="image/*" />
        </Form.Control>
      </Form.Field>
      <div class="mt-28 text-center">
        <Button type="submit" disabled={$submitting }>
          {#if $submitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          Guardar História
        </Button>
      </div>
    </div>
</form>