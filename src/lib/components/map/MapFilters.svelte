<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { X } from 'lucide-svelte';
	import type { MapFilterState } from '$lib/map/types';
	import { saveFilterState } from '$lib/map/mapData';
	import {
		loadPokedex,
		searchPokemonByName,
		getLocalizedPokemonName
	} from '$lib/utils/pokedex';
	import type { Pokemon } from '$lib/types/pokemon';

	let {
		filterState = $bindable<MapFilterState>(),
		onClose
	}: {
		filterState: MapFilterState;
		onClose: () => void;
	} = $props();

	let pokemonList = $state<Pokemon[]>([]);
	let pokemonSearch = $state('');
	let pokemonOptionsLoading = $state(false);
	let selectedPokemonSet = $derived(new Set(filterState.selectedPokemon));
	let filteredPokemonList = $derived.by(() => {
		if (!pokemonSearch.trim()) return pokemonList;
		return searchPokemonByName(pokemonSearch, pokemonList);
	});

	onMount(async () => {
		pokemonOptionsLoading = true;
		try {
			pokemonList = await loadPokedex();
		} catch (error) {
			console.error('Failed to load pokedex for filters:', error);
		}
		pokemonOptionsLoading = false;
	});

	function handleFilterChange() {
		filterState = { ...filterState };
		// #region agent log
		fetch('http://127.0.0.1:7249/ingest/6db62e92-df2d-4211-b8d7-02d65778a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/components/map/MapFilters.svelte:handleFilterChange',message:'filter change',data:{pokemonSpawns:filterState.pokemonSpawns,benches:filterState.benches,alphas:filterState.alphas,ladders:filterState.ladders},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
		// #endregion agent log
		saveFilterState(filterState);
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleBackdropKeydown(e: KeyboardEvent) {
		if (e.target !== e.currentTarget) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClose();
		}
	}

	function handleEscape(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function clearPokemonSelection() {
		filterState.selectedPokemon = [];
		handleFilterChange();
	}

	function togglePokemonSelection(nationalNumber: number) {
		const next = new Set(filterState.selectedPokemon);
		if (next.has(nationalNumber)) {
			next.delete(nationalNumber);
		} else {
			next.add(nationalNumber);
		}
		filterState.selectedPokemon = Array.from(next);
		handleFilterChange();
	}
</script>

<svelte:window on:keydown={handleEscape} />

<div
	class="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="filter-modal-title"
	tabindex="0"
	onclick={handleBackdropClick}
	onkeydown={handleBackdropKeydown}
>
	<div class="rounded-xl border app-card shadow-2xl w-full max-w-md p-6">
		<div class="flex items-center justify-between mb-6">
			<h2 id="filter-modal-title" class="text-2xl font-bold">
				{$_('map.filters.title')}
			</h2>
			<button
				onclick={onClose}
				class="flex items-center justify-center w-10 h-10 rounded-lg border app-button transition-colors min-h-[44px] min-w-[44px] touch-manipulation"
				aria-label={$_('map.filters.close')}
			>
				<X class="w-6 h-6" />
			</button>
		</div>

		<div class="space-y-4">
			<!-- Pokemon Spawns -->
			<div class="space-y-3 p-3 rounded-lg border app-card-muted">
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={filterState.pokemonSpawns}
						onchange={handleFilterChange}
						class="w-5 h-5 rounded border-[var(--app-border-strong)] text-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-focus)] focus:ring-offset-2 focus:ring-offset-[var(--app-surface)]"
					/>
					<span class="font-medium flex-1">{$_('map.filters.pokemonSpawns')}</span>
				</label>

				<div class="flex items-center justify-between text-xs app-text-muted">
					<span>
						{filterState.selectedPokemon.length > 0
							? `${filterState.selectedPokemon.length} selected`
							: 'All Pokemon'}
					</span>
					<button
						type="button"
						onclick={clearPokemonSelection}
						disabled={filterState.selectedPokemon.length === 0}
						class="app-text-muted hover:text-[var(--app-text)] disabled:opacity-50 disabled:cursor-not-allowed"
					>
						All
					</button>
				</div>

				<div class={filterState.pokemonSpawns ? '' : 'opacity-50 pointer-events-none'}>
					<input
						type="search"
						placeholder="Search Pokemon"
						bind:value={pokemonSearch}
						class="w-full rounded-lg border app-input px-3 py-2 text-sm placeholder:text-[var(--app-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--app-focus)]"
					/>

					<div class="mt-3 max-h-48 overflow-y-auto pr-1 space-y-1">
						{#if pokemonOptionsLoading}
							<p class="text-xs app-text-muted">Loading Pokemon...</p>
						{:else if filteredPokemonList.length === 0}
							<p class="text-xs app-text-muted">No matches.</p>
						{:else}
							{#each filteredPokemonList as pokemon}
								<label class="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-[var(--app-surface-strong)] cursor-pointer">
									<input
										type="checkbox"
										checked={selectedPokemonSet.has(pokemon.nationalNumber)}
										onchange={() => togglePokemonSelection(pokemon.nationalNumber)}
										class="w-4 h-4 rounded border-[var(--app-border-strong)] text-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-focus)] focus:ring-offset-2 focus:ring-offset-[var(--app-surface)]"
									/>
									<span class="text-sm flex-1">
										{getLocalizedPokemonName(pokemon)}
									</span>
									<span class="text-xs app-text-muted">#{pokemon.nationalNumber}</span>
								</label>
							{/each}
						{/if}
					</div>
				</div>
			</div>

			<!-- Benches -->
			<label class="flex items-center gap-3 p-3 app-card-muted rounded-lg hover:bg-[var(--app-surface-strong)] transition-colors cursor-pointer">
				<input
					type="checkbox"
					bind:checked={filterState.benches}
					onchange={handleFilterChange}
					class="w-5 h-5 rounded border-[var(--app-border-strong)] text-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-focus)] focus:ring-offset-2 focus:ring-offset-[var(--app-surface)]"
				/>
				<div class="flex items-center gap-2 flex-1">
					<img
						src="/icons/bench.png"
						alt=""
						class="h-4 w-4 object-contain"
						aria-hidden="true"
					/>
					<span class="font-medium">{$_('map.filters.benches')}</span>
				</div>
			</label>

			<!-- Guaranteed Alphas -->
			<label class="flex items-center gap-3 p-3 app-card-muted rounded-lg hover:bg-[var(--app-surface-strong)] transition-colors cursor-pointer">
				<input
					type="checkbox"
					bind:checked={filterState.alphas}
					onchange={handleFilterChange}
					class="w-5 h-5 rounded border-[var(--app-border-strong)] text-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-focus)] focus:ring-offset-2 focus:ring-offset-[var(--app-surface)]"
				/>
				<div class="flex items-center gap-2 flex-1">
					<img
						src="/icons/alpha.png"
						alt=""
						class="h-4 w-4 object-contain"
						aria-hidden="true"
					/>
					<span class="font-medium">{$_('map.filters.alphas')}</span>
				</div>
			</label>

			<!-- Ladders -->
			<label class="flex items-center gap-3 p-3 app-card-muted rounded-lg hover:bg-[var(--app-surface-strong)] transition-colors cursor-pointer">
				<input
					type="checkbox"
					bind:checked={filterState.ladders}
					onchange={handleFilterChange}
					class="w-5 h-5 rounded border-[var(--app-border-strong)] text-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-focus)] focus:ring-offset-2 focus:ring-offset-[var(--app-surface)]"
				/>
				<div class="flex items-center gap-2 flex-1">
					<img
						src="/icons/ladder.png"
						alt=""
						class="h-4 w-4 object-contain"
						aria-hidden="true"
					/>
					<span class="font-medium">{$_('map.filters.ladders')}</span>
				</div>
			</label>
		</div>
	</div>
</div>
