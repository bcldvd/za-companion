<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import '../lib/i18n/index.js'; // Initialize i18n
	import { waitForLocale } from '../lib/i18n/index.js';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/state';
	import { iconViewBox, sidebarModules } from '$lib/features/navigation/modules';
	import { initThemeMode } from '$lib/settings/theme';

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

	onMount(() => {
		const cleanupTheme = initThemeMode();
		// Wait for locale to be loaded before rendering
		waitForLocale().then(() => {
			isLocaleReady = true;
		});
		return () => {
			cleanupTheme();
		};
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#if isLocaleReady}
	<div class="min-h-screen h-screen app-shell flex flex-col">
		<!-- Sticky Header -->
		<header
			class="safe-area-inset-top sticky top-0 z-50 backdrop-blur-sm border-b app-border app-surface"
		>
			<div class="px-4 py-3 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<a href="/" class="flex items-center gap-3" aria-label={$_('nav.home')}>
						<img
							src="/icons/logo-za.png"
							alt={$_('app.companionTitle')}
							class="w-8 h-8"
						/>
						<h1 class="text-xl font-bold">{$_('app.companionTitle')}</h1>
					</a>
					{#if activeModule}
						<span
							class="ml-1 inline-flex items-center rounded-full border app-chip px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
						>
							{$_(activeModule.labelKey)}
						</span>
					{/if}
				</div>
				<button
					class="md:hidden flex min-h-[44px] touch-manipulation items-center justify-center rounded-lg border app-button px-3 py-2 transition-colors"
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
			<aside class="hidden md:flex md:w-64 md:flex-col border-r app-border app-surface backdrop-blur-sm">
				<nav class="flex-1 px-3 py-4 space-y-1">
					{#each sidebarModules as module}
						<a
							href={module.href}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActiveRoute(
								module.href
							)
								? 'app-accent-text bg-[var(--app-surface-strong)]'
								: 'app-text-muted hover:text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]'}"
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
					class="absolute inset-0 app-overlay"
					aria-label="Close navigation"
					onclick={() => (isSidebarOpen = false)}
				></button>
				<aside
					class="absolute right-0 top-0 bottom-0 w-64 app-surface border-l app-border backdrop-blur-sm safe-area-inset-top safe-area-inset-bottom z-[2001]"
				>
					<nav class="flex-1 px-3 py-4 space-y-1">
						{#each sidebarModules as module}
							<a
								href={module.href}
								class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActiveRoute(
									module.href
								)
									? 'app-accent-text bg-[var(--app-surface-strong)]'
									: 'app-text-muted hover:text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]'}"
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
	<div class="min-h-screen app-shell flex items-center justify-center">
		<p class="app-text-muted">Loading...</p>
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
