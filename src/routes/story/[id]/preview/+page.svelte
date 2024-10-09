<script lang="ts">
	import PublishLayout from './_components/publish-layout.svelte';

	export let data;
	console.log(data);
</script>

<svelte:head>
	<title>Publicar</title>
	<meta name="description" content="Publish story" />
</svelte:head>
<div class="container mx-auto space-y-10 pb-10">
	<PublishLayout data={data.stories} user={data.userId} />
</div>
