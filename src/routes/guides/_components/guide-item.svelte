<script lang="ts">
	import { page } from '$app/stores';
	import { AspectRatio } from '@/components/ui/aspect-ratio';
	import { Badge } from '@/components/ui/badge';
	import { Button } from '@/components/ui/button';
	import { Card } from '@/components/ui/card';
	import type { Guide } from '@/types/types';
	import { Tag } from 'lucide-svelte';

	export let guide: Guide;

	const moderationStatusLabels = {
		pending: 'Pending',
		approved: 'Approved',
		changes_requested: 'Changes Requested',
		rejected: 'Rejected',
	};

	$: imageUrl = $page.data.supabase.storage.from('guides').getPublicUrl(guide.image).data.publicUrl;
</script>

<a href="/guides/{guide.id}" class="h-full">
	<Card class="relative flex h-full flex-col overflow-hidden">
		<AspectRatio ratio={3 / 2}>
			{#if imageUrl}
				<img src={imageUrl} alt="Guide Cover" class="h-full w-full object-cover" />
				{#if guide.moderation_status !== 'approved'}
					<Badge
						class="absolute right-2 top-2"
						variant={guide.moderation_status === 'rejected' ? 'destructive' : 'secondary'}
					>
						{moderationStatusLabels[guide.moderation_status]}
					</Badge>
				{/if}
			{/if}
		</AspectRatio>
		<div class="flex flex-1 flex-col px-4 py-3">
			<div class="mb-5">
				<h2 class="line-clamp-2 text-lg font-medium">{guide.title}</h2>
				<p class="line-clamp-2 text-muted-foreground">{guide.description}</p>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each guide.tags as tag}
					<Button variant="secondary" size="sm" href="/guides?tags={tag}">
						<Tag class="mr-2 h-4 w-4" />
						{tag}
					</Button>
				{/each}
			</div>
		</div>
	</Card>
</a>
