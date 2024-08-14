<script lang="ts">
  export let data;
  </script>
  
  <div class="container mx-auto space-y-10 pb-10">
    <div class="w-full lg:float-left md:float-left  sm:max-w-sm md:max-w-md lg:max-w-xs lg:mr-4 mb-4 lg:mb-0 flex-shrink-0">
      <img src={data.pub_selected_images[0]} alt={"Fotografia de " + data.storyteller} class="w-full h-auto object-cover rounded-lg" />
    </div>

    <div class="w-2/3 flex justify-right mt-6">
      <blockquote class="p-2 border-s-4 border-gray-300 bg-gray-50 dark:border-gray-500 dark:bg-gray-800 text-xl italic font-medium leading-relaxed text-gray-900 dark:text-white">
        {data.pub_quotes[0]}
      </blockquote>
    </div>

    <div>
      {#each data.pub_story_text as element, i (element)}
        <p class="text-justify pt-2">
          {element}
        </p>
      {/each}
    </div>

  </div>