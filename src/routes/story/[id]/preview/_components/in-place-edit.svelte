<script>
	// @ts-nocheck

	import { createEventDispatcher, onMount } from 'svelte';

	export let value,
		required = true;

	const dispatch = createEventDispatcher();
	let editing = false,
		original;

	onMount(() => {
		original = value;
	});

	function edit() {
		editing = true;
	}

	function submit() {
		if (value != original) {
			dispatch('submit', value);
		}

		editing = false;
	}

	function keydown(event) {
		if (event.key == 'Escape') {
			event.preventDefault();
			value = original;
			editing = false;
		}
	}

	function focus(element) {
		element.focus();
	}
</script>

{#if editing}
	<form on:submit|preventDefault={submit} on:keydown={keydown}>
		<textarea class="h-40 w-full" bind:value on:blur={submit} {required} use:focus />
	</form>
{:else}
	<div on:click={edit}>
		{value}
	</div>
{/if}

<style>
	textarea {
		border: none;
		background: none;
		font-size: inherit;
		color: inherit;
		font-weight: inherit;
		text-align: inherit;
		box-shadow: none;
	}
</style>
