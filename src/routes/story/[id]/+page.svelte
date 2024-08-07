<script lang="ts">
	import ModerationBanner from '@/components/moderation-banner.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import { Button } from '@/components/ui/button';
	import * as Card from "$lib/components/ui/card";
	import { LayoutPanelTop, Wand, Eye, Pen, Tag, Trash } from 'lucide-svelte';
//	import StoryDeleteDialog from './_components/story-delete-dialog.svelte';

	export let data;

	let openDeleteDialog = false;
</script>

<PageHeader title={data.story.storyteller} subtitle={data.story.role === 'technician' ? 'Técnico' : 'Comunidade'} />
<div class="container mx-auto space-y-10 pb-10">
	{#if data.moderation.status !== 'approved'}
		<ModerationBanner moderation={data.moderation} />
	{/if}
	<div class="mb-10 flex flex-col items-center gap-y-4">
    <div class="flex flex-row gap-x-2">
        {#each data.story.tags as tag}
            <Button variant="secondary" size="sm" href="/user/0">
                <Tag class="mr-2 h-4 w-4" />
                {tag}
            </Button>
        {/each}
    </div>
    <div class="flex flex-col items-center gap-y-2 w-full">
			<Card.Root class="mb-4 w-full">
				<Card.Content class="flex justify-center pt-2">
						<div class="my-auto w-full max-w-screen-md">
								<h2 class="text-sm font-bold tracking-tight transition-colors">
										<video src={data.story.recording_link} controls class="w-full md:h-80 lg:h-96 xl:h-[400px] object-contain" />
								</h2>
						</div>
				</Card.Content>
			</Card.Root>
        <div class="w-full">
            <h2 class="my-auto text-sm font-semibold tracking-tight transition-colors text-justify mb-2">
                Imagens
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {#each data.story.image as image}
                    <Card.Root class="mb-4 w-full">
                        <Card.Content class="flex justify-between pt-2">
                            <div class="my-auto w-full">
                                <h2 class="text-sm font-bold tracking-tight transition-colors">
                                    <img src={image} alt={`Imagem de ${data.story.storyteller}`} class="w-full" />
                                </h2>
                            </div>
                        </Card.Content>
                    </Card.Root>
                {/each}
            </div>
        </div>
    </div>
</div>

	{#if data.story.user_id === data.user?.id}
	<div
		class="sticky bottom-0 flex w-full flex-col sm:flex-row items-center justify-center gap-y-4 sm:gap-x-10 border-t bg-background/95 py-4 sm:py-8 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	>
		{#if data.story.transcription}
				<Button href="/story/{data.story.id}/transcription" class="w-full sm:w-auto">
						<Eye class="mr-2 h-4 w-4" />
						Abrir Transcrição
				</Button>
		{:else}
				<Button href="/story/{data.story.id}/edit-transcription" class="w-full sm:w-auto">
						<Wand class="mr-2 h-4 w-4" />
						Gerar Transcrição
				</Button>
		{/if}
		{#if data.story.insights_gpt}
				<Button href="/story/{data.story.id}/insights" class="w-full sm:w-auto">
						<Eye class="mr-2 h-4 w-4" />
						Abrir Insights
				</Button>
		{:else}
				<Button href="/story/{data.story.id}/edit-insights" class="w-full sm:w-auto">
						<Wand class="mr-2 h-4 w-4" />
						Gerar Insights
				</Button>
		{/if}
		<Button href="/story/{data.story.id}/preview" class="w-full sm:w-auto">
				<LayoutPanelTop class="mr-2 h-4 w-4" />
				Pré-visualizar história
		</Button>
		<Button variant="destructive" on:click={() => (openDeleteDialog = true)} class="w-full sm:w-auto">
				<Trash class="mr-2 h-4 w-4" />
				Excluir
		</Button>
	</div>
	{/if}
</div>

<!-- <StoryDeleteDialog storyId={data.story.id} data={data.deleteForm} bind:open={openDeleteDialog} /> -->
