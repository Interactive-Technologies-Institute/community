<script lang="ts">
  export let data;
</script>
  
<div class="w-full lg:float-left md:float-left sm:max-w-sm md:max-w-md lg:max-w-xs lg:mr-4 mb-4 lg:mb-0 flex-shrink-0">
  <img src={data.pub_selected_images[0]} alt={"Fotografia de " + data.storyteller} class="w-full h-auto object-cover rounded-lg" />
</div>
{#each data.pub_story_text as p, i (p)}
  <p class="text-justify">
    {p}
  </p>

  {#if i === (data.pub_story_text.length - 2)}
    <div class="w-full lg:w-1/2 mt-6">
      <blockquote class="p-4 border-s-4 border-gray-300 bg-gray-50 dark:border-gray-500 dark:bg-gray-800 text-xl italic font-medium leading-relaxed text-gray-900 dark:text-white">
       {data.pub_quotes[0]}
      </blockquote>
    </div>
  {/if}

  {#if i === (data.pub_story_text.length - 4)}
  <div class="pl-4 lg:float-right md:float-right  sm:max-w-sm md:max-w-md lg:max-w-xs lg:mr-4 mb-4 lg:mb-0 flex-shrink-0">
    <img src={data.pub_selected_images[1]} alt={"Fotografia de " + data.storyteller} class="w-60 h-70 object-cover rounded-lg" />
  </div>
  {/if}
{/each}
