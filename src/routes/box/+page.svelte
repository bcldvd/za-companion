<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import type { Pokemon } from '$lib/types/pokemon.js';
	import { loadPokedex, searchPokemonByName, getLocalizedPokemonName, getLocalizedTypes } from '$lib/utils/pokedex.js';
	import { getPokemonSprite } from '$lib/utils/pokeapi.js';
	import ShinyToggle from '$lib/components/ShinyToggle.svelte';

	let searchQuery = $state('');
	let searchResults = $state<Pokemon[]>([]);
	let showDropdown = $state(false);
	let searchInput = $state<HTMLInputElement | null>(null);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let searchRequestId = 0;
	let pokedex = $state<Pokemon[] | null>(null);
	let isLoading = $state(true);
	
	// Initialize isShiny from localStorage
	let isShiny = $state(false);

	// Map to store sprite URLs for each pokemon (key: nationalNumber, value: { default: string, shiny: string })
	let spriteUrls = $state<Map<number, { default: string; shiny: string }>>(new Map());

	/**
	 * Gets the sprite URL synchronously from cache if available
	 * Returns null if not cached yet
	 * This function accesses isShiny, so it will be reactive when used in derived values
	 */
	function getCachedSpriteUrl(pokemon: Pokemon): string | null {
		// Access isShiny to make this reactive
		const shiny = isShiny;
		const cached = spriteUrls.get(pokemon.nationalNumber);
		if (cached) {
			return shiny ? cached.shiny : cached.default;
		}
		return null;
	}

	/**
	 * Gets the sprite URL for a Pokémon, using cached value if available
	 * Falls back to serebii imageUrl if PokéAPI fails
	 */
	async function fetchSpriteUrl(pokemon: Pokemon): Promise<string> {
		const cacheKey = pokemon.nationalNumber;
		const cached = spriteUrls.get(cacheKey);

		// If we have both sprites cached, return the appropriate one
		if (cached) {
			return isShiny ? cached.shiny : cached.default;
		}

		// Fetch both sprites in parallel and cache them
		try {
			const [defaultSprite, shinySprite] = await Promise.all([
				getPokemonSprite(pokemon.nationalNumber, false, pokemon.imageUrl),
				getPokemonSprite(pokemon.nationalNumber, true, pokemon.imageUrl)
			]);

			spriteUrls.set(cacheKey, {
				default: defaultSprite,
				shiny: shinySprite
			});

			return isShiny ? shinySprite : defaultSprite;
		} catch (error) {
			console.error(`Error fetching sprites for ${pokemon.name}:`, error);
			// Fallback to serebii URL
			return pokemon.imageUrl;
		}
	}

	// Reactive sprite URLs for search results - derived from cache
	let searchResultSpriteUrls = $derived.by(() => {
		const urls = new Map<number, string>();
		for (const pokemon of searchResults) {
			const cached = getCachedSpriteUrl(pokemon);
			urls.set(pokemon.nationalNumber, cached || pokemon.imageUrl);
		}
		return urls;
	});

	// Fetch sprites for search results when they change
	$effect(() => {
		if (searchResults.length > 0) {
			// Fetch sprites for all search results that aren't cached
			Promise.all(
				searchResults.map(async (pokemon) => {
					if (!spriteUrls.has(pokemon.nationalNumber)) {
						await fetchSpriteUrl(pokemon);
					}
				})
			);
		}
	});

	async function searchPokemon(query: string, requestId: number) {
		if (!query.trim()) {
			searchResults = [];
			showDropdown = false;
			return;
		}

		// Ensure pokedex is loaded
		if (!pokedex) {
			try {
				pokedex = await loadPokedex();
				if (requestId !== searchRequestId) return;
			} catch (error) {
				console.error('Error loading pokedex:', error);
				searchResults = [];
				showDropdown = false;
				return;
			}
		}

		// Perform client-side search
		try {
			if (requestId !== searchRequestId) return;
			const results = searchPokemonByName(query, pokedex);
			if (requestId !== searchRequestId) return;
			searchResults = results.slice(0, 10); // Limit to 10 results
			showDropdown = true;
		} catch (error) {
			console.error('Error searching Pokemon:', error);
			searchResults = [];
			showDropdown = false;
		}
	}

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;

		// Update URL with search query
		const params = new URLSearchParams($page.url.searchParams);
		if (searchQuery) {
			params.set('q', searchQuery);
		} else {
			params.delete('q');
		}
		const queryString = params.toString();
		const newUrl = queryString ? `/box?${queryString}` : '/box';
		goto(newUrl, { replaceState: true, noScroll: true, keepFocus: true });

		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		const requestId = ++searchRequestId;
		searchTimeout = setTimeout(() => {
			void searchPokemon(searchQuery, requestId);
		}, 300); // Debounce 300ms
	}

	function selectPokemon(pokemon: Pokemon) {
		// Close dropdown immediately to avoid it lingering during navigation
		showDropdown = false;
		if (searchTimeout) {
			clearTimeout(searchTimeout);
			searchTimeout = null;
		}
		searchRequestId++;

		// Navigate to the Pokémon detail page using nationalNumber (i18n compatible)
		// Preserve search query in URL
		const params = new URLSearchParams();
		if (searchQuery) {
			params.set('q', searchQuery);
		}
		const queryString = params.toString();
		goto(queryString ? `/box/pokemon/${pokemon.nationalNumber}?${queryString}` : `/box/pokemon/${pokemon.nationalNumber}`);
	}

	async function clearSelection() {
		searchQuery = '';
		searchResults = [];
		showDropdown = false;
		searchRequestId++;
		
		// Update URL to remove search query
		const params = new URLSearchParams($page.url.searchParams);
		params.delete('q');
		const queryString = params.toString();
		const newUrl = queryString ? `/box?${queryString}` : '/box';
		goto(newUrl, { replaceState: true, noScroll: true, keepFocus: true });

		await tick();
		searchInput?.focus();
	}

	function handleClearKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			void clearSelection();
		}
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.search-container')) {
			showDropdown = false;
		}
	}

	// Initialize search query from URL params
	$effect(() => {
		const query = $page.url.searchParams.get('q') || '';
		if (query && query !== searchQuery) {
			searchQuery = query;
			const requestId = ++searchRequestId;
			void searchPokemon(query, requestId);
		}
	});

	onMount(() => {
		document.addEventListener('click', handleClickOutside);

		// Initialize isShiny from localStorage (client-only)
		const stored = localStorage.getItem('pokemon-legends-za-shiny');
		isShiny = stored === 'true';
		
		// Load pokedex data on mount
		void (async () => {
			try {
				pokedex = await loadPokedex();
			} catch (error) {
				console.error('Error loading pokedex:', error);
			} finally {
				isLoading = false;
			}
		})();
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 text-white p-4 pb-16">
	<div class="max-w-2xl mx-auto">
		{#if searchQuery && searchResults.length === 0 && !showDropdown}
			<div class="text-center py-8 text-blue-300">
				<p>{$_('pokemon.notFound')} "{searchQuery}"</p>
			</div>
		{:else if isLoading}
			<div class="text-center py-12 text-blue-300">
				<p class="text-lg mb-2">{$_('pokemon.loading')}</p>
			</div>
		{:else}
			<div class="text-center py-12 text-blue-300">
				<p class="text-lg mb-2">{$_('pokemon.searchPrompt')}</p>
				<p class="text-sm">{$_('pokemon.startPrompt')}</p>
			</div>
		{/if}
	</div>

	<!-- Search Section (fixed to bottom for mobile comfort) -->
	<div
		class="search-container fixed left-0 right-0 z-40"
		style="bottom: calc(4.25rem + env(safe-area-inset-bottom, 0px));"
	>
		<div class="mx-auto max-w-2xl px-4">
			<div class="relative">
				<div
					class="flex items-center gap-3 rounded-xl border border-blue-700 bg-blue-900/95 p-3 backdrop-blur-sm"
				>
					<ShinyToggle bind:isShiny={isShiny} />
					<div class="relative flex-1">
						<input
							type="text"
							placeholder={$_('search.placeholder')}
							value={searchQuery}
							oninput={handleSearchInput}
							bind:this={searchInput}
							class="w-full pl-4 pr-14 py-3 rounded-lg bg-blue-800/50 border border-blue-700 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg min-h-[44px]"
							autocomplete="off"
						/>
						{#if searchQuery}
							<button
								type="button"
								on:pointerdown|preventDefault={clearSelection}
								onkeydown={handleClearKeydown}
								class="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full border border-blue-500 bg-blue-800/80 px-2.5 py-1 text-xs font-semibold text-blue-100 shadow-sm hover:bg-blue-700 hover:text-white active:bg-blue-600"
								aria-label="Clear search"
							>
								✕
							</button>
						{/if}
					</div>
				</div>

				<!-- Autocomplete Dropdown -->
				{#if showDropdown && searchResults.length > 0}
					<div
						class="absolute bottom-full z-50 w-full mb-2 bg-blue-800 rounded-lg border border-blue-700 shadow-xl max-h-80 overflow-y-auto"
					>
						{#each searchResults as pokemon}
							{@const spriteUrl =
								searchResultSpriteUrls.get(pokemon.nationalNumber) || pokemon.imageUrl}
							<button
								onclick={() => selectPokemon(pokemon)}
								class="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-700 active:bg-blue-600 transition-colors text-left border-b border-blue-700 last:border-b-0 min-h-[60px] touch-manipulation"
							>
								<img
									src={spriteUrl}
									alt={getLocalizedPokemonName(pokemon)}
									class="w-12 h-12 object-contain"
								/>
								<div class="flex-1">
									<div class="font-semibold text-white">{getLocalizedPokemonName(pokemon)}</div>
									<div class="text-sm text-blue-300">
										{$_('pokemon.regional')}
										{String(pokemon.regionalNumber).padStart(3, '0')} • {getLocalizedTypes(
											pokemon.types
										).join(', ')}
									</div>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
