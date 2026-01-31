<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import type { Pokemon } from '$lib/types/pokemon.js';
	import type { AttackStyle, StatKey } from '$lib/perfect/types';
	import { loadPokedex, searchPokemonByName, getLocalizedPokemonName, getLocalizedTypes } from '$lib/utils/pokedex.js';
import { getPokemonBaseStats, getPokemonSprite } from '$lib/utils/pokeapi.js';
	import { buildDefaultPriority } from '$lib/perfect/attackStyleInference';
	import StatPriorityList from '$lib/components/perfect/StatPriorityList.svelte';
import AttackStyleTooltip from '$lib/components/perfect/AttackStyleTooltip.svelte';
	import ShinyToggle from '$lib/components/ShinyToggle.svelte';

	let searchQuery = $state('');
	let searchResults = $state<Pokemon[]>([]);
	let showDropdown = $state(false);
	let searchInput = $state<HTMLInputElement | null>(null);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let searchRequestId = 0;
	let pokedex = $state<Pokemon[] | null>(null);
	let isLoading = $state(true);
	let isShiny = $state(false);

	let selectedPokemon = $state<Pokemon | null>(null);
	let attackStyle = $state<AttackStyle>('physical');
	let priorities = $state<StatKey[]>(buildDefaultPriority('physical'));
	let spriteUrl = $state<string | null>(null);
let baseStats = $state<{
	hp: number;
	atk: number;
	def: number;
	spa: number;
	spd: number;
	spe: number;
} | null>(null);

	// Map to store sprite URLs for each pokemon
	let spriteUrls = $state<Map<number, { default: string; shiny: string }>>(new Map());

	function getCachedSpriteUrl(pokemon: Pokemon): string | null {
		const shiny = isShiny;
		const cached = spriteUrls.get(pokemon.nationalNumber);
		if (cached) {
			return shiny ? cached.shiny : cached.default;
		}
		return null;
	}

	async function fetchSpriteUrl(pokemon: Pokemon): Promise<string> {
		const cacheKey = pokemon.nationalNumber;
		const cached = spriteUrls.get(cacheKey);

		if (cached) {
			return isShiny ? cached.shiny : cached.default;
		}

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
			return pokemon.imageUrl;
		}
	}

	let searchResultSpriteUrls = $derived.by(() => {
		const urls = new Map<number, string>();
		for (const pokemon of searchResults) {
			const cached = getCachedSpriteUrl(pokemon);
			urls.set(pokemon.nationalNumber, cached || pokemon.imageUrl);
		}
		return urls;
	});

	$effect(() => {
		if (searchResults.length > 0) {
			Promise.all(
				searchResults.map(async (pokemon) => {
					if (!spriteUrls.has(pokemon.nationalNumber)) {
						await fetchSpriteUrl(pokemon);
					}
				})
			);
		}
	});

	// Update selected pokemon sprite when shiny toggle changes
	$effect(() => {
		if (selectedPokemon) {
			const cached = getCachedSpriteUrl(selectedPokemon);
			if (cached) {
				spriteUrl = cached;
			}
		}
	});

	async function searchPokemon(query: string, requestId: number) {
		if (!query.trim()) {
			searchResults = [];
			showDropdown = false;
			return;
		}

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

		try {
			if (requestId !== searchRequestId) return;
			const results = searchPokemonByName(query, pokedex);
			if (requestId !== searchRequestId) return;
			searchResults = results.slice(0, 10);
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

		const requestId = ++searchRequestId;
		searchTimeout = setTimeout(() => {
			void searchPokemon(searchQuery, requestId);
		}, 300);
	}

	async function selectPokemon(pokemon: Pokemon) {
		selectedPokemon = pokemon;
		showDropdown = false;
		searchQuery = getLocalizedPokemonName(pokemon);
		if (searchTimeout) {
			clearTimeout(searchTimeout);
			searchTimeout = null;
		}
		searchRequestId++;

		spriteUrl = await fetchSpriteUrl(pokemon);
	try {
		baseStats = await getPokemonBaseStats(pokemon.nationalNumber);
		if (baseStats.atk > baseStats.spa) {
			setAttackStyle('physical');
		} else if (baseStats.spa > baseStats.atk) {
			setAttackStyle('special');
		} else {
			setAttackStyle('mixed');
		}
	} catch (error) {
		console.error('Error loading base stats:', error);
		baseStats = null;
	}
	}

	async function clearSelection() {
		selectedPokemon = null;
		searchQuery = '';
		searchResults = [];
		showDropdown = false;
		spriteUrl = null;
	baseStats = null;
		searchRequestId++;

		await tick();
		searchInput?.focus();
	}

	function handleClearPointerDown(event: PointerEvent) {
		event.preventDefault();
		void clearSelection();
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.search-container')) {
			showDropdown = false;
		}
	}

	function setAttackStyle(style: AttackStyle) {
		attackStyle = style;
		priorities = buildDefaultPriority(style);
	}

	function handleContinue() {
		const priorityString = priorities.join(',');
		goto(`/perfect/plan?p=${priorityString}`);
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);

		const stored = localStorage.getItem('pokemon-legends-za-shiny');
		isShiny = stored === 'true';

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

