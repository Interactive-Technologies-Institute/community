<script lang="ts">
	export let data;
</script>

<div class="container mx-auto space-y-10 pb-10">
	<div
		class="mb-4 w-full flex-shrink-0 sm:max-w-sm md:float-left md:max-w-md lg:float-left lg:mb-0 lg:mr-4 lg:max-w-xs"
	>
		<img
			src={data.pub_selected_images[0]}
			alt={'Fotografia de ' + data.storyteller}
			class="h-auto w-full rounded-lg object-cover"
		/>
	</div>

	<div class="justify-right mt-6 flex w-2/3">
		<blockquote
			class="border-s-4 border-gray-300 bg-gray-50 p-2 text-xl font-medium italic leading-relaxed text-gray-900 dark:border-gray-500 dark:bg-gray-800 dark:text-white"
		>
			{data.pub_quotes[0]}
		</blockquote>
	</div>

	<div>
		{#each data.pub_story_text as element (element)}
			<p class="pt-2 text-justify">
				{element}
			</p>
		{/each}
	</div>
</div>
