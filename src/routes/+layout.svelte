<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import '../lib/i18n/index.js'; // Initialize i18n
	import { waitForLocale } from '../lib/i18n/index.js';
	import { onMount } from 'svelte';

	let { children } = $props();
	let isLocaleReady = $state(false);

	onMount(async () => {
		// Wait for locale to be loaded before rendering
		await waitForLocale();
		isLocaleReady = true;
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#if isLocaleReady}
	{@render children()}
{:else}
	<div class="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 text-white flex items-center justify-center">
		<p class="text-blue-200">Loading...</p>
	</div>
{/if}
