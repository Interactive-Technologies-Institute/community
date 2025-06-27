<script lang="ts">
	import { page } from '$app/stores';
	import PageHeader from '@/components/page-header.svelte';
	import Button from '@/components/ui/button/button.svelte';
</script>

<PageHeader title="Error {$page.status}" subtitle={$page.error?.message ?? ''} />
<div class="container flex items-center justify-center">
	<Button href="/">Go to landing page.</Button>
</div>
