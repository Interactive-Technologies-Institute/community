<script lang="ts">
	import PageHeader from '@/components/page-header.svelte';
	import { Button } from '@/components/ui/button';
	import { ArrowLeft, Pen } from 'lucide-svelte';

	export let data;
</script>

<PageHeader title={'Transcrição'} subtitle="" />
<div class="container mx-auto space-y-10 pb-10">
	{#if data.story.transcription !== ''}
		<p>{data.story.transcription}</p>
	{/if}

	<div
		class="sticky bottom-0 flex w-full flex-row items-center justify-center gap-x-10 border-t bg-background/95 py-8 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	>
		<Button variant="outline" href="/story/{data.story.id}" class="w-full sm:w-auto">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Voltar
		</Button>
		<Button href="/story/{data.story.id}/edit-transcription">
			<Pen class="mr-2 h-4 w-4" />
			Editar transcrição
		</Button>
	</div>
</div>
