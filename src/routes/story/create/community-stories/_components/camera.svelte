<script lang="ts">
  import { v4 as uuidv4 } from 'uuid';
  import { onMount } from 'svelte';
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Carousel from "$lib/components/ui/carousel/index.js";
  import { createEventDispatcher } from 'svelte';

  let video;
  let canvas;
  export let capturedImages = [];
  let user = { id: 'user-id-placeholder' }; // Replace with actual user ID
  let uploadUrl = '/upload'; // Your backend upload endpoint
  const dispatch = createEventDispatcher();

  onMount(() => {
    startCamera();
  });

  function startCamera() {
    // navigator.mediaDevices.getUserMedia({ video: true})
    // for mobile
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } })
      .then(stream => {
        video.srcObject = stream;
        video.play();
      })
      .catch(err => {
        console.error("Error accessing camera: ", err);
      });
  }

  function captureImage() {
    if (capturedImages.length < 3) {
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        const file = new File([blob], `${uuidv4()}.png`, { type: 'image/png' });
        capturedImages = [...capturedImages, file];
        dispatch('imagesCaptured', { images: capturedImages });
      }, 'image/png');
    }
  }

  function resetImages() {
    capturedImages = [];
    dispatch('imagesCaptured', { images: capturedImages });
  }
</script>

<style>
  video, canvas {
    display: block;
    margin: 0 auto;
  }
  .captured-images img {
    width: 100px;
    height: 100px;
    margin: 5px;
  }
</style>

<div>
  <video bind:this={video} width="600" height="600"></video>
  <div class="mt-4 text-center">
    <Button on:click={captureImage}>Capturar Imagem</Button>
    <Button on:click={resetImages}>Tentar novamente</Button>
  </div>
</div>

<canvas bind:this={canvas} width="300" height="300" style="display:none;"></canvas>

{#if capturedImages.length }
  <div class="mx-auto mt-6 w-[280px] h-[150px] px-4">
    <Carousel.Root>
      <Carousel.Content>
        {#each capturedImages as image, index}
          <Carousel.Item class="w-full">
            <div class="text-center p-2">
              <img src={URL.createObjectURL(image)} alt="Captured image">
            </div>
          </Carousel.Item>
        {/each}
      </Carousel.Content>
      <Carousel.Previous />
      <Carousel.Next />
    </Carousel.Root>
  </div>
{/if}