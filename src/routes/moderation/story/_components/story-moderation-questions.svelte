<script lang="ts">
	import { Button } from '@/components/ui/button';
	import * as Table from '@/components/ui/table';
	import type { UpdateStoryQuestionsSchema } from '@/schemas/story-questions';
	import type { StoryQuestionsWithModeration } from '@/types/types';
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table';
	import { addPagination } from 'svelte-headless-table/plugins';
	import { writable } from 'svelte/store';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';

	export let storyQuestions: StoryQuestionsWithModeration;
	export let updateQuestionForm: SuperValidated<Infer<UpdateStoryQuestionsSchema>>;
	let data = writable(storyQuestions.questions.map((question, index) => ({
		question, 
		id: index + 1 // Assuming id for each question row, as the data structure does not provide individual ids for each question.
	})));

	$: data.set(storyQuestions.questions.map((question, index) => ({
		question,
		id: index + 1
	})));

	const table = createTable(data, { page: addPagination() });

	const columns = table.createColumns([
		table.column({
			accessor: 'question', // Now each question is treated as a single string
			header: 'Questions',
		})
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } =
		table.createViewModel(columns);

	const { hasNextPage, hasPreviousPage, pageIndex } = pluginStates.page;
</script>

<div>

	<div class="rounded-md border">
		<Table.Root {...$tableAttrs}>
			<Table.Header>
				{#each $headerRows as headerRow}
					<Subscribe rowAttrs={headerRow.attrs()}>
						<Table.Row>
							{#each headerRow.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
									<Table.Head {...attrs}>
										<Render of={cell.render()} />
									</Table.Head>
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Header>
			<Table.Body {...$tableBodyAttrs}>
				{#each $pageRows as row (row.id)}
					<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
						<Table.Row {...rowAttrs}>
							{#each row.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs>
									<Table.Cell {...attrs}>
										<Render of={cell.render()} />
									</Table.Cell>
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	<div class="flex items-center justify-end space-x-4 py-4">
		<Button
			variant="outline"
			size="sm"
			href={`/moderation/story/${storyQuestions.id}/edit`}>
        Editar
    </Button>
	</div>
</div>
