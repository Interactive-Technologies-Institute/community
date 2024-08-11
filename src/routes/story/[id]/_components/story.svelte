<script lang="ts">
  import Template1 from './template_1.svelte';
  import Template2 from './template_2.svelte';
  import Template3 from './template_3.svelte';
  
  export let data;

</script>

<div class="container mx-auto space-y-2 pb-10">
  {#if data.template === 't1'}
    <Template1 data={data} />
  {:else if data.template === 't2'}
    <Template2 data={data} />
  {:else if data.template === 't3'}
    <Template3 data={data} />
  {/if}
</div>