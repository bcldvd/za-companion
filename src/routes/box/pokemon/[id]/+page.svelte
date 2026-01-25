<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import type { Pokemon } from '$lib/types/pokemon.js';
	import { calculateBoxPosition } from '$lib/utils/boxCalculator.js';
	import {
		loadPokedex,
		getPokemonByNationalNumber,
		getLocalizedPokemonName,
		getLocalizedTypes,
		searchPokemonByName
	} from '$lib/utils/pokedex.js';
	import { getPokemonSprite } from '$lib/utils/pokeapi.js';
	import ShinyToggle from '$lib/components/ShinyToggle.svelte';

	let pokemonId = $derived(Number($page.params.id));
	let selectedPokemon = $state<Pokemon | null>(null);
	let boxPosition = $state<ReturnType<typeof calculateBoxPosition> | null>(null);
	let isLoading = $state(true);
	let notFound = $state(false);
	let pokedex = $state<Pokemon[] | null>(null);

	// Search functionality
	let searchQuery = $state('');
	let searchResults = $state<Pokemon[]>([]);
	let showDropdown = $state(false);
	let searchInput = $state<HTMLInputElement | null>(null);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let searchRequestId = 0;

	// Initialize isShiny from localStorage
	let isShiny = $state(false);

	// Map to store sprite URLs for each pokemon (key: nationalNumber, value: { default: string, shiny: string })
	let spriteUrls = $state<Map<number, { default: string; shiny: string }>>(new Map());

	// Map to store sprite URLs for search results
	let searchResultSpriteUrls = $state<Map<number, string>>(new Map());

	// Extract translation values at top level for use in loops (Svelte 5 requirement)
	let colLabel = $derived($_('pokemon.colLabel'));
	let rowLabel = $derived($_('pokemon.rowLabel'));

	/**
	 * Gets the sprite URL synchronously from cache if available
	 * Returns null if not cached yet
	 */
	function getCachedSpriteUrl(pokemon: Pokemon): string | null {
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

	// Load Pokémon when ID changes
	$effect(() => {
		let cancelled = false;

		void (async () => {
			// Ensure dropdown doesn't persist across route param changes
			showDropdown = false;

			if (!pokemonId || isNaN(pokemonId)) {
				notFound = true;
				isLoading = false;
				return;
			}

			isLoading = true;
			notFound = false;

			try {
				// Load pokedex if not already loaded
				if (!pokedex) {
					pokedex = await loadPokedex();
				}

				if (cancelled) return;

				// Find Pokémon by national number
				const pokemon = getPokemonByNationalNumber(pokemonId, pokedex);

				if (pokemon) {
					selectedPokemon = pokemon;
					boxPosition = calculateBoxPosition(pokemon.regionalNumber);
				} else {
					notFound = true;
					selectedPokemon = null;
					boxPosition = null;
				}
			} catch (error) {
				if (cancelled) return;
				console.error('Error loading Pokemon:', error);
				notFound = true;
				selectedPokemon = null;
				boxPosition = null;
			} finally {
				if (cancelled) return;
				isLoading = false;
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	function goHome() {
		const params = new URLSearchParams();
		if (searchQuery) {
			params.set('q', searchQuery);
		}
		const queryString = params.toString();
		goto(queryString ? `/box?${queryString}` : '/box');
	}

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

			// Fetch sprites for search results
			Promise.all(
				results.slice(0, 10).map(async (pokemon) => {
					if (!spriteUrls.has(pokemon.nationalNumber)) {
						await fetchSpriteUrl(pokemon);
					}
					const cached = getCachedSpriteUrl(pokemon);
					searchResultSpriteUrls.set(pokemon.nationalNumber, cached || pokemon.imageUrl);
				})
			);
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
		const newUrl = queryString ? `${$page.url.pathname}?${queryString}` : $page.url.pathname;
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
		// Close dropdown immediately (this route component stays mounted across id changes)
		showDropdown = false;
		if (searchTimeout) {
			clearTimeout(searchTimeout);
			searchTimeout = null;
		}
		searchRequestId++;

		const params = new URLSearchParams();
		if (searchQuery) {
			params.set('q', searchQuery);
		}
		const queryString = params.toString();
		goto(
			queryString
				? `/box/pokemon/${pokemon.nationalNumber}?${queryString}`
				: `/box/pokemon/${pokemon.nationalNumber}`
		);
	}

	async function clearSearch() {
		searchQuery = '';
		searchResults = [];
		showDropdown = false;
		searchRequestId++;

		// Update URL to remove search query
		const params = new URLSearchParams($page.url.searchParams);
		params.delete('q');
		const queryString = params.toString();
		const newUrl = queryString ? `${$page.url.pathname}?${queryString}` : $page.url.pathname;
		goto(newUrl, { replaceState: true, noScroll: true, keepFocus: true });

		await tick();
		searchInput?.focus();
	}

	function handleClearPointerDown(event: PointerEvent) {
		event.preventDefault();
		void clearSearch();
	}

	function handleClearKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			void clearSearch();
		}
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.search-container')) {
			showDropdown = false;
		}
	}

	// Initialize search query from URL params (after functions are defined)
	$effect(() => {
		const query = $page.url.searchParams.get('q') || '';
		if (query !== searchQuery) {
			searchQuery = query;
			if (query) {
				const requestId = ++searchRequestId;
				void searchPokemon(query, requestId);
			} else {
				searchResults = [];
				showDropdown = false;
			}
		}
	});

	onMount(() => {
		// Initialize shiny toggle from localStorage (client-only)
		const stored = localStorage.getItem('pokemon-legends-za-shiny');
		isShiny = stored === 'true';

		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 p-4 pb-16 text-white">
	<div class="mx-auto max-w-2xl">
		{#if isLoading}
			<div class="py-12 text-center text-blue-300">
				<p class="mb-2 text-lg">{$_('pokemon.loading')}</p>
			</div>
		{:else if notFound}
			<div class="py-12 text-center text-blue-300">
				<p class="mb-2 text-lg">{$_('pokemon.notFound')} (ID: {pokemonId})</p>
				<button onclick={goHome} class="mt-4 rounded-lg bg-blue-700 px-4 py-2 hover:bg-blue-600">
					{$_('pokemon.backToSearch')}
				</button>
			</div>
		{:else if selectedPokemon && boxPosition}
			<!-- Selected Pokemon Info -->
			<div class="mb-6 rounded-lg border border-blue-700 bg-blue-800/50 p-4">
				<div class="mb-4 flex items-center gap-4">
					<img
						src={selectedPokemonSpriteUrl || selectedPokemon.imageUrl}
						alt={getLocalizedPokemonName(selectedPokemon)}
						class="h-20 w-20 object-contain"
					/>
					<div class="flex-1">
						<h3 class="text-2xl font-bold">{getLocalizedPokemonName(selectedPokemon)}</h3>
						<p class="text-blue-200">
							{$_('pokemon.regional')}
							{selectedPokemon.regionalNumber} • {getLocalizedTypes(selectedPokemon.types).join(
								', '
							)}
						</p>
					</div>
				</div>

				<!-- Text Placement Info -->
				<div class="rounded-lg bg-blue-900/50 py-3 text-center">
					<p class="text-lg font-semibold">
						{$_('pokemon.placeIn')}
						<span class="text-yellow-300">{$_('pokemon.box')} {boxPosition.box}</span>,{' '}
						<span class="text-yellow-300">{$_('pokemon.row')} {boxPosition.row}</span>,{' '}
						<span class="text-yellow-300">{$_('pokemon.column')} {boxPosition.column}</span>
					</p>
				</div>
			</div>

			<!-- Visual Box Representation -->
			<div class="rounded-lg border border-blue-700 bg-blue-800/50 p-4">
				<div class="mb-4 text-center">
					<h3 class="text-xl font-bold">{$_('pokemon.box')} {boxPosition.box}</h3>
				</div>

				<!-- Grid with Labels -->
				<div class="mx-auto max-w-md">
					<!-- Column Labels -->
					<div class="mb-2 grid grid-cols-[auto_1fr] gap-2">
						<!-- Empty space for row labels column -->
						<div class="w-12"></div>
						<!-- Column labels aligned with grid -->
						<div class="grid grid-cols-6 gap-2">
							{#each Array(6) as _, colIndex}
								<div class="text-center text-xs font-semibold text-blue-300">
									{colLabel}
									{colIndex + 1}
								</div>
							{/each}
						</div>
					</div>

					<!-- Box Grid with Row Labels -->
					<div class="grid grid-cols-[auto_1fr] gap-2">
						<!-- Row Labels -->
						<div class="flex w-12 flex-col justify-center gap-2">
							{#each Array(5) as _, rowIndex}
								<div
									class="flex h-full min-h-[calc((100%-2rem)/5)] items-center text-xs font-semibold text-blue-300"
								>
									{rowLabel}
									{rowIndex + 1}
								</div>
							{/each}
						</div>

						<!-- Box Grid -->
						<div class="grid grid-cols-6 gap-2">
							{#each Array(30) as _, index}
								{@const isTargetSlot = index === boxPosition.slotIndex}
								<div
									class="aspect-square rounded-lg border-2 transition-all {isTargetSlot
										? 'z-10 scale-110 border-yellow-300 bg-yellow-400 shadow-lg shadow-yellow-500/50'
										: 'border-blue-600 bg-blue-700/30'}"
								>
									{#if isTargetSlot}
										<div class="flex h-full w-full flex-col items-center justify-center p-1">
											<img
												src={selectedPokemonSpriteUrl || selectedPokemon.imageUrl}
												alt={getLocalizedPokemonName(selectedPokemon)}
												class="h-full w-full object-contain"
											/>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
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
					<ShinyToggle bind:isShiny />
					<div class="relative flex-1">
						<input
							type="text"
							placeholder={$_('search.placeholder')}
							value={searchQuery}
							oninput={handleSearchInput}
							bind:this={searchInput}
							class="min-h-[44px] w-full rounded-lg border border-blue-700 bg-blue-800/50 pl-4 pr-14 py-3 text-lg text-white placeholder-blue-300 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
							autocomplete="off"
						/>
						{#if searchQuery}
							<button
								type="button"
								onpointerdown={handleClearPointerDown}
								onkeydown={handleClearKeydown}
								class="absolute top-1/2 right-2 -translate-y-1/2 inline-flex items-center justify-center rounded-full border border-blue-500 bg-blue-800/80 px-2.5 py-1 text-xs font-semibold text-blue-100 shadow-sm hover:bg-blue-700 hover:text-white active:bg-blue-600"
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
						class="absolute bottom-full z-50 mb-2 max-h-80 w-full overflow-y-auto rounded-lg border border-blue-700 bg-blue-800 shadow-xl"
					>
						{#each searchResults as pokemon}
							{@const spriteUrl =
								searchResultSpriteUrls.get(pokemon.nationalNumber) || pokemon.imageUrl}
							<button
								onclick={() => selectPokemon(pokemon)}
								class="flex min-h-[60px] w-full touch-manipulation items-center gap-3 border-b border-blue-700 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-blue-700 active:bg-blue-600"
							>
								<img
									src={spriteUrl}
									alt={getLocalizedPokemonName(pokemon)}
									class="h-12 w-12 object-contain"
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
