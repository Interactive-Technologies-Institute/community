<script lang="ts">
	import * as AlertDialog from '@/components/ui/alert-dialog';
	import { unpublishStorySchema, type UnpublishStorySchema } from '@/schemas/story';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	export let open = false;
	export let storyId: number;
	export let data: SuperValidated<Infer<UnpublishStorySchema>>;

	const form = superForm(data, {
		validators: zodClient(unpublishStorySchema),
	});

	const { enhance } = form;
</script>

<AlertDialog.Root bind:open>
	<form method="POST" action="?/unpublish" use:enhance>
		<input type="hidden" name="id" value={storyId} />
	</form>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Você tem certeza?</AlertDialog.Title>
			<AlertDialog.Description>
				Esta ação é reversível, mas fará com que a história não esteja disponível para o público.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancelar</AlertDialog.Cancel>
			<AlertDialog.Action on:click={form.submit}>Continuar</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
