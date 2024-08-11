<script lang="ts">
export let data;
</script>


  <div class="w-full lg:float-left md:float-left  sm:max-w-sm md:max-w-md lg:max-w-xs lg:mr-4 mb-4 lg:mb-0 flex-shrink-0">
    <img src={data.pub_selected_images[0]} alt={"Fotografia de " + data.storyteller} class="w-full h-auto object-cover rounded-lg" />
  </div>

  {#each data.pub_story_text as p}
  <p class="text-justify">
    {p}
  </p>
  {/each}
