<script lang="ts">
	import { page } from '$app/stores';
	import { AspectRatio } from '@/components/ui/aspect-ratio';
	import { Card } from '@/components/ui/card';
	import type { Story } from '@/types/types';

	export let story: Story;

	$: imageUrl = story.image[0];
</script>

<a href="/story/{story.id}">
	<Card class="overflow-hidden">
		<AspectRatio ratio={4 / 3}>
			{#if imageUrl}
				<img src={imageUrl} alt="Story Cover" class="object-cover w-full h-full" />
			{/if}
		</AspectRatio>
		<div class=" flex flex-col px-4 py-2">
			<div class="mb-5">
				<h2 class="text-lg font-medium">{story.storyteller}</h2>
				<h2 class="text-md font-medium">{story.role === 'technician' ? 'Técnico' : 'Membro da Comunidade'}</h2>
			</div>
			<div class="flex gap-x-1">
				{#each story.tags as tag}
					<span>#{tag}</span>
				{/each}
			</div>
		</div>
	</Card>
</a>
