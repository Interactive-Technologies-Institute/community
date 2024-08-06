<script lang="ts">

  import { Button } from "$lib/components/ui/button";
  import { ArrowLeft } from 'lucide-svelte'
  import StoryForm from "./_components/story-form.svelte";
	import PageHeader from "@/components/page-header.svelte";

  export let data;

</script>

<svelte:head>
	<title>Criar história</title>
	<meta name="description" content="Collect community stories" />
</svelte:head>

<PageHeader title={"História da Comunidade"} subtitle="" />
  <div class="container mx-auto space-y-10 pb-10">
    <StoryForm data={data.createForm}/>
  </div>

