<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import '../lib/i18n/index.js'; // Initialize i18n
	import { waitForLocale } from '../lib/i18n/index.js';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/state';
	import { iconViewBox, sidebarModules } from '$lib/features/navigation/modules';

	let { children } = $props();
	let isLocaleReady = $state(false);

	let isSidebarOpen = $state(false);
	let activePath = $derived(page.url.pathname);

	const isActiveRoute = (href: string) => {
		if (href === '/') {
			return activePath === '/';
		}

		return activePath.startsWith(href);
	};

	const activeModule = $derived(
		sidebarModules.find((module) => isActiveRoute(module.href)) ?? null
	);

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
			<div class="px-4 py-3 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<img
						src="/icons/icon-192.png"
						alt={$_('app.companionTitle')}
						class="w-8 h-8"
					/>
					<h1 class="text-xl font-bold">{$_('app.companionTitle')}</h1>
					{#if activeModule}
						<span
							class="ml-1 inline-flex items-center rounded-full border border-blue-700 bg-blue-800/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100"
						>
							{$_(activeModule.labelKey)}
						</span>
					{/if}
				</div>
				<button
					class="md:hidden flex min-h-[44px] touch-manipulation items-center justify-center rounded-lg border border-blue-700 bg-blue-800/50 px-3 py-2 text-white transition-colors hover:bg-blue-700"
					aria-label="Toggle navigation"
					aria-expanded={isSidebarOpen}
					onclick={() => (isSidebarOpen = !isSidebarOpen)}
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
			</div>
		</header>

		<div class="flex-1 min-h-0 flex">
			<!-- Sidebar (Desktop) -->
			<aside
				class="hidden md:flex md:w-64 md:flex-col border-r border-blue-700 bg-blue-900/95 backdrop-blur-sm"
			>
				<nav class="flex-1 px-3 py-4 space-y-1">
					{#each sidebarModules as module}
						<a
							href={module.href}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActiveRoute(
								module.href
							)
								? 'text-yellow-300 bg-blue-800/50'
								: 'text-blue-200 hover:text-white hover:bg-blue-800/30'}"
							aria-current={isActiveRoute(module.href) ? 'page' : undefined}
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={iconViewBox}>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d={module.iconPath}
								/>
							</svg>
							<span>{$_(module.labelKey)}</span>
						</a>
					{/each}
				</nav>
			</aside>

			<!-- Main Content Area (Scrollable) -->
			<main class="flex-1 min-h-0 overflow-y-auto">
				{@render children()}
			</main>
		</div>

		<!-- Mobile Drawer -->
		{#if isSidebarOpen}
			<div class="md:hidden fixed inset-0 z-[2000]">
				<button
					class="absolute inset-0 bg-black/50"
					aria-label="Close navigation"
					onclick={() => (isSidebarOpen = false)}
				></button>
				<aside
					class="absolute right-0 top-0 bottom-0 w-64 bg-blue-900/95 border-l border-blue-700 backdrop-blur-sm safe-area-inset-top safe-area-inset-bottom z-[2001]"
				>
					<nav class="flex-1 px-3 py-4 space-y-1">
						{#each sidebarModules as module}
							<a
								href={module.href}
								class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActiveRoute(
									module.href
								)
									? 'text-yellow-300 bg-blue-800/50'
									: 'text-blue-200 hover:text-white hover:bg-blue-800/30'}"
								aria-current={isActiveRoute(module.href) ? 'page' : undefined}
								onclick={() => (isSidebarOpen = false)}
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={iconViewBox}>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={module.iconPath}
									/>
								</svg>
								<span>{$_(module.labelKey)}</span>
							</a>
						{/each}
					</nav>
				</aside>
			</div>
		{/if}
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
