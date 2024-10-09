<script lang="ts">
	export let data;
</script>

<div
	class="mb-4 w-full flex-shrink-0 sm:max-w-sm md:float-left md:max-w-md lg:float-left lg:mb-0 lg:mr-4 lg:max-w-xs"
>
	<img
		src={data.pub_selected_images[0]}
		alt={'Fotografia de ' + data.storyteller}
		class="h-auto w-full rounded-lg object-cover"
	/>
</div>
{#each data.pub_story_text as p, i (p)}
	<p class="text-justify">
		{p}
	</p>

	{#if i === data.pub_story_text.length - 3}
		<div class="mt-6 w-full">
			<blockquote
				class="border-s-4 border-gray-300 bg-gray-50 p-4 text-xl font-medium italic leading-relaxed text-gray-900 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
			>
				{data.pub_quotes[0]}
			</blockquote>
		</div>
	{/if}
{/each}
