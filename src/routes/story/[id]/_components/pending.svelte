
<script lang="ts">
	import * as Card from "$lib/components/ui/card";
  import * as Carousel from "$lib/components/ui/carousel/index.js";
	import PageHeader from "@/components/page-header.svelte";

	export let data;

</script>

{#if data.moderation_status === 'approved'}
  <PageHeader title="Mais detalhes" subtitle="" />
{/if}
<div class="flex flex-col items-center gap-y-2 w-full">
  <video src={data.recording_link} controls class="w-80 h-120 object-contain" />

  <div class="w-full max-w-xl mx-auto">
    <div class="flex justify-center pt-2">
      <Carousel.Root class="w-80 h-120">
        <Carousel.Content>
          {#each data.image as image}
            <Carousel.Item>
              <img src={image} alt={`Imagem de ${data.storyteller}`} class="w-full h-auto mx-auto max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg" />
            </Carousel.Item>
          {/each}
        </Carousel.Content>
        <Carousel.Previous />
        <Carousel.Next />
      </Carousel.Root>
    </div>
  </div>
</div>