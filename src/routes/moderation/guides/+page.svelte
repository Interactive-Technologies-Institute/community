<script lang="ts">
	import TagFilterButton from '@/components/tag-filter-button.svelte';
	import { Input } from '@/components/ui/input';
	import * as Tabs from '@/components/ui/tabs';
	import { arrayQueryParam, stringQueryParam } from '@/utils';
	import { queryParam } from 'sveltekit-search-params';
	import GuidesModerationTable from './_components/guides-moderation-table.svelte';

	export let data;

	const search = queryParam('s', stringQueryParam(), {
		debounceHistory: 500,
	});
	const tags = queryParam('tags', arrayQueryParam());
</script>

<Tabs.Content value="guides" class="mt-8 flex flex-col gap-y-4">
	<div class="flex flex-1 flex-row gap-x-2 sm:gap-x-4 md:flex-auto">
		<Input placeholder="Search..." class="flex-1 sm:max-w-64" bind:value={$search}></Input>
		<TagFilterButton tags={data.tags} bind:filterValues={$tags} />
	</div>
	<GuidesModerationTable guides={data.guides} updateModerationForm={data.updateModerationForm} />
</Tabs.Content>
