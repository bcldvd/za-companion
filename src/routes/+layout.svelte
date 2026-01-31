<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import '../lib/i18n/index.js'; // Initialize i18n
	import { waitForLocale } from '../lib/i18n/index.js';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/state';
	import LanguageToggle from '$lib/components/LanguageToggle.svelte';

	let { children } = $props();
	let isLocaleReady = $state(false);

	// Determine active tab based on current route
	let isBoxActive = $derived(page.url.pathname.startsWith('/box'));
	let isHyperspaceActive = $derived(page.url.pathname.startsWith('/hyperspace'));
	let isMapActive = $derived(page.url.pathname.startsWith('/map'));
	let isPerfectActive = $derived(page.url.pathname.startsWith('/perfect'));

	onMount(async () => {
		// Wait for locale to be loaded before rendering
		await waitForLocale();
		isLocaleReady = true;
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#if isLocaleReady}
	<div class="min-h-screen h-screen bg-gradient-to-b from-blue-900 to-blue-950 text-white flex flex-col">
		<!-- Sticky Header -->
		<header
			class="safe-area-inset-top sticky top-0 z-50 bg-blue-900/95 backdrop-blur-sm border-b border-blue-700"
		>
			<div class="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<img src="/icons/icon-192.png" alt="ZA Companion" class="w-8 h-8" />
					<h1 class="text-xl font-bold">ZA Companion</h1>
				</div>
				<div>
					<LanguageToggle />
				</div>
			</div>
		</header>

		<!-- Main Content Area (Scrollable) -->
		<main class="flex-1 min-h-0 overflow-y-auto pb-20">
			{@render children()}
		</main>

		<!-- Bottom Navigation -->
		<nav class="fixed bottom-0 left-0 right-0 z-50 bg-blue-900/95 backdrop-blur-sm border-t border-blue-700 safe-area-inset-bottom">
			<div class="max-w-2xl mx-auto grid grid-cols-4">
				<a
					href="/box"
					class="flex flex-col items-center justify-center py-3 px-2 transition-colors {isBoxActive
						? 'text-yellow-300 bg-blue-800/50'
						: 'text-blue-300 hover:text-white hover:bg-blue-800/30'}"
					aria-current={isBoxActive ? 'page' : undefined}
				>
					<svg
						class="w-6 h-6 mb-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
						/>
					</svg>
					<span class="text-xs font-medium">{$_('nav.box')}</span>
				</a>
				<a
					href="/map"
					class="flex flex-col items-center justify-center py-3 px-2 transition-colors {isMapActive
						? 'text-yellow-300 bg-blue-800/50'
						: 'text-blue-300 hover:text-white hover:bg-blue-800/30'}"
					aria-current={isMapActive ? 'page' : undefined}
				>
					<svg
						class="w-6 h-6 mb-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
						/>
					</svg>
					<span class="text-xs font-medium">{$_('nav.map')}</span>
				</a>
				<a
					href="/perfect"
					class="flex flex-col items-center justify-center py-3 px-2 transition-colors {isPerfectActive
						? 'text-yellow-300 bg-blue-800/50'
						: 'text-blue-300 hover:text-white hover:bg-blue-800/30'}"
					aria-current={isPerfectActive ? 'page' : undefined}
				>
					<svg
						class="w-6 h-6 mb-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
					<span class="text-xs font-medium">{$_('nav.perfect')}</span>
				</a>
				<a
					href="/hyperspace"
					class="flex flex-col items-center justify-center py-3 px-2 transition-colors {isHyperspaceActive
						? 'text-yellow-300 bg-blue-800/50'
						: 'text-blue-300 hover:text-white hover:bg-blue-800/30'}"
					aria-current={isHyperspaceActive ? 'page' : undefined}
				>
					<svg
						class="w-6 h-6 mb-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
					<span class="text-xs font-medium">{$_('nav.shiny')}</span>
				</a>
			</div>
		</nav>
	</div>
{:else}
	<div class="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 text-white flex items-center justify-center">
		<p class="text-blue-200">Loading...</p>
	</div>
{/if}

<style>
	/* Safe area inset for devices with notches/home indicators */
	.safe-area-inset-bottom {
		padding-bottom: env(safe-area-inset-bottom, 0);
	}

	.safe-area-inset-top {
		padding-top: calc(env(safe-area-inset-top, 0px) + 0.5rem);
	}
</style>
