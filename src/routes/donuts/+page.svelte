<script lang="ts">
	import { onMount } from 'svelte';
	import { _, locale } from 'svelte-i18n';
	import type { Pokemon } from '$lib/types/pokemon.js';
	import { loadPokedex, getLocalizedPokemonName } from '$lib/utils/pokedex.js';
	import { loadBerries, getBerryMap, type Berry } from '$lib/features/donuts/berries';
	import PokemonSearch from '$lib/components/PokemonSearch.svelte';
	import type { DonutRecipe, OwnedDonut } from '$lib/features/donuts/types';
	import { recommendedDonutRecipes } from '$lib/features/donuts/recommendedDonutRecipes';
	import { specialLegendaryDonutRecipes } from '$lib/features/donuts/specialLegendaryDonutRecipes';
	import { loadTypeOptions, getTypeLabel, type TypeOption } from '$lib/features/donuts/typesData';
	import {
		addOwnedDonut,
		createOwnedDonutFromRecipe,
		loadOwnedDonuts,
		saveOwnedDonuts,
		reserveOwnedDonut,
		unreserveOwnedDonut,
		consumeOwnedDonut,
		duplicateOwnedDonut
	} from '$lib/features/donuts/ownedDonuts';

	type TabKey = 'recipes' | 'inventory';

	let activeTab = $state<TabKey>('recipes');
	let berries = $state<Berry[]>([]);
	let berryMap = $state<Map<string, Berry>>(new Map());
	let ownedDonuts = $state<OwnedDonut[]>([]);

	let pokedex = $state<Pokemon[] | null>(null);
	let typeOptions = $state<TypeOption[]>([]);
	let typeLabelMap = $state<Map<string, string>>(new Map());

	let craftingRecipe = $state<DonutRecipe | null>(null);
	let showSparklingModal = $state(false);
	let showInfoModal = $state(false);
	let sparklingSelection = $state<1 | 2 | 3>(3);
	let selectedTypeId = $state<string>('all');

	let reservationTarget = $state<OwnedDonut | null>(null);
	let showReservationModal = $state(false);
	const sparklingLevels: Array<1 | 2 | 3> = [1, 2, 3];
	const buttonBase =
		'min-h-[44px] rounded-md border px-4 py-2 text-sm font-semibold transition-colors';

	const recipesRecommended = recommendedDonutRecipes;
	const recipesSpecial = specialLegendaryDonutRecipes;

	const pokemonMap = $derived.by(() => {
		const map = new Map<string, Pokemon>();
		if (!pokedex) return map;
		for (const pokemon of pokedex) {
			map.set(String(pokemon.nationalNumber), pokemon);
		}
		return map;
	});

	const reservedDonuts = $derived(ownedDonuts.filter((donut) => donut.reservedForPokemonId));
	const availableDonuts = $derived(ownedDonuts.filter((donut) => !donut.reservedForPokemonId));

	onMount(async () => {
		try {
			const [loadedBerries] = await Promise.all([loadBerries()]);
			berries = loadedBerries;
			berryMap = getBerryMap(loadedBerries);
		} catch (error) {
			console.error('Failed to load berries:', error);
		}

		ownedDonuts = loadOwnedDonuts();

		try {
			pokedex = await loadPokedex();
		} catch (error) {
			console.error('Failed to load pokedex:', error);
		}
	});

	async function refreshTypeOptions() {
		const options = await loadTypeOptions(($locale as 'en' | 'fr' | undefined) ?? undefined);
		typeOptions = options;
		typeLabelMap = new Map(options.map((option) => [option.id, option.label]));
	}

	$effect(() => {
		if (!$locale) return;
		refreshTypeOptions();
	});

	function setOwnedDonuts(next: OwnedDonut[]): void {
		ownedDonuts = next;
		saveOwnedDonuts(next);
	}

	function openCraftModal(recipe: DonutRecipe) {
		craftingRecipe = recipe;
		sparklingSelection = 3;
		selectedTypeId = 'all';
		showSparklingModal = true;
	}

	function confirmCraft() {
		if (!craftingRecipe) return;
		const newDonut = createOwnedDonutFromRecipe(
			craftingRecipe,
			sparklingSelection,
			selectedTypeId
		);
		setOwnedDonuts(addOwnedDonut(ownedDonuts, newDonut));
		showSparklingModal = false;
		craftingRecipe = null;
	}

	function openReservationModal(donut: OwnedDonut) {
		reservationTarget = donut;
		showReservationModal = true;
	}

	function closeReservationModal() {
		showReservationModal = false;
		reservationTarget = null;
	}

	function applyReservation(pokemon: Pokemon) {
		if (!reservationTarget) return;
		setOwnedDonuts(reserveOwnedDonut(ownedDonuts, reservationTarget.id, String(pokemon.nationalNumber)));
		closeReservationModal();
	}

	function applyUnreserve(donut: OwnedDonut) {
		setOwnedDonuts(unreserveOwnedDonut(ownedDonuts, donut.id));
	}

	function applyConsume(donut: OwnedDonut) {
		if (donut.isSpecialLegendary) {
			const confirmText = $_('donuts.inventory.specialConsumeConfirm');
			if (!confirm(confirmText)) return;
		}
		setOwnedDonuts(consumeOwnedDonut(ownedDonuts, donut.id));
	}

	function applyDuplicate(donut: OwnedDonut) {
		setOwnedDonuts(duplicateOwnedDonut(ownedDonuts, donut.id));
	}

	function getPokemonNameById(pokemonId?: string): string | null {
		if (!pokemonId) return null;
		const pokemon = pokemonMap.get(pokemonId);
		if (!pokemon) return pokemonId;
		return getLocalizedPokemonName(pokemon);
	}

	function getReservationLabel(donut: OwnedDonut): string | null {
		return getPokemonNameById(donut.reservedForPokemonId);
	}

	function getTypeLabelById(typeId?: string): string {
		const resolvedTypeId = typeId ?? 'all';
		if (resolvedTypeId === 'all') {
			return $_('donuts.types.all');
		}
		return typeLabelMap.get(resolvedTypeId) ?? getTypeLabel(resolvedTypeId);
	}

	function getRecipeTitle(recipe: DonutRecipe): string {
		return recipe.nameKey ? $_(recipe.nameKey) : recipe.name;
	}

	function getDonutLabel(donut: OwnedDonut): string {
		if (donut.labelKey) return $_(donut.labelKey);
		if (donut.label.startsWith('donuts.')) return $_(donut.label);
		return donut.label;
	}

	function handlePokemonSelect(pokemon: Pokemon) {
		applyReservation(pokemon);
	}
