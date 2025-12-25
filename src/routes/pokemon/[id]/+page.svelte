<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import type { Pokemon } from '$lib/types/pokemon.js';
	import { calculateBoxPosition } from '$lib/utils/boxCalculator.js';
	import { loadPokedex, getPokemonByNationalNumber, getLocalizedPokemonName, getLocalizedTypes } from '$lib/utils/pokedex.js';
	import { getPokemonSprite } from '$lib/utils/pokeapi.js';
	import LanguageToggle from '$lib/components/LanguageToggle.svelte';
	import ShinyToggle from '$lib/components/ShinyToggle.svelte';

	let pokemonId = $derived(Number($page.params.id));
	let selectedPokemon = $state<Pokemon | null>(null);
	let boxPosition = $state<ReturnType<typeof calculateBoxPosition> | null>(null);
	let isLoading = $state(true);
	let notFound = $state(false);
	let pokedex = $state<Pokemon[] | null>(null);
	
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
	$effect(async () => {
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
			console.error('Error loading Pokemon:', error);
			notFound = true;
			selectedPokemon = null;
			boxPosition = null;
		} finally {
			isLoading = false;
		}
	});

	function clearSelection() {
		goto('/');
	}
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

		<!-- Back to Search Link -->
		<div class="mb-6">
			<button
				onclick={clearSelection}
				class="text-blue-300 hover:text-white underline flex items-center gap-2"
			>
				← {$_('pokemon.backToSearch')}
			</button>
		</div>

		{#if isLoading}
			<div class="text-center py-12 text-blue-300">
				<p class="text-lg mb-2">{$_('pokemon.loading')}</p>
			</div>
		{:else if notFound}
			<div class="text-center py-12 text-blue-300">
				<p class="text-lg mb-2">{$_('pokemon.notFound')} (ID: {pokemonId})</p>
				<button
					onclick={clearSelection}
					class="mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg"
				>
					{$_('pokemon.backToSearch')}
				</button>
			</div>
		{:else if selectedPokemon && boxPosition}
			<!-- Selected Pokemon Info -->
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
		{/if}
	</div>
</div>
