<script lang="ts">
	import PageHeader from '@/components/page-header.svelte';
	import TagFilterButton from '@/components/tag-filter-button.svelte';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { PlusCircle } from 'lucide-svelte';
	import SortButton from './../../lib/components/sort-button.svelte';
	import StoryItem from './_components/story-item.svelte';
	import { queryParam } from 'sveltekit-search-params';
	import { arrayQueryParam, stringQueryParam } from '@/utils';

	export let data;

	const search = queryParam('s', stringQueryParam(), {
		debounceHistory: 500,
	});

	const tags = queryParam('tags', arrayQueryParam());
</script>

<PageHeader title="Stories" subtitle="Read stories of our community" />
<div class="container mx-auto flex flex-row justify-between gap-x-2">
	<div class="flex flex-1 flex-row gap-x-2 sm:gap-x-4 md:flex-auto">
		<Input placeholder="Search..." class="flex-1 sm:max-w-64" bind:value={$search}></Input>
		<TagFilterButton tags={data.tags} bind:filterValues={$tags} />
		<!-- <SortButton />-->
	</div>
	{#if data.permission}
		<Button href="/story/create" class="w-10 p-0 sm:w-auto sm:px-4 sm:py-2">
			<PlusCircle class="h-4 w-4 sm:mr-2" />
			<span class="sr-only sm:not-sr-only">Create Story</span>
		</Button>
	{/if}
</div>
<div
	class="container mx-auto grid grid-cols-1 gap-6 py-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
>
	{#each data.stories as story}
		<StoryItem {story} />
	{/each}
</div>