</script>

<div class="min-h-full flex flex-col">
	<div class="mx-auto w-full max-w-5xl px-4 py-6 space-y-6 pb-24 flex-1">

	{#if activeTab === 'recipes'}
		<section class="space-y-4">
			<div class="flex items-start justify-between gap-2">
				<div>
					<h2 class="text-xl font-semibold">{$_('donuts.recommended.title')}</h2>
					<p class="app-text-muted">{$_('donuts.recommended.subtitle')}</p>
				</div>
				<button
					type="button"
					class="flex h-8 w-8 items-center justify-center rounded-full border app-border app-surface hover:bg-(--app-surface-strong) transition-colors text-lg"
					onclick={() => (showInfoModal = true)}
					aria-label={$_('donuts.infoModal.title')}
				>
					ⓘ
				</button>
			</div>

			<div class="grid gap-4">
				{#each recipesRecommended as recipe (recipe.id)}
					<article class="rounded-lg border app-card p-4 space-y-4">
						<div class="flex flex-col gap-4 md:flex-row md:items-start">
							<img
								src={recipe.imagePath}
								alt={getRecipeTitle(recipe)}
								class="h-28 w-28 rounded-md border app-border object-cover"
								loading="lazy"
							/>
							<div class="flex-1 space-y-2">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="text-lg font-semibold">{getRecipeTitle(recipe)}</h3>
									{#each recipe.tags as tag}
										<span class="inline-flex items-center rounded-full border app-chip px-2 py-0.5 text-xs font-semibold">
											{$_(`donuts.tags.${tag}`)}
										</span>
									{/each}
								</div>
								<ul class="space-y-1 text-sm">
									{#each recipe.explanationBullets ?? [] as bullet}
										<li class="flex gap-2">
											<span class="text-sm">•</span>
											<span>{bullet.startsWith('donuts.') ? $_(bullet) : bullet}</span>
										</li>
									{/each}
								</ul>
							</div>
						</div>

						{#if recipe.flavorRequirements}
						<div class="space-y-2">
							<h4 class="text-sm font-semibold uppercase tracking-wide app-text-muted">
								{$_('donuts.flavorValues')}
							</h4>
							<div class="flex flex-wrap gap-2 text-sm">
								{#if recipe.flavorRequirements.sweet}
								<div class="rounded-md border app-card-muted px-3 py-2">
									<div class="text-xs uppercase app-text-muted">{$_('donuts.flavors.sweet')}</div>
									<div class="font-semibold">{recipe.flavorRequirements.sweet}</div>
								</div>
								{/if}
								{#if recipe.flavorRequirements.spicy}
								<div class="rounded-md border app-card-muted px-3 py-2">
									<div class="text-xs uppercase app-text-muted">{$_('donuts.flavors.spicy')}</div>
									<div class="font-semibold">{recipe.flavorRequirements.spicy}</div>
								</div>
								{/if}
								{#if recipe.flavorRequirements.sour}
								<div class="rounded-md border app-card-muted px-3 py-2">
									<div class="text-xs uppercase app-text-muted">{$_('donuts.flavors.sour')}</div>
									<div class="font-semibold">{recipe.flavorRequirements.sour}</div>
								</div>
								{/if}
								{#if recipe.flavorRequirements.bitter}
								<div class="rounded-md border app-card-muted px-3 py-2">
									<div class="text-xs uppercase app-text-muted">{$_('donuts.flavors.bitter')}</div>
									<div class="font-semibold">{recipe.flavorRequirements.bitter}</div>
								</div>
								{/if}
								{#if recipe.flavorRequirements.fresh}
								<div class="rounded-md border app-card-muted px-3 py-2">
									<div class="text-xs uppercase app-text-muted">{$_('donuts.flavors.fresh')}</div>
									<div class="font-semibold">{recipe.flavorRequirements.fresh}</div>
								</div>
								{/if}
							</div>
						</div>
						{/if}

						<div class="space-y-2">
							<h4 class="text-sm font-semibold uppercase tracking-wide app-text-muted">
								{$_('donuts.ingredients')}
							</h4>
							<div class="flex flex-wrap gap-3">
								{#each recipe.ingredients as ingredient}
									{@const berry = berryMap.get(ingredient.itemId)}
									<div class="flex items-center gap-2 rounded-md border app-card-muted px-3 py-2 text-sm">
										{#if berry}
											<img src={berry.spritePath} alt="" class="h-6 w-6" loading="lazy" />
										{/if}
										<span class="font-semibold">×{ingredient.quantity}</span>
										<span>{berry ? $_(berry.nameKey) : ingredient.itemId}</span>
									</div>
								{/each}
							</div>
						</div>

						<div class="flex justify-end">
							<button
								type="button"
								class="{buttonBase} app-button-primary"
								onclick={() => openCraftModal(recipe)}
							>
								{$_('donuts.actions.crafted')}
							</button>
						</div>
					</article>
				{/each}
			</div>
		</section>

		<section class="space-y-4">
			<div>
				<h2 class="text-xl font-semibold">{$_('donuts.special.title')}</h2>
				<p class="app-text-muted">{$_('donuts.special.subtitle')}</p>
			</div>

			<div class="grid gap-4">
				{#each recipesSpecial as recipe (recipe.id)}
					<article class="rounded-lg border app-card p-4 space-y-4">
						<div class="flex flex-col gap-4 md:flex-row md:items-start">
							<img
								src={recipe.imagePath}
								alt={getRecipeTitle(recipe)}
								class="h-28 w-28 rounded-md border app-border object-cover"
								loading="lazy"
							/>
							<div class="flex-1 space-y-2">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="text-lg font-semibold">{getRecipeTitle(recipe)}</h3>
									{#each recipe.tags as tag}
										<span class="inline-flex items-center rounded-full border app-chip px-2 py-0.5 text-xs font-semibold">
											{$_(`donuts.tags.${tag}`)}
										</span>
									{/each}
								</div>
								<p class="text-sm app-text-muted">
									{$_('donuts.special.forPokemon', {
										values: {
											pokemon:
												getPokemonNameById(recipe.specialLegendaryPokemonId) ??
												$_('donuts.special.unknownPokemon')
										}
									})}
								</p>
							</div>
						</div>

						<div class="space-y-2">
							<h4 class="text-sm font-semibold uppercase tracking-wide app-text-muted">
								{$_('donuts.flavorRequirements')}
							</h4>
							<div class="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 md:grid-cols-5">
								<div class="rounded-md border app-card-muted px-3 py-2">
									<div class="text-xs uppercase app-text-muted">{$_('donuts.flavors.sweet')}</div>
									<div class="font-semibold">{recipe.flavorRequirements?.sweet}</div>
								</div>
								<div class="rounded-md border app-card-muted px-3 py-2">
									<div class="text-xs uppercase app-text-muted">{$_('donuts.flavors.spicy')}</div>
									<div class="font-semibold">{recipe.flavorRequirements?.spicy}</div>
								</div>
								<div class="rounded-md border app-card-muted px-3 py-2">
									<div class="text-xs uppercase app-text-muted">{$_('donuts.flavors.sour')}</div>
									<div class="font-semibold">{recipe.flavorRequirements?.sour}</div>
								</div>
								<div class="rounded-md border app-card-muted px-3 py-2">
									<div class="text-xs uppercase app-text-muted">{$_('donuts.flavors.bitter')}</div>
									<div class="font-semibold">{recipe.flavorRequirements?.bitter}</div>
								</div>
								<div class="rounded-md border app-card-muted px-3 py-2">
									<div class="text-xs uppercase app-text-muted">{$_('donuts.flavors.fresh')}</div>
									<div class="font-semibold">{recipe.flavorRequirements?.fresh}</div>
								</div>
							</div>
						</div>

						<div class="space-y-2">
							<h4 class="text-sm font-semibold uppercase tracking-wide app-text-muted">
								{$_('donuts.ingredients')}
							</h4>
							<div class="flex flex-wrap gap-3">
								{#each recipe.ingredients as ingredient}
									{@const berry = berryMap.get(ingredient.itemId)}
									<div class="flex items-center gap-2 rounded-md border app-card-muted px-3 py-2 text-sm">
										{#if berry}
											<img src={berry.spritePath} alt="" class="h-6 w-6" loading="lazy" />
										{/if}
										<span class="font-semibold">×{ingredient.quantity}</span>
										<span>{berry ? $_(berry.nameKey) : ingredient.itemId}</span>
									</div>
								{/each}
							</div>
						</div>

						<div class="flex justify-end">
							<button
								type="button"
								class="{buttonBase} app-button-primary"
								onclick={() => openCraftModal(recipe)}
							>
								{$_('donuts.actions.crafted')}
							</button>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{:else}
		<section class="space-y-6">
			<div>
				<h2 class="text-xl font-semibold">{$_('donuts.inventory.title')}</h2>
				<p class="app-text-muted">{$_('donuts.inventory.subtitle')}</p>
			</div>

			<div class="space-y-4">
				<h3 class="text-lg font-semibold">{$_('donuts.inventory.reserved')}</h3>
				{#if reservedDonuts.length === 0}
					<p class="app-text-muted">{$_('donuts.inventory.emptyReserved')}</p>
				{:else}
					<div class="space-y-3">
						{#each reservedDonuts as donut (donut.id)}
							<article class="rounded-lg border app-card p-4 space-y-3">
								<div class="flex flex-wrap items-start justify-between gap-2">
									<div>
										<h4 class="text-lg font-semibold">{getDonutLabel(donut)}</h4>
										<div class="flex flex-wrap gap-2 text-sm app-text-muted">
											<span class="inline-flex items-center rounded-full border app-chip px-2 py-0.5">
												{$_('donuts.inventory.sparkling', { values: { level: donut.sparklingLevel } })}
											</span>
											<span class="inline-flex items-center rounded-full border app-chip px-2 py-0.5">
												{$_('donuts.inventory.typeChip', { values: { type: getTypeLabelById(donut.typeId) } })}
											</span>
											<span>{$_('donuts.inventory.quantity', { values: { count: donut.quantity } })}</span>
										</div>
									</div>
									{#if donut.reservedForPokemonId}
										<span class="text-sm font-medium app-text-muted">
											🔒 {$_('donuts.inventory.reservedFor', { values: { pokemon: getReservationLabel(donut) } })}
										</span>
									{/if}
								</div>
								<div class="flex flex-wrap gap-2">
									<button
										type="button"
										class="{buttonBase} app-button"
										onclick={() => openReservationModal(donut)}
									>
										<span class="mr-1.5">↔</span>{$_('donuts.actions.changeReservation')}
									</button>
									<button type="button" class="{buttonBase} app-button" onclick={() => applyUnreserve(donut)}>
										<span class="mr-1.5">🔓</span>{$_('donuts.actions.unreserve')}
									</button>
									<button type="button" class="{buttonBase} app-button-destructive" onclick={() => applyConsume(donut)}>
										<span class="mr-1.5">✓</span>{$_('donuts.actions.consumed')}
									</button>
									<button
										type="button"
										class="{buttonBase} app-button"
										disabled={donut.isSpecialLegendary}
										aria-disabled={donut.isSpecialLegendary}
										onclick={() => applyDuplicate(donut)}
									>
										<span class="mr-1.5">⧉</span>{$_('donuts.actions.duplicate')}
									</button>
								</div>
							</article>
						{/each}
					</div>
				{/if}
			</div>

			<div class="space-y-4">
				<h3 class="text-lg font-semibold">{$_('donuts.inventory.available')}</h3>
				{#if availableDonuts.length === 0}
					<p class="app-text-muted">{$_('donuts.inventory.emptyAvailable')}</p>
				{:else}
					<div class="space-y-3">
						{#each availableDonuts as donut (donut.id)}
							<article class="rounded-lg border app-card p-4 space-y-3">
								<div class="flex flex-wrap items-start justify-between gap-2">
									<div>
										<h4 class="text-lg font-semibold">{getDonutLabel(donut)}</h4>
										<div class="flex flex-wrap gap-2 text-sm app-text-muted">
											<span class="inline-flex items-center rounded-full border app-chip px-2 py-0.5">
												{$_('donuts.inventory.sparkling', { values: { level: donut.sparklingLevel } })}
											</span>
											<span class="inline-flex items-center rounded-full border app-chip px-2 py-0.5">
												{$_('donuts.inventory.typeChip', { values: { type: getTypeLabelById(donut.typeId) } })}
											</span>
											<span>{$_('donuts.inventory.quantity', { values: { count: donut.quantity } })}</span>
										</div>
									</div>
								</div>
								<div class="flex flex-wrap gap-2">
									<button
										type="button"
										class="{buttonBase} app-button"
										onclick={() => openReservationModal(donut)}
									>
										<span class="mr-1.5">📌</span>{$_('donuts.actions.reserve')}
									</button>
									<button type="button" class="{buttonBase} app-button-destructive" onclick={() => applyConsume(donut)}>
										<span class="mr-1.5">✓</span>{$_('donuts.actions.consumed')}
									</button>
									<button
										type="button"
										class="{buttonBase} app-button"
										disabled={donut.isSpecialLegendary}
										aria-disabled={donut.isSpecialLegendary}
										onclick={() => applyDuplicate(donut)}
									>
										<span class="mr-1.5">⧉</span>{$_('donuts.actions.duplicate')}
									</button>
								</div>
							</article>
						{/each}
					</div>
				{/if}
			</div>
		</section>
	{/if}
	</div>

	<div class="sticky bottom-0 z-20 border-t app-border app-surface backdrop-blur-sm mt-auto">
		<div class="mx-auto w-full max-w-5xl px-4 py-3">
			<div class="flex gap-2 rounded-lg border app-border app-surface-muted p-1">
				<button
					type="button"
				class="flex-1 {buttonBase} {activeTab === 'recipes' ? 'app-button-primary' : 'app-button'}"
					onclick={() => (activeTab = 'recipes')}
				>
					{$_('donuts.tabs.recipes')}
				</button>
				<button
					type="button"
				class="flex-1 {buttonBase} {activeTab === 'inventory' ? 'app-button-primary' : 'app-button'}"
					onclick={() => (activeTab = 'inventory')}
				>
					{$_('donuts.tabs.inventory')}
				</button>
			</div>
		</div>
	</div>
</div>

{#if showSparklingModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center app-overlay p-4"
		onclick={(event) => {
			if (event.currentTarget === event.target) showSparklingModal = false;
		}}
		onkeydown={(event) => {
			if (event.key === 'Escape') showSparklingModal = false;
		}}
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="sparkling-modal-title"
	>
		<div class="w-full max-w-md space-y-4 rounded-lg border app-card p-6">
			<div class="flex items-center justify-between">
				<h2 id="sparkling-modal-title" class="text-xl font-bold">
					{$_('donuts.craftModal.title')}
				</h2>
				<button
					type="button"
					class="text-2xl leading-none app-text-subtle hover:text-(--app-text)"
					onclick={() => (showSparklingModal = false)}
					aria-label={$_('donuts.actions.close')}
				>
					×
				</button>
			</div>

			{#if craftingRecipe}
				<p class="app-text-muted">{getRecipeTitle(craftingRecipe)}</p>
			{/if}

			<div class="space-y-4">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<span class="text-sm font-semibold">{$_('donuts.sparkling.legend')}</span>
					<div class="flex gap-2">
						{#each sparklingLevels as level}
							<button
								type="button"
								class="{buttonBase} min-w-[56px] {sparklingSelection === level
									? 'app-button-primary'
									: 'app-button'}"
								onclick={() => (sparklingSelection = level)}
							>
								{level}
							</button>
						{/each}
					</div>
				</div>

				<div class="space-y-2">
					<label class="text-sm font-semibold" for="donut-type-select">
						{$_('donuts.type.label')}
					</label>
					<select
						id="donut-type-select"
						class="w-full rounded-md border app-border app-surface px-3 py-2 text-sm"
						bind:value={selectedTypeId}
					>
						<option value="all">{$_('donuts.types.all')}</option>
						{#each typeOptions as option}
							<option value={option.id}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="flex justify-end gap-2">
				<button type="button" class="{buttonBase} app-button" onclick={() => (showSparklingModal = false)}>
					{$_('donuts.actions.cancel')}
				</button>
				<button type="button" class="{buttonBase} app-button-primary" onclick={confirmCraft}>
					{$_('donuts.actions.confirm')}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showReservationModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center app-overlay p-4"
		onclick={(event) => {
			if (event.currentTarget === event.target) closeReservationModal();
		}}
		onkeydown={(event) => {
			if (event.key === 'Escape') closeReservationModal();
		}}
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="reservation-modal-title"
	>
		<div class="w-full max-w-lg space-y-4 rounded-lg border app-card p-6">
			<div class="flex items-center justify-between">
				<h2 id="reservation-modal-title" class="text-xl font-bold">
					{$_('donuts.reservationModal.title')}
				</h2>
				<button
					type="button"
					class="text-2xl leading-none app-text-subtle hover:text-(--app-text)"
					onclick={closeReservationModal}
					aria-label={$_('donuts.actions.close')}
				>
					×
				</button>
			</div>

			{#if reservationTarget}
				<p class="app-text-muted">{getDonutLabel(reservationTarget)}</p>
			{/if}

			<div class="space-y-2">
				<label class="text-sm font-semibold">
					{$_('donuts.reservationModal.searchLabel')}
				</label>
				<PokemonSearch onSelect={handlePokemonSelect} />
			</div>
		</div>
	</div>
{/if}

{#if showInfoModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center app-overlay p-4"
		onclick={(event) => {
			if (event.currentTarget === event.target) showInfoModal = false;
		}}
		onkeydown={(event) => {
			if (event.key === 'Escape') showInfoModal = false;
		}}
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="info-modal-title"
	>
		<div class="w-full max-w-lg rounded-lg border app-card p-6 max-h-[80vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-4">
				<h2 id="info-modal-title" class="text-xl font-bold">
					{$_('donuts.infoModal.title')}
				</h2>
				<button
					type="button"
					class="text-2xl leading-none app-text-subtle hover:text-(--app-text)"
					onclick={() => (showInfoModal = false)}
					aria-label={$_('donuts.actions.close')}
				>
					×
				</button>
			</div>

			<div class="space-y-6">
				<section class="space-y-3">
					<h3 class="text-lg font-semibold">{$_('donuts.infoModal.flavorPowersTitle')}</h3>
					<p class="text-sm app-text-muted">{$_('donuts.infoModal.flavorPowersIntro')}</p>
					<ul class="space-y-2 text-sm">
						<li class="flex gap-2">
							<span class="font-semibold min-w-16">{$_('donuts.flavors.sweet')}</span>
							<span class="app-text-muted">{$_('donuts.infoModal.powers.sweet')}</span>
						</li>
						<li class="flex gap-2">
							<span class="font-semibold min-w-16">{$_('donuts.flavors.spicy')}</span>
							<span class="app-text-muted">{$_('donuts.infoModal.powers.spicy')}</span>
						</li>
						<li class="flex gap-2">
							<span class="font-semibold min-w-16">{$_('donuts.flavors.sour')}</span>
							<span class="app-text-muted">{$_('donuts.infoModal.powers.sour')}</span>
						</li>
						<li class="flex gap-2">
							<span class="font-semibold min-w-16">{$_('donuts.flavors.bitter')}</span>
							<span class="app-text-muted">{$_('donuts.infoModal.powers.bitter')}</span>
						</li>
						<li class="flex gap-2">
							<span class="font-semibold min-w-16">{$_('donuts.flavors.fresh')}</span>
							<span class="app-text-muted">{$_('donuts.infoModal.powers.fresh')}</span>
						</li>
					</ul>
				</section>

				<section class="space-y-3">
					<h3 class="text-lg font-semibold">{$_('donuts.infoModal.levelChancesTitle')}</h3>
					<p class="text-sm app-text-muted">{$_('donuts.infoModal.levelChancesIntro')}</p>
					<ul class="space-y-2 text-sm">
						<li class="flex gap-2">
							<span class="font-semibold min-w-20">760+</span>
							<span class="app-text-muted">{$_('donuts.infoModal.thresholds.760')}</span>
						</li>
						<li class="flex gap-2">
							<span class="font-semibold min-w-20">700+</span>
							<span class="app-text-muted">{$_('donuts.infoModal.thresholds.700')}</span>
						</li>
						<li class="flex gap-2">
							<span class="font-semibold min-w-20">525+</span>
							<span class="app-text-muted">{$_('donuts.infoModal.thresholds.525')}</span>
						</li>
					</ul>
					<p class="text-sm app-text-muted italic">{$_('donuts.infoModal.rainbowNote')}</p>
				</section>

				<section class="space-y-2">
					<p class="text-sm app-text-muted">{$_('donuts.infoModal.moreInfo')}</p>
					<a
						href="https://www.serebii.net/legendsz-a/anshasdonuts.shtml"
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm font-semibold underline hover:no-underline"
					>
						{$_('donuts.infoModal.serebiiLink')} ↗
					</a>
				</section>
			</div>
		</div>
	</div>
{/if}
