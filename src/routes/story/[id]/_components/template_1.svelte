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

{#each data.pub_story_text as p}
	<p class="text-justify">
		{p}
	</p>
{/each}
