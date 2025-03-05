<script lang="ts">
	import PageHeader from '@/components/page-header.svelte';
	import TagFilterButton from '@/components/tag-filter-button.svelte';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { arrayQueryParam, stringQueryParam } from '@/utils';
	import { PlusCircle } from 'lucide-svelte';
	import { MetaTags } from 'svelte-meta-tags';
	import { queryParam } from 'sveltekit-search-params';
	import GuideItem from './_components/guide-item.svelte';
	import SortButton from '@/components/sort-button.svelte';

	export let data;

	const search = queryParam('s', stringQueryParam(), {
		debounceHistory: 500,
	});
	const tags = queryParam('tags', arrayQueryParam());
	const sortBy = queryParam('sortBy', stringQueryParam());
	const sortOrder = queryParam('sortOrder', stringQueryParam());
</script>

<MetaTags title="Guides" description="Learn & share guides" />

<PageHeader title="Guides" subtitle="Learn & share guides" />
<div class="container mx-auto flex flex-row justify-between gap-x-2">
	<div class="flex flex-1 flex-row gap-x-2 sm:gap-x-4 md:flex-auto">
		<Input placeholder="Search..." class="flex-1 sm:max-w-64" bind:value={$search}></Input>
		<TagFilterButton tags={data.tags} bind:filterValues={$tags} />
		<SortButton bind:sortBy={$sortBy} bind:sortOrder={$sortOrder}/>
	</div>
	<Button href="/guides/create" class="w-10 p-0 sm:w-auto sm:px-4 sm:py-2">
		<PlusCircle class="h-4 w-4 sm:mr-2" />
		<span class="sr-only sm:not-sr-only">Create Guide</span>
	</Button>
</div>
<div class="container mx-auto grid grid-cols-1 gap-6 py-10 md:grid-cols-2 lg:grid-cols-3">
	{#each data.guides as guide}
		<GuideItem {guide} usefulCount={data.usefulCount} />
	{/each}
</div>
