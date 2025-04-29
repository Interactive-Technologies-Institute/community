<script lang="ts">
	import { Button } from '@/components/ui/button';
	import * as Popover from '@/components//ui/popover';
	import { ListFilter } from 'lucide-svelte';
    import { ArrowUpDown, Check } from 'lucide-svelte';
	import { cn } from '$lib/utils.js';
	import * as Command from '@/components//ui/command';
    export let sortBy : string | null;
    export let sortOrder : string | null = 'desc' ;

	let open = false;

    const sortOptions = [
        { key: 'date_updated', label: 'Date Updated' },
        { key: 'difficulty', label: 'Difficulty' },
        { key: 'duration', label: 'Duration' },
        { key: 'likes', label: 'Likes' },
    ];

    function handleSortSelect(selectedSort : string) {
        sortBy = selectedSort;
    }

    function toggleSortOrder() {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
</script>

<Popover.Root bind:open>
    <Popover.Trigger asChild let:builder>
        <Button builders={[builder]} variant="outline" class="w-10 p-0 md:w-auto md:px-4 md:py-2">
            <div class="relative flex items-center">
                <ArrowUpDown class="h-4 w-4 md:mr-2" />
            </div>
            <span class="sr-only md:not-sr-only">Sort</span>
        </Button>
    </Popover.Trigger>
    <Popover.Content class="mt-2 w-[200px] p-0" align="start" side="bottom">
        <Command.Root>
            <Command.List>
                <Command.Group>
                    {#each sortOptions as option}
                        <Command.Item
                            value={option.key}
                            onSelect={() => handleSortSelect(option.key)}
                        >
                            <div
                                class={cn(
                                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                    sortBy === option.key
                                        ? 'bg-primary text-primary-foreground'
                                        : 'opacity-50 [&_svg]:invisible'
                                )}
                            >
                                <Check class="h-4 w-4" />
                            </div>
                            <span>{option.label}</span>
                        </Command.Item>
                    {/each}
                </Command.Group>
            </Command.List>
        </Command.Root>
        <div class="border-t p-2 flex justify-between items-center">
            <span class="text-sm">Order:</span>
            <Button variant="ghost" on:click={toggleSortOrder}>
                {#if sortOrder === 'asc'}
                    Ascending
                {:else}
                    Descending
                {/if}
            </Button>
        </div>
    </Popover.Content>
</Popover.Root>