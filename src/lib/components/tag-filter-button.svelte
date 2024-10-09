<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '@/components//ui/button';
	import * as Command from '@/components//ui/command';
	import * as Popover from '@/components//ui/popover';
	import { Check, Filter } from 'lucide-svelte';

	export let filterValues: string[] | null = [];
	export let tags: Map<string, number> = new Map();

	let open = false;

	function handleSelect(currentValue: string) {
		if (Array.isArray(filterValues) && filterValues.includes(currentValue)) {
			filterValues = filterValues.filter((v) => v !== currentValue);
		} else {
			filterValues = [...(Array.isArray(filterValues) ? filterValues : []), currentValue];
		}
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger asChild let:builder>
		<Button builders={[builder]} variant="outline" class="w-10 p-0 md:w-auto md:px-4 md:py-2">
			<div class="relative">
				<Filter class="h-4 w-4 md:mr-2"></Filter>
				{#if filterValues && filterValues.length > 0}
					<div class="absolute -right-1 -top-1 flex h-2 w-2 rounded-full bg-primary md:mr-2"></div>
				{/if}
			</div>
			<span class="sr-only md:not-sr-only">Filter by Tag</span>
		</Button>
	</Popover.Trigger>
	<Popover.Content class="mt-2 w-[200px] p-0" align="start" side="bottom">
		<Command.Root>
			<Command.Input placeholder="Filter by" />
			<Command.List>
				<Command.Empty>No tags found.</Command.Empty>
				<Command.Group>
					{#each tags as tag}
						<Command.Item
							value={tag[0]}
							onSelect={(currentValue) => {
								handleSelect(currentValue);
							}}
						>
							<div
								class={cn(
									'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
									filterValues?.includes(tag[0])
										? 'bg-primary text-primary-foreground'
										: 'opacity-50 [&_svg]:invisible'
								)}
							>
								<Check class="h-4 w-4" />
							</div>
							<span>
								{tag[0]}
							</span>
							<span class="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
								{tag[1]}
							</span>
						</Command.Item>
					{/each}
				</Command.Group>
				{#if filterValues && filterValues.length > 0}
					<Command.Separator />
					<Command.Item
						class="justify-center text-center"
						onSelect={() => {
							filterValues = [];
						}}
					>
						Clear filters
					</Command.Item>
				{/if}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
