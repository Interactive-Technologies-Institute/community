<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { toggleGuideBookmarkSchema, type ToggleGuideBookmarkSchema } from '@/schemas/guide';
	import { cn } from '@/utils';
	import { Bookmark } from 'lucide-svelte';
	import { tick } from 'svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	export let data: SuperValidated<Infer<ToggleGuideBookmarkSchema>>;

	const form = superForm(data, {
		validators: zodClient(toggleGuideBookmarkSchema),
		invalidateAll: 'force',
		onUpdate: ({ result }) => {
			if (result.type === 'failure') {
				$formData.value = !$formData.value;
			}
		},
	});

	const { form: formData, enhance, submit } = form;

	async function toggleBookmark() {
		$formData.value = !$formData.value;
		await tick();
		submit();
	}
</script>

<form method="POST" action="?/toggleBookmark" use:enhance>
	<input type="hidden" name="value" value={$formData.value} />
	<Button type="button" on:click={toggleBookmark} variant="outline" size="sm">
		<Bookmark class={cn('mr-2 h-4 w-4', { 'fill-foreground': $formData.value })} />
		{#if $formData.value}
			Bookmarked this guide
		{:else}
			Bookmark this guide
		{/if}
	</Button>
</form>