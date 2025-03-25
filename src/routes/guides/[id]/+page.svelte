<script lang="ts">
	import InteractableImage from '@/components/interactable-image.svelte';
	import ModerationBanner from '@/components/moderation-banner.svelte';
	import PageHeader from '@/components/page-header.svelte';
	import { Button } from '@/components/ui/button';
	import Card from '@/components/ui/card/card.svelte';
	import dayjs from 'dayjs';
	import { ChartNoAxesColumn, Clock, Footprints, Pen, Tag, Trash } from 'lucide-svelte';
	import { MetaTags } from 'svelte-meta-tags';
	import GuideDeleteDialog from './_components/guide-delete-dialog.svelte';
	import UsefulButton from './_components/useful-button.svelte';
	import BookmarkButton from './_components/bookmark-button.svelte';

	export let data;

	let openDeleteDialog = false;
</script>

<MetaTags
	title={data.guide.title}
	description={data.guide.description}
	openGraph={{
		title: data.guide.title,
		description: data.guide.description,
		images: [{ url: data.guide.image }],
	}}
	twitter={{
		cardType: 'summary_large_image',
		title: data.guide.title,
		description: data.guide.description,
		image: data.guide.image,
	}}
/>

<PageHeader title={data.guide.title} subtitle={data.guide.description} />
<div class="container mx-auto space-y-10 pb-10">
	{#if data.moderation[0].status !== 'approved'}
		<ModerationBanner moderation={data.moderation} />
	{/if}
	<div class="flex flex-col items-center gap-y-4">
		<div class="flex flex-row items-center justify-center gap-x-4">
			<div class="flex flex-row items-center gap-x-2">
				<Footprints class="text-muted-foreground" />
				{data.guide.steps.length}
			</div>
			<div class="flex flex-row items-center gap-x-2">
				<Clock class="text-muted-foreground" />
				{data.guide.duration}
			</div>
			<div class="flex flex-row items-center gap-x-2">
				<ChartNoAxesColumn class="text-muted-foreground" />
				{data.guide.difficulty}
			</div>
		</div>
		<div class="flex flex-row items-center justify-center gap-x-4">
			<UsefulButton count={data.usefulCount} data={data.toggleUsefulForm} />
			<BookmarkButton data={data.toggleBookmarkForm} />
		</div>
	</div>
	<div class="mx-auto flex max-w-2xl flex-col gap-y-4">
		<InteractableImage
			src={data.guide.image}
			alt="Guide Cover"
			class="aspect-[3/2] h-auto w-full rounded-md object-cover"
		/>
		<p>{data.guide.description}</p>
		<div class=" flex flex-wrap gap-2">
			{#each data.guide.tags as tag}
				<Button variant="secondary" size="sm" href="/guides?tags={tag}">
					<Tag class="mr-2 h-4 w-4" />
					{tag}
				</Button>
			{/each}
		</div>
	</div>
	<div class="flex flex-col gap-y-10">
		{#each data.guide.steps as step, i}
			<div class="flex flex-row gap-x-6">
				<Card class="hidden h-fit w-32 items-center justify-center py-4 md:flex">
					<span class="text-2xl font-medium">{i + 1}</span>
				</Card>
				<Card class="grid w-full grid-cols-1 overflow-hidden lg:grid-cols-2">
					<div class="px-6 py-5">
						<h2 class="mb-2 text-2xl font-medium">
							<span class="md:hidden">{i + 1}. </span>
							{step.title}
						</h2>
						<p>{step.description}</p>
					</div>
					<InteractableImage
						src={step.image}
						alt="Step {i + 1}"
						class="aspect-[3/2] h-auto w-full object-cover"
					/>
				</Card>
			</div>
		{/each}
	</div>
	<div class="flex flex-col items-center">
		<p class="text-xs text-muted-foreground">
			Published {dayjs(data.guide.inserted_at).fromNow()}
			{#if data.guide.inserted_at !== data.guide.updated_at}
				• Updated {dayjs(data.guide.updated_at).fromNow()}
			{/if}
		</p>
		<Button variant="link" size="sm" href="/users/{data.guide.author.id}">
			by
			{data.guide.author.display_name}
		</Button>
	</div>
	{#if data.guide.user_id === data.user?.id}
		<div
			class="sticky bottom-0 flex w-full flex-row items-center justify-center gap-x-10 border-t bg-background/95 py-8 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<Button variant="outline" href="/guides/{data.guide.id}/edit">
				<Pen class="mr-2 h-4 w-4" />
				Edit
			</Button>
			<Button variant="destructive" on:click={() => (openDeleteDialog = true)}>
				<Trash class="mr-2 h-4 w-4" />
				Delete
			</Button>
		</div>
	{/if}
</div>

<GuideDeleteDialog guideId={data.guide.id} data={data.deleteForm} bind:open={openDeleteDialog} />
