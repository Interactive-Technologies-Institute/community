<script lang="ts">
	import type { UserRole } from '@/types/types';
	import { typeMap } from './users-moderation-role-map';

	export let role: UserRole;

	let label: string = '';
	let icon: any = null;

	$: ({ label, icon } = typeMap[role]);
</script>

<div class="flex items-center">
	<svelte:component this={icon} class="mr-2 h-4 w-4 text-muted-foreground" />
	<span>{label}</span>
</div>
