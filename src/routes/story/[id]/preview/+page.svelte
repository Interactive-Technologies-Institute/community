<script lang="ts">
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import PublishLayout from './_components/publish-layout.svelte';
	import { previewStorySchema, type PreviewStorySchema } from '@/schemas/preview_story';

	export let data : {story: SuperValidated<Infer<PreviewStorySchema>>;}
	export let userId;
</script>

<svelte:head>
	<title>Publicar</title>
	<meta name="description" content="Publish story" />
</svelte:head>
<div class="container mx-auto space-y-10 pb-10">
	<PublishLayout data={data.story} user={userId} />
</div>
