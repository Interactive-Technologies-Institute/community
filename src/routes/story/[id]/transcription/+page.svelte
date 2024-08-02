<script lang="ts">
	import ModerationBanner from '@/components/moderation-banner.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import { Button } from '@/components/ui/button';
	import * as Card from "$lib/components/ui/card";
	import { BarChart2, CircleUser, Clock, Footprints, Pen, Tag, Trash } from 'lucide-svelte';
	import { ArrowLeft, ArrowDownUp } from 'lucide-svelte';
	/* 	import UsefulButton from './_components/useful-button.svelte'; */

	export let data;

</script>

<PageHeader title={"Transcrição"} subtitle="" />
<div class="container mx-auto space-y-10 pb-10">
  <p>{data.story.transcription}</p>

	<div
		class="sticky bottom-0 flex w-full flex-row items-center justify-center gap-x-10 border-t bg-background/95 py-8 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	>
		<Button variant="outline" href="/story/{data.story.id}">
			Voltar
		</Button>
	</div>
</div>