<script lang="ts">
	import { Button } from '@/components/ui/button';
	import * as Table from '@/components/ui/table';
	import type { UpdateUserRoleSchema } from '@/schemas/user-role';
	import type { UserProfile } from '@/types/types';
	import { createRender, createTable, Render, Subscribe } from 'svelte-headless-table';
	import { addPagination } from 'svelte-headless-table/plugins';
	import { writable } from 'svelte/store';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import UsersModerationActions from './users-moderation-actions.svelte';
	import UsersModerationRoleCell from './users-moderation-role-cell.svelte';

	export let users: UserProfile[];
	export let updateUserRoleForm: SuperValidated<Infer<UpdateUserRoleSchema>>;
	let data = writable<UserProfile[]>([]);

	$: if (users) data.set(users);

	const table = createTable(data, { page: addPagination() });

	const columns = table.createColumns([
		table.column({
			accessor: 'id',
			header: 'ID',
		}),
		table.column({
			accessor: 'display_name',
			header: 'Name',
		}),
		table.column({
			accessor: 'role',
			header: 'Role',
			cell: ({ value, row }) => {
				if (row.isData()) {
					return createRender(UsersModerationRoleCell, {
						role: value,
					});
				}
				return value ?? '';
			},
		}),

		table.column({
			accessor: ({ id, role }) => ({ id, role }),
			header: '',
			cell: ({ value }) => {
				return createRender(UsersModerationActions, {
					id: value.id,
					currentRole: value.role,
					data: updateUserRoleForm,
				});
			},
		}),
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
			on:click={() => ($pageIndex = $pageIndex - 1)}
			disabled={!$hasPreviousPage}>Previous</Button
		>
		<Button
			variant="outline"
			size="sm"
			disabled={!$hasNextPage}
			on:click={() => ($pageIndex = $pageIndex + 1)}>Next</Button
		>
	</div>
</div>