<div class="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 p-4 pb-24 text-white">
	<div class="mx-auto max-w-2xl space-y-6">
		<!-- Search Section (sticky at top) -->
		<div class="search-container sticky top-4 z-40">
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
							class="min-h-[44px] w-full rounded-lg border border-blue-700 bg-blue-800/50 py-3 pl-4 pr-14 text-lg text-white placeholder-blue-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							autocomplete="off"
						/>
						{#if searchQuery && !selectedPokemon}
							<button
								type="button"
								onpointerdown={handleClearPointerDown}
								class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-blue-500 bg-blue-800/80 px-2.5 py-1 text-xs font-semibold text-blue-100 hover:bg-blue-700"
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
						class="absolute top-full z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-lg border border-blue-700 bg-blue-800 shadow-xl"
					>
						{#each searchResults as pokemon}
							{@const pokeSpriteUrl =
								searchResultSpriteUrls.get(pokemon.nationalNumber) || pokemon.imageUrl}
							<button
								onclick={() => selectPokemon(pokemon)}
								class="flex min-h-[60px] w-full touch-manipulation items-center gap-3 border-b border-blue-700 px-4 py-3 text-left transition-colors hover:bg-blue-700 active:bg-blue-600 last:border-b-0"
							>
								<img
									src={pokeSpriteUrl}
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

		<!-- Selected Pokemon Display -->
		{#if selectedPokemon && spriteUrl}
			<div class="flex items-center gap-4 rounded-lg border border-blue-700 bg-blue-800/50 p-4">
				<img
					src={spriteUrl}
					alt={getLocalizedPokemonName(selectedPokemon)}
					class="h-20 w-20 object-contain"
				/>
				<div class="flex-1">
					<div class="text-xl font-semibold">{getLocalizedPokemonName(selectedPokemon)}</div>
					<div class="text-sm text-blue-300">
						{$_('pokemon.regional')}
						{String(selectedPokemon.regionalNumber).padStart(3, '0')} • {getLocalizedTypes(
							selectedPokemon.types
						).join(', ')}
					</div>
				</div>
				<button
					type="button"
					class="rounded-full border border-blue-500 bg-blue-800/80 px-3 py-1 text-sm text-blue-100 hover:bg-blue-700"
					onclick={clearSelection}
				>
					×
				</button>
			</div>
		{:else if !isLoading}
			<div class="py-4 text-center text-blue-300">
				<p>{$_('perfect.setup.selectPokemon')}</p>
			</div>
		{/if}

		<!-- Attack Style Selection -->
		<div>
			<div class="mb-2 flex items-center justify-between text-sm font-medium text-blue-200">
				<span>{$_('perfect.setup.attackStyle')}</span>
				<AttackStyleTooltip />
			</div>
			<div class="flex gap-2 rounded-lg border border-blue-700 bg-blue-800/50 p-1">
				{#each ['physical', 'special', 'mixed'] as style (style)}
					<button
						type="button"
						class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {attackStyle ===
						style
							? 'bg-blue-600 text-white'
							: 'text-blue-300 hover:bg-blue-700/50'}"
						onclick={() => setAttackStyle(style as AttackStyle)}
					>
						{$_(`perfect.setup.${style}`)}
					</button>
				{/each}
			</div>
		</div>

		<!-- Stat Priority List -->
		<div>
			<div class="mb-2 text-sm font-medium text-blue-200">
				{$_('perfect.setup.priorities')}
				<span class="ml-2 text-xs text-blue-400">{$_('perfect.setup.prioritiesHint')}</span>
			</div>
			<StatPriorityList bind:priorities stats={baseStats} />
		</div>

		<!-- Continue Button -->
		<button
			type="button"
			class="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
			onclick={handleContinue}
		>
			{$_('perfect.setup.continue')}
		</button>
	</div>
</div>
