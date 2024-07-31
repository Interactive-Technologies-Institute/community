<script lang="ts">
	import ModerationBanner from '@/components/moderation-banner.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import { Button } from '@/components/ui/button';
	import * as Card from "$lib/components/ui/card";
	import { BarChart2, CircleUser, Clock, Footprints, Pen, Tag, Trash } from 'lucide-svelte';
	import StoryDeleteDialog from './_components/story-delete-dialog.svelte';
	import { ArrowLeft, ArrowDownUp } from 'lucide-svelte';
	/* 	import UsefulButton from './_components/useful-button.svelte'; */

	export let data;

	let openDeleteDialog = false;
</script>

<PageHeader title={data.story.storyteller} subtitle="" />
<div class="container mx-auto space-y-10 pb-10">
	{#if data.moderation.status !== 'approved'}
		<ModerationBanner moderation={data.moderation} />
	{/if}
	<div class="mb-10 flex flex-col items-center gap-y-4">
		<div class=" flex flex-row gap-x-2">
			{#each data.story.tags as tag}
				<Button variant="secondary" size="sm" href="/user/0">
					<Tag class="mr-2 h-4 w-4" />
					{tag}
				</Button>
			{/each}
		</div>
		<div class="grid grid-cols-8 gap-2 mb-6">
			<Button class="p-2" href="/story/view-and-publish"><ArrowLeft /></Button>
			<h2 class="my-auto text-xl font-semibold tracking-tight transition-colors col-span-5 text-justify">
				História de {data.story.storyteller}
			</h2>
			<Button variant="ghost" class="col-span-2" href=""><ArrowDownUp class="w-15 h-15" /></Button>
		</div>
		<h2 class="my-auto text-sm font-semibold tracking-tight transition-colors text-justify mb-2">
			Vídeo ou Áudio link
		</h2>
		<Card.Root class="w-[370px] h-[50px] mb-4">
			<Card.Content class="flex justify-between pt-2">
				<div class="my-auto">
					<h2 class="text-sm font-bold tracking-tight transition-colors">
						<video src={data.story.recording_link} controls />
					</h2>
				</div>
				<div>
					<Button class="w-[50px] h-[30px] text-xs">Abrir</Button>
					<Button class="w-[70px] h-[30px] text-xs">Transcrever</Button>
				</div>
			</Card.Content>
		</Card.Root>
		<h2 class="my-auto text-sm font-semibold tracking-tight transition-colors text-justify mb-2">
			Imagem
		</h2>
		{#each data.story.image as image}
			<Card.Root class="w-[370px] h-[40px] mb-4">
				<Card.Content class="flex justify-between pt-2">
					<div class="my-auto">
						<h2 class="text-sm font-bold tracking-tight transition-colors">
							<img src={image} alt={`Imagem de ${data.story.storyteller}`} />
						</h2>
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
	{#if data.story.user_id === data.user?.id}
		<div
			class="sticky bottom-0 flex w-full flex-row items-center justify-center gap-x-10 border-t bg-background/95 py-8 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<Button variant="outline" href="/story/{data.story.id}/edit">
				<Pen class="mr-2 h-4 w-4" />
				Edit Transcription
			</Button>
			<Button variant="destructive" on:click={() => (openDeleteDialog = true)}>
				<Trash class="mr-2 h-4 w-4" />
				Delete
			</Button>
		</div>
	{/if}
</div>

<!-- <StoryDeleteDialog storyId={data.story.id} data={data.deleteForm} bind:open={openDeleteDialog} /> -->
