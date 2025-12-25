<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import type { Pokemon } from '$lib/types/pokemon.js';
	import { calculateBoxPosition } from '$lib/utils/boxCalculator.js';
	import { loadPokedex, searchPokemonByName, getLocalizedPokemonName, getLocalizedTypes } from '$lib/utils/pokedex.js';
	import { getPokemonSprite } from '$lib/utils/pokeapi.js';
	import LanguageToggle from '$lib/components/LanguageToggle.svelte';
	import ShinyToggle from '$lib/components/ShinyToggle.svelte';

	let searchQuery = $state('');
	let searchResults = $state<Pokemon[]>([]);
	let selectedPokemon = $state<Pokemon | null>(null);
	let boxPosition = $state<ReturnType<typeof calculateBoxPosition> | null>(null);
	let showDropdown = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let pokedex = $state<Pokemon[] | null>(null);
	let isLoading = $state(true);
	
	// Initialize isShiny from localStorage
	let isShiny = $state<boolean>(() => {
		if (typeof window === 'undefined') return false;
		const stored = localStorage.getItem('pokemon-legends-za-shiny');
		return stored === 'true';
	});

	// Map to store sprite URLs for each pokemon (key: nationalNumber, value: { default: string, shiny: string })
	let spriteUrls = $state<Map<number, { default: string; shiny: string }>>(new Map());

	// Extract translation values at top level for use in loops (Svelte 5 requirement)
	let colLabel = $derived($_('pokemon.colLabel'));
	let rowLabel = $derived($_('pokemon.rowLabel'));

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

	// Reactive sprite URL getter for selected pokemon
	let selectedPokemonSpriteUrl = $derived.by(() => {
		if (!selectedPokemon) return null;
		const cached = getCachedSpriteUrl(selectedPokemon);
		return cached || selectedPokemon.imageUrl; // Fallback to serebii while loading
	});

	// Update sprite URL when selectedPokemon changes (fetch if not cached)
	$effect(() => {
		if (selectedPokemon) {
			const cached = spriteUrls.get(selectedPokemon.nationalNumber);
			if (!cached) {
				// Fetch sprites if not cached
				fetchSpriteUrl(selectedPokemon);
			}
		}
	});

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

	async function searchPokemon(query: string) {
		if (!query.trim()) {
			searchResults = [];
			showDropdown = false;
			return;
		}

		// Ensure pokedex is loaded
		if (!pokedex) {
			try {
				pokedex = await loadPokedex();
			} catch (error) {
				console.error('Error loading pokedex:', error);
				searchResults = [];
				showDropdown = false;
				return;
			}
		}

		// Perform client-side search
		try {
			const results = searchPokemonByName(query, pokedex);
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

		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		searchTimeout = setTimeout(() => {
			searchPokemon(searchQuery);
		}, 300); // Debounce 300ms
	}

	function selectPokemon(pokemon: Pokemon) {
		selectedPokemon = pokemon;
		boxPosition = calculateBoxPosition(pokemon.regionalNumber);
		// Use localized name for search query
		searchQuery = getLocalizedPokemonName(pokemon);
		showDropdown = false;
		searchResults = [];
	}

	function clearSelection() {
		selectedPokemon = null;
		boxPosition = null;
		searchQuery = '';
		searchResults = [];
		showDropdown = false;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.search-container')) {
			showDropdown = false;
		}
	}

	onMount(async () => {
		document.addEventListener('click', handleClickOutside);
		
		// Load pokedex data on mount
		try {
			pokedex = await loadPokedex();
		} catch (error) {
			console.error('Error loading pokedex:', error);
		} finally {
			isLoading = false;
		}
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

	<div class="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 text-white p-4">
		<div class="max-w-2xl mx-auto">
		<header class="mb-6">
			<div class="flex justify-between items-center mb-4">
				<div class="flex items-center gap-4">
					<ShinyToggle bind:isShiny={isShiny} />
					<div class="text-center flex-1">
						<h1 class="text-3xl font-bold mb-2">{$_('app.title')}</h1>
						<h2 class="text-xl text-blue-200">{$_('app.subtitle')}</h2>
					</div>
				</div>
				<div class="ml-4">
					<LanguageToggle />
				</div>
			</div>
		</header>

		<!-- Search Section -->
		<div class="mb-6 search-container relative">
			<div class="relative">
				<input
					type="text"
					placeholder={$_('search.placeholder')}
					value={searchQuery}
					oninput={handleSearchInput}
					class="w-full px-4 py-3 rounded-lg bg-blue-800/50 border border-blue-700 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg min-h-[44px]"
					autocomplete="off"
				/>
				{#if searchQuery || selectedPokemon}
					<button
						onclick={clearSelection}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white text-xl leading-none"
						aria-label="Clear search"
					>
						✕
					</button>
				{/if}
			</div>

			<!-- Autocomplete Dropdown -->
			{#if showDropdown && searchResults.length > 0}
				<div class="absolute z-50 w-full mt-2 bg-blue-800 rounded-lg border border-blue-700 shadow-xl max-h-80 overflow-y-auto">
					{#each searchResults as pokemon}
						{@const spriteUrl = searchResultSpriteUrls.get(pokemon.nationalNumber) || pokemon.imageUrl}
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
									{$_('pokemon.regional')} {String(pokemon.regionalNumber).padStart(3, '0')} • {getLocalizedTypes(pokemon.types).join(', ')}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Selected Pokemon Info -->
		{#if selectedPokemon && boxPosition}
			<div class="mb-6 p-4 bg-blue-800/50 rounded-lg border border-blue-700">
				<div class="flex items-center gap-4 mb-4">
					<img
						src={selectedPokemonSpriteUrl || selectedPokemon.imageUrl}
						alt={getLocalizedPokemonName(selectedPokemon)}
						class="w-20 h-20 object-contain"
					/>
					<div class="flex-1">
						<h3 class="text-2xl font-bold">{getLocalizedPokemonName(selectedPokemon)}</h3>
						<p class="text-blue-200">
							{$_('pokemon.regional')} {selectedPokemon.regionalNumber} • {getLocalizedTypes(selectedPokemon.types).join(', ')}
						</p>
					</div>
				</div>

				<!-- Text Placement Info -->
				<div class="text-center py-3 bg-blue-900/50 rounded-lg">
					<p class="text-lg font-semibold">
						{$_('pokemon.placeIn')} <span class="text-yellow-300">{$_('pokemon.box')} {boxPosition.box}</span>,{' '}
						<span class="text-yellow-300">{$_('pokemon.row')} {boxPosition.row}</span>,{' '}
						<span class="text-yellow-300">{$_('pokemon.column')} {boxPosition.column}</span>
					</p>
				</div>
			</div>

			<!-- Visual Box Representation -->
			<div class="bg-blue-800/50 rounded-lg border border-blue-700 p-4">
				<div class="text-center mb-4">
					<h3 class="text-xl font-bold">{$_('pokemon.box')} {boxPosition.box}</h3>
					<p class="text-sm text-blue-200">{$_('pokemon.gridSize')}</p>
				</div>

				<!-- Grid with Labels -->
				<div class="max-w-md mx-auto">
					<!-- Column Labels -->
					<div class="grid grid-cols-[auto_1fr] gap-2 mb-2">
						<!-- Empty space for row labels column -->
						<div class="w-12"></div>
						<!-- Column labels aligned with grid -->
						<div class="grid grid-cols-6 gap-2">
							{#each Array(6) as _, colIndex}
								<div class="text-center text-xs text-blue-300 font-semibold">
									{colLabel} {colIndex + 1}
								</div>
							{/each}
						</div>
					</div>

					<!-- Box Grid with Row Labels -->
					<div class="grid grid-cols-[auto_1fr] gap-2">
						<!-- Row Labels -->
						<div class="flex flex-col gap-2 justify-center w-12">
							{#each Array(5) as _, rowIndex}
								<div class="text-xs text-blue-300 font-semibold flex items-center h-full min-h-[calc((100%-2rem)/5)]">
									{rowLabel} {rowIndex + 1}
								</div>
							{/each}
						</div>

						<!-- Box Grid -->
						<div class="grid grid-cols-6 gap-2">
							{#each Array(30) as _, index}
								{@const isTargetSlot = index === boxPosition.slotIndex}
								<div
									class="aspect-square rounded-lg border-2 transition-all {isTargetSlot
										? 'bg-yellow-400 border-yellow-300 shadow-lg shadow-yellow-500/50 scale-110 z-10'
										: 'bg-blue-700/30 border-blue-600'}"
								>
									{#if isTargetSlot}
										<div class="w-full h-full flex flex-col items-center justify-center p-1">
											<img
												src={selectedPokemonSpriteUrl || selectedPokemon.imageUrl}
												alt={getLocalizedPokemonName(selectedPokemon)}
												class="w-full h-full object-contain"
											/>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{:else if searchQuery && searchResults.length === 0 && !showDropdown}
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
</div>
