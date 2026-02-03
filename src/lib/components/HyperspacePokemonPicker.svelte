<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import type { Pokemon } from '$lib/types/pokemon.js';
	import { loadPokedex, getLocalizedPokemonName, searchPokemonByName } from '$lib/utils/pokedex.js';
	import {
		loadHyperspaceSpawns,
		filterSpawnsByType,
		formatStarLevels,
		type HyperspaceSpawn
	} from '$lib/features/donuts/hyperspaceSpawns.js';

	interface Props {
		onSelect: (pokemon: Pokemon) => void;
		filterType?: string; // Pokemon type to filter by (e.g., "dark", "water")
	}

	let { onSelect, filterType }: Props = $props();

	let searchQuery = $state('');
	let pokedex = $state<Pokemon[] | null>(null);
	let hyperspaceSpawns = $state<HyperspaceSpawn[] | null>(null);
	let isLoading = $state(true);
	let listContainer = $state<HTMLDivElement | null>(null);

	// Virtual scrolling state
	const ITEM_HEIGHT = 64; // Height of each list item in pixels
	const BUFFER_ITEMS = 5; // Extra items to render above/below viewport
	let scrollTop = $state(0);
	let containerHeight = $state(400);

	// Create a map from national number to spawn data for fast lookup
	const spawnMap = $derived.by(() => {
		if (!hyperspaceSpawns) return new Map<number, HyperspaceSpawn>();
		const map = new Map<number, HyperspaceSpawn>();
		for (const spawn of hyperspaceSpawns) {
			map.set(spawn.nationalNumber, spawn);
		}
		return map;
	});

	// Filter Pokemon based on type and search query
	const filteredPokemon = $derived.by(() => {
		if (!pokedex || !hyperspaceSpawns) return [];

		// First, get all spawns that match the type filter
		let relevantSpawns = hyperspaceSpawns;
		if (filterType && filterType !== 'all') {
			relevantSpawns = filterSpawnsByType([filterType], hyperspaceSpawns);
		}

		// Create a set of national numbers from filtered spawns
		const relevantNationalNumbers = new Set(relevantSpawns.map((s) => s.nationalNumber));

		// Filter pokedex to only include Pokemon that are in hyperspace spawns
		let result = pokedex.filter((p) => relevantNationalNumbers.has(p.nationalNumber));

		// Apply search filter if query exists
		if (searchQuery.trim()) {
			result = searchPokemonByName(searchQuery, result);
		}

		// Sort by national number
		return result.sort((a, b) => a.nationalNumber - b.nationalNumber);
	});

	// Virtual scrolling calculations
	const totalHeight = $derived(filteredPokemon.length * ITEM_HEIGHT);
	const startIndex = $derived(Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ITEMS));
	const endIndex = $derived(
		Math.min(
			filteredPokemon.length,
			Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_ITEMS
		)
	);
	const visiblePokemon = $derived(filteredPokemon.slice(startIndex, endIndex));
	const offsetY = $derived(startIndex * ITEM_HEIGHT);

	function handleScroll(event: Event) {
		const target = event.target as HTMLDivElement;
		scrollTop = target.scrollTop;
	}

	function selectPokemon(pokemon: Pokemon) {
		onSelect(pokemon);
	}

	function getStarLevelsForPokemon(pokemon: Pokemon): number[] {
		const spawn = spawnMap.get(pokemon.nationalNumber);
		return spawn?.starLevels ?? [];
	}

	function isMainAreaPokemon(pokemon: Pokemon): boolean {
		const spawn = spawnMap.get(pokemon.nationalNumber);
		return spawn?.isMainArea ?? false;
	}

	onMount(async () => {
		try {
			const [loadedPokedex, loadedSpawns] = await Promise.all([
				loadPokedex(),
				loadHyperspaceSpawns()
			]);
			pokedex = loadedPokedex;
			hyperspaceSpawns = loadedSpawns;
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			isLoading = false;
		}
	});

	// Update container height on resize
	$effect(() => {
		if (!listContainer) return;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				containerHeight = entry.contentRect.height;
			}
		});
		observer.observe(listContainer);
		return () => observer.disconnect();
	});
</script>

<div class="space-y-3">
	<input
		type="text"
		class="w-full rounded-md border app-border app-surface px-3 py-2 text-sm"
		placeholder={$_('donuts.reservationModal.searchPlaceholder')}
		bind:value={searchQuery}
	/>

	{#if isLoading}
		<p class="text-sm app-text-muted">{$_('donuts.reservationModal.loading')}</p>
	{:else if filteredPokemon.length === 0}
		<p class="text-sm app-text-muted">
			{#if searchQuery.trim()}
				{$_('donuts.reservationModal.noResults', { values: { query: searchQuery } })}
			{:else}
				{$_('donuts.reservationModal.noPokemonForType')}
			{/if}
		</p>
	{:else}
		<div class="text-xs app-text-muted mb-1">
			{$_('donuts.reservationModal.pokemonCount', { values: { count: filteredPokemon.length } })}
		</div>
		<div
			bind:this={listContainer}
			class="max-h-80 overflow-y-auto rounded-md border app-border"
			onscroll={handleScroll}
		>
			<div style="height: {totalHeight}px; position: relative;">
				<div style="transform: translateY({offsetY}px);">
					{#each visiblePokemon as pokemon (pokemon.nationalNumber)}
						{@const starLevels = getStarLevelsForPokemon(pokemon)}
						{@const isMainArea = isMainAreaPokemon(pokemon)}
						<button
							type="button"
							class="w-full px-4 py-2 flex items-center gap-3 hover:bg-(--app-surface-strong) active:bg-(--app-surface-muted) transition-colors text-left border-b app-border last:border-b-0 touch-manipulation"
							style="height: {ITEM_HEIGHT}px;"
							onclick={() => selectPokemon(pokemon)}
						>
							<img
								src={pokemon.imageUrl}
								alt=""
								class="h-10 w-10 object-contain shrink-0"
								loading="lazy"
							/>
							<div class="flex-1 min-w-0">
								<div class="font-semibold truncate">{getLocalizedPokemonName(pokemon)}</div>
								<div class="text-xs app-text-muted">
									#{pokemon.nationalNumber}
								</div>
							</div>
							{#if starLevels.length > 0}
								<div class="shrink-0 flex items-center gap-1">
									{#if isMainArea}
										<span class="text-xs font-medium text-amber-500" title={$_('donuts.starLevels.mainArea')}>
											{$_('donuts.starLevels.legendary')}
										</span>
									{:else}
										<span class="text-xs app-text-muted">★</span>
										<span class="text-xs font-medium">{formatStarLevels(starLevels)}</span>
									{/if}
								</div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
