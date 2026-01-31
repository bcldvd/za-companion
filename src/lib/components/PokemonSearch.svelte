<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import type { Pokemon } from '$lib/types/pokemon.js';
	import { loadPokedex, searchPokemonByName, getLocalizedPokemonName } from '$lib/utils/pokedex.js';

	interface Props {
		onSelect: (pokemon: Pokemon) => void;
		placeholder?: string;
		autofocus?: boolean;
	}

	let { onSelect, placeholder, autofocus = false }: Props = $props();

	let searchQuery = $state('');
	let searchResults = $state<Pokemon[]>([]);
	let showDropdown = $state(false);
	let searchInput = $state<HTMLInputElement | null>(null);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let searchRequestId = 0;
	let pokedex = $state<Pokemon[] | null>(null);
	let isLoading = $state(true);

	async function performSearch(query: string, requestId: number) {
		if (!query.trim()) {
			searchResults = [];
			showDropdown = false;
			return;
		}

		if (!pokedex) {
			return;
		}

		try {
			if (requestId !== searchRequestId) return;
			const results = searchPokemonByName(query, pokedex);
			if (requestId !== searchRequestId) return;
			searchResults = results.slice(0, 10);
			showDropdown = results.length > 0;
		} catch (error) {
			console.error('Error searching Pokemon:', error);
			searchResults = [];
			showDropdown = false;
		}
	}

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;

		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		const requestId = ++searchRequestId;
		searchTimeout = setTimeout(() => {
			void performSearch(searchQuery, requestId);
		}, 250);
	}

	function selectPokemon(pokemon: Pokemon) {
		showDropdown = false;
		searchQuery = '';
		searchResults = [];
		if (searchTimeout) {
			clearTimeout(searchTimeout);
			searchTimeout = null;
		}
		searchRequestId++;
		onSelect(pokemon);
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.pokemon-search-container')) {
			showDropdown = false;
		}
	}

	onMount(async () => {
		document.addEventListener('click', handleClickOutside);

		try {
			pokedex = await loadPokedex();
		} catch (error) {
			console.error('Error loading pokedex:', error);
		} finally {
			isLoading = false;
		}

		if (autofocus) {
			searchInput?.focus();
		}

		return () => {
			document.removeEventListener('click', handleClickOutside);
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	});
</script>

<div class="pokemon-search-container relative">
	<input
		type="text"
		class="w-full rounded-md border app-border app-surface px-3 py-2 text-sm"
		placeholder={placeholder ?? $_('donuts.reservationModal.searchPlaceholder')}
		value={searchQuery}
		oninput={handleSearchInput}
		onfocus={() => (showDropdown = searchResults.length > 0)}
		bind:this={searchInput}
	/>

	{#if isLoading}
		<p class="mt-2 text-sm app-text-muted">{$_('donuts.reservationModal.loading')}</p>
	{:else if showDropdown}
		<div class="absolute top-full left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-md border app-border app-surface shadow-lg">
			{#each searchResults as pokemon (pokemon.nationalNumber)}
				<button
					type="button"
					class="w-full px-4 py-3 flex items-center gap-3 hover:bg-(--app-surface-strong) active:bg-(--app-surface-muted) transition-colors text-left border-b app-border last:border-b-0 min-h-[60px] touch-manipulation"
					onclick={() => selectPokemon(pokemon)}
				>
					<img src={pokemon.imageUrl} alt="" class="h-10 w-10 object-contain" />
					<div class="flex-1">
						<div class="font-semibold">{getLocalizedPokemonName(pokemon)}</div>
						<div class="text-xs app-text-muted">
							{$_('donuts.reservationModal.nationalNumber', { values: { number: pokemon.nationalNumber } })}
						</div>
					</div>
				</button>
			{/each}
		</div>
	{:else if searchQuery.trim() && !isLoading}
		<p class="mt-2 text-sm app-text-muted">
			{$_('donuts.reservationModal.noResults', { values: { query: searchQuery } })}
		</p>
	{:else if !searchQuery.trim() && !isLoading}
		<p class="mt-2 text-sm app-text-muted">{$_('donuts.reservationModal.startPrompt')}</p>
	{/if}
</div>
