<script lang="ts">
	import { AspectRatio } from '@/components/ui/aspect-ratio';
	import { Badge } from '@/components/ui/badge';
	import { Card } from '@/components/ui/card';
	import type { Story } from '@/types/types';

	export let story: Story;

	$: imageUrl = story.image[0];

	const moderationStatusLabels = {
		pending: 'Pending',
		approved: 'Approved',
		changes_requested: 'Changes Requested',
		rejected: 'Rejected',
	};
</script>

<a href="/story/{story.id}">
	<Card class="overflow-hidden">
		<AspectRatio ratio={4 / 3}>
			{#if imageUrl}
				<img src={imageUrl} alt="Story Cover" class="h-full w-full object-cover" />
				{#if story.moderation_status !== 'approved'}
					<Badge
						class="absolute right-2 top-2"
						variant={story.moderation_status === 'rejected' ? 'destructive' : 'secondary'}
					>
						{moderationStatusLabels[story.moderation_status]}
					</Badge>
				{/if}
			{/if}
		</AspectRatio>
		<div class=" flex flex-col px-4 py-2">
			<div class="mb-5">
				<h2 class="text-lg font-medium">{story.storyteller}</h2>
				<h2 class="text-md font-medium">
					{story.role === 'technician' ? 'Técnico' : 'Membro da Comunidade'}
				</h2>
			</div>
			<div class="flex gap-x-1">
				{#each story.tags as tag}
					<span>#{tag}</span>
				{/each}
			</div>
		</div>
	</Card>
</a>
