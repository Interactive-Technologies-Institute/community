<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let altImg = 'Taking notes';
</script>

<svelte:head>
	<title>Criar história</title>
	<meta name="description" content="Choose whose story to collect" />
</svelte:head>

<div class="container mx-auto space-y-10 pb-10">
	<div>
		<img class="mx-auto" src="/app_images/taking_notes.png" alt={altImg} width={280} />
		<h2 class="pb-2 text-center text-3xl font-semibold tracking-tight transition-colors">
			Escolha de quem você gostaria de escutar uma história hoje.
		</h2>
		<span class="flex justify-center gap-2 pb-3 pt-3">
			<span><Button class="p-10" href="/story/create/community-stories">Comunidade</Button></span>
			<span><Button class="p-10" href="/story/create/technician-stories">Técnico</Button></span>
		</span>
	</div>
</div>
