<script lang="ts">

  import { Button } from "$lib/components/ui/button";
  import { ArrowLeft } from 'lucide-svelte'
  
  import StoryForm from "./_components/story-form.svelte";

  export let data;

</script>

<svelte:head>
	<title>Criar história</title>
	<meta name="description" content="Collect community stories" />
</svelte:head>

<div class="mx-auto mt-6">
  <div class="grid grid-cols-8 gap-2 mb-6">
    <Button class="p-2" href="/story/create"><ArrowLeft /></Button>
    <h2 class="my-auto text-xl font-semibold tracking-tight transition-colors col-span-6">
      História dos Técnicos
    </h2>
  </div>
  <div class="mx-auto mt-6 w-[350px] h-[50px] px-4">
    <StoryForm data={data.createForm}/>
  </div>
</div>

