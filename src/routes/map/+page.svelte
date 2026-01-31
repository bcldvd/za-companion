<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { Filter } from 'lucide-svelte';
	import MapContainer from '$lib/components/map/MapContainer.svelte';
	import MapFilters from '$lib/components/map/MapFilters.svelte';
	import ShinyToggle from '$lib/components/ShinyToggle.svelte';
	import type { MapSpawnLocation, MapPOI, MapFilterState } from '$lib/map/types';
	import { loadSpawnLocations, loadPOIs, loadFilterState } from '$lib/map/mapData';
	import { filterSpawnsByPokemon } from '$lib/map/pokemonFilters';

	let isShiny = $state(false);
	let spawns = $state<MapSpawnLocation[]>([]);
	let pois = $state<MapPOI[]>([]);
	let filterState = $state<MapFilterState>(loadFilterState());
	let isLoading = $state(true);
	let showFilters = $state(false);

	// Calculate visible spawn count based on filters
	let visibleSpawnCount = $derived(
		filterState.pokemonSpawns
			? filterSpawnsByPokemon(spawns, filterState.selectedPokemon).length
			: 0
	);
	let activeFilterCount = $derived(
		[
			filterState.pokemonSpawns,
			filterState.benches,
			filterState.alphas,
			filterState.ladders,
			filterState.selectedPokemon.length > 0
		].filter(Boolean).length
	);

	// Load shiny state from localStorage
	onMount(() => {
		if (typeof window !== 'undefined') {
			const storedShiny = localStorage.getItem('pokemon-legends-za-shiny');
			if (storedShiny === 'true') {
				isShiny = true;
			}
		}

		loadMapData();
	});

	async function loadMapData() {
		isLoading = true;
		// #region agent log
		fetch('http://127.0.0.1:7249/ingest/6db62e92-df2d-4211-b8d7-02d65778a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/routes/map/+page.svelte:loadMapData',message:'loadMapData start',data:{isLoading,spawnsCount:spawns.length,poisCount:pois.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
		// #endregion agent log
		try {
			const [spawnData, poiData] = await Promise.all([
				loadSpawnLocations(),
				loadPOIs()
			]);
			spawns = spawnData;
			pois = poiData;
			// #region agent log
			fetch('http://127.0.0.1:7249/ingest/6db62e92-df2d-4211-b8d7-02d65778a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/routes/map/+page.svelte:loadMapData',message:'loadMapData success',data:{spawnsCount:spawns.length,poisCount:pois.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
			// #endregion agent log
		} catch (error) {
			console.error('Failed to load map data:', error);
			// #region agent log
			fetch('http://127.0.0.1:7249/ingest/6db62e92-df2d-4211-b8d7-02d65778a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/routes/map/+page.svelte:loadMapData',message:'loadMapData error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
			// #endregion agent log
		} finally {
			isLoading = false;
			// #region agent log
			fetch('http://127.0.0.1:7249/ingest/6db62e92-df2d-4211-b8d7-02d65778a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/routes/map/+page.svelte:loadMapData',message:'loadMapData end',data:{isLoading,spawnsCount:spawns.length,poisCount:pois.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'})}).catch(()=>{});
			// #endregion agent log
		}
	}

	function toggleFilters() {
		showFilters = !showFilters;
	}

</script>

<svelte:head>
	<title>{$_('map.title')} - Pokemon Legends ZA</title>
</svelte:head>

<div class="flex flex-col h-full min-h-0">
	<!-- Top Controls -->
	<div class="app-surface backdrop-blur-sm border-b app-border px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-10">
		<div class="flex items-center gap-3">
			<ShinyToggle bind:isShiny />

			<button
				onclick={toggleFilters}
				class="relative flex items-center justify-center gap-2 h-11 px-4 rounded-lg border app-button transition-colors min-h-[44px] touch-manipulation"
				aria-label={$_('map.filters.title')}
			>
				<Filter class="w-5 h-5" />
				<span class="text-sm font-medium hidden sm:inline">Filters</span>
		{#if activeFilterCount > 0}
			<span
				class="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white shadow-sm"
				aria-label={`${activeFilterCount} filters selected`}
			>
				{activeFilterCount}
			</span>
		{/if}
			</button>
		</div>

		{#if !isLoading && filterState.pokemonSpawns}
			<div class="flex items-center gap-2 px-3 py-2 rounded-lg border app-card-muted">
				<span class="text-xs app-text-muted">{visibleSpawnCount} {$_('map.spawns')}</span>
			</div>
		{/if}
	</div>

	<!-- Map Container -->
	<div class="flex-1 min-h-0 relative">
		{#if isLoading}
			<div class="absolute inset-0 flex items-center justify-center app-shell">
				<div class="text-center">
					<div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--app-accent)] border-t-transparent mb-4"></div>
					<p class="app-text-muted">{$_('map.loading')}</p>
				</div>
			</div>
		{:else}
			<MapContainer {spawns} {pois} {filterState} {isShiny} />
		{/if}
	</div>
</div>

<!-- Filter Modal -->
{#if showFilters}
	<MapFilters bind:filterState onClose={toggleFilters} />
{/if}
