<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import type { Pokemon } from '$lib/types/pokemon.js';
	import { loadPokedex, searchPokemonByName, getLocalizedPokemonName, getLocalizedTypes } from '$lib/utils/pokedex.js';
	import { getPokemonSprite } from '$lib/utils/pokeapi.js';
	import LanguageToggle from '$lib/components/LanguageToggle.svelte';
	import ShinyToggle from '$lib/components/ShinyToggle.svelte';

	let searchQuery = $state('');
	let searchResults = $state<Pokemon[]>([]);
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
		// Navigate to the Pokémon detail page using nationalNumber (i18n compatible)
		goto(`/pokemon/${pokemon.nationalNumber}`);
	}

	function clearSelection() {
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
				{#if searchQuery}
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
</div>
