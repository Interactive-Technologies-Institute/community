<script lang="ts">
	import PageHeader from '@/components/page-header.svelte';
	import { MetaTags } from 'svelte-meta-tags';
	import BrandingForm from './_components/branding-form.svelte';
	import FeaturesForm from './_components/features-form.svelte';
	import UserTypesForm from './_components/user-types-form.svelte';

	export let data;
</script>

<MetaTags title="Admin Panel" description="Configure the platform settings" />

<PageHeader title="Admin Panel" subtitle="Configure the platform settings" />
<div class="container mb-20 flex flex-col gap-y-8 md:gap-y-10">
	<FeaturesForm data={data.updateFeatures} />
	<BrandingForm data={data.updateBranding} />
	<UserTypesForm data={data.updateUserTypes} />
</div>
