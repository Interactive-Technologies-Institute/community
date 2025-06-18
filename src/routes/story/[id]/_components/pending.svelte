<script lang="ts">
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import PageHeader from '@/components/page-header.svelte';

	export let data;
</script>

{#if data.moderation_status === 'approved'}
	<PageHeader title="Mais detalhes" subtitle="" />
{/if}
<div class="flex w-full flex-col items-center gap-y-2">
	<video src={data.recording_link} controls class="h-120 w-80 object-contain" />

	<div class="mx-auto w-full max-w-xl">
		<div class="flex justify-center pt-2">
			<Carousel.Root class="h-120 w-80">
				<Carousel.Content>
					{#each data.image as image}
						<Carousel.Item>
							<img
								src={image}
								alt={`Imagem de ${data.storyteller}`}
								class="mx-auto h-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
							/>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				<Carousel.Previous />
				<Carousel.Next />
			</Carousel.Root>
		</div>
	</div>
</div>
