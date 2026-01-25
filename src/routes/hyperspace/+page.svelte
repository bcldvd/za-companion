<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { CircleOff } from 'lucide-svelte';
	import {
		computeHyperspaceTimes,
		type CalculatorInput,
		type Method,
		type DonutLevel
	} from '$lib/hyperspace/hyperspaceCalculator.js';

	// Input state
	let method = $state<Method>('auto');
	let shinyDonutLevel = $state<DonutLevel>(3);
	let alphaDonutLevel = $state<DonutLevel>(0);
	let shinyCharm = $state(true);
	let pokemonPerReset = $state(10);
	let pokemonPerResetInput = $state('10');

	// Modal state
	let showHowItWorks = $state(false);
	let showShalphaResults = $state(false);

	// Last valid result (for graceful invalid handling)
	let lastValidResult: ReturnType<typeof computeHyperspaceTimes> | null = null;

	// Validate and update pokemonPerReset
	function updatePokemonPerReset(value: string) {
		pokemonPerResetInput = value;
		const num = Number.parseInt(value, 10);
		if (!Number.isNaN(num) && num >= 1 && num <= 50) {
			pokemonPerReset = num;
		}
	}

	// Set pokemon per reset from preset
	function setPreset(value: number) {
		pokemonPerReset = value;
		pokemonPerResetInput = String(value);
	}

	function handleModalBackdropClick(e: MouseEvent) {
		// Only close when clicking the backdrop itself (not the modal content)
		if (e.target === e.currentTarget) {
			showHowItWorks = false;
		}
	}

	let results = $derived.by(() => {
		const input: CalculatorInput = {
			method,
			shinyDonutLevel,
			alphaDonutLevel,
			shinyCharm,
			pokemonPerReset
		};
		const computed = computeHyperspaceTimes(input);
		if (isPokemonPerResetValid) {
			lastValidResult = computed;
			return computed;
		}
		return lastValidResult;
	});

	// Check if pokemonPerReset is valid
	let isPokemonPerResetValid = $derived.by(() => {
		const num = Number.parseInt(pokemonPerResetInput, 10);
		return !Number.isNaN(num) && num >= 1 && num <= 50;
	});
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 p-4 text-white">
	<div class="mx-auto max-w-6xl">
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Results Section -->
			<div class="order-1 h-fit lg:sticky lg:top-4 lg:order-2">
				<div class="space-y-4 rounded-lg border border-blue-700 bg-blue-800/50 p-6">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-bold">{$_('hyperspace.results.title')}</h2>
						<button
							type="button"
							class="text-sm text-blue-300 underline hover:text-white"
							onclick={() => (showHowItWorks = true)}
						>
							{$_('hyperspace.results.howItWorks')}
						</button>
					</div>

					{#if results}
						{@const shalphaAvailable = alphaDonutLevel > 0 && results.shalphaProbability > 0}
						{@const isShalpha = shalphaAvailable && showShalphaResults}
						{@const encounter99 = isShalpha
							? results.encounters99ShalphaFormatted
							: results.encounters99Formatted}
						{@const encounter95 = isShalpha
							? results.encounters95ShalphaFormatted
							: results.encounters95Formatted}
						{@const encounter90 = isShalpha
							? results.encounters90ShalphaFormatted
							: results.encounters90Formatted}
						{@const encounter50 = isShalpha
							? results.encounters50ShalphaFormatted
							: results.encounters50Formatted}
						{@const encounterAvg = isShalpha
							? results.encountersAvgShalphaFormatted
							: results.encountersAvgFormatted}
						{@const footnote = $_('hyperspace.results.footnote')}
						<div class="mb-3 text-xs text-blue-300">
							{$_('hyperspace.results.encountersRequired', {
								values: { count: results.encountersAvgFormatted }
							})}
						</div>
						{#if shalphaAvailable}
							<div class="mb-3 flex items-center justify-between rounded-lg border border-blue-600 bg-blue-900/50 px-3 py-2">
								<span class="text-sm font-semibold text-blue-200">
									{$_('hyperspace.results.shalphaTitle')}
								</span>
								<button
									type="button"
									class="rounded-full px-3 py-1 text-xs font-semibold transition-colors {showShalphaResults
										? 'bg-yellow-500/20 text-yellow-200'
										: 'bg-blue-800/60 text-blue-300 hover:text-white'}"
									aria-pressed={showShalphaResults}
									onclick={() => (showShalphaResults = !showShalphaResults)}
								>
									{showShalphaResults ? 'ON' : 'OFF'}
								</button>
							</div>
						{/if}
						<!-- Primary Result: 99% chance -->
						<div class="rounded-lg border border-blue-600 bg-blue-900/50 p-4">
							<div class="mb-1 text-sm text-blue-300">{$_('hyperspace.results.primaryLabel')}</div>
							<div class="text-3xl font-bold">
								{isShalpha ? results.t99ShalphaFormatted : results.t99Formatted}
							</div>
							<div class="mt-1 text-xs text-blue-300">
								{$_('hyperspace.results.encountersSince', { values: { count: encounter99 } })}
							</div>
						</div>

						<!-- Secondary Results: 50%, 90%, 95% -->
						<div class="flex flex-wrap gap-2">
							<div class="rounded border border-blue-700 bg-blue-900/50 px-3 py-2">
								<div class="text-xs text-blue-300">50%</div>
								<div class="text-sm font-semibold">
									{isShalpha ? results.t50ShalphaFormatted : results.t50Formatted}
								</div>
								<div class="text-[10px] text-blue-400">
									{$_('hyperspace.results.encountersSince', { values: { count: encounter50 } })}
								</div>
							</div>
							<div class="rounded border border-blue-700 bg-blue-900/50 px-3 py-2">
								<div class="text-xs text-blue-300">90%</div>
								<div class="text-sm font-semibold">
									{isShalpha ? results.t90ShalphaFormatted : results.t90Formatted}
								</div>
								<div class="text-[10px] text-blue-400">
									{$_('hyperspace.results.encountersSince', { values: { count: encounter90 } })}
								</div>
							</div>
							<div class="rounded border border-blue-700 bg-blue-900/50 px-3 py-2">
								<div class="text-xs text-blue-300">95%</div>
								<div class="text-sm font-semibold">
									{isShalpha ? results.t95ShalphaFormatted : results.t95Formatted}
								</div>
								<div class="text-[10px] text-blue-400">
									{$_('hyperspace.results.encountersSince', { values: { count: encounter95 } })}
								</div>
							</div>
						</div>

						<!-- Average Time -->
						<div class="text-sm text-blue-300">
							{$_('hyperspace.results.average')}:
							<span class="font-semibold text-white">
								{isShalpha ? results.tAvgShalphaFormatted : results.tAvgFormatted}
							</span>
						</div>
						<div class="text-[10px] text-blue-400">
							{$_('hyperspace.results.encountersSince', { values: { count: encounterAvg } })}
						</div>

						<!-- Footnote -->
						{#if footnote}
							<div class="border-t border-blue-700 pt-2 text-xs text-blue-400">
								{footnote}
							</div>
						{/if}
					{:else}
						<div class="text-sm text-blue-300">{$_('hyperspace.results.enterValid')}</div>
					{/if}
				</div>
			</div>

			<!-- Inputs Section -->
			<div class="order-2 space-y-6 pb-10 lg:order-1">
				<!-- Method Selection -->
				<div>
					<div class="mb-2 block text-sm font-medium text-blue-200">
						{$_('hyperspace.method.label')}
					</div>
					<div class="flex gap-2 rounded-lg border border-blue-700 bg-blue-800/50 p-1">
						<button
							type="button"
							class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {method ===
							'auto'
								? 'bg-blue-600 text-white'
								: 'text-blue-300 hover:bg-blue-700/50'}"
							onclick={() => (method = 'auto')}
						>
							{$_('hyperspace.method.auto')}
						</button>
						<button
							type="button"
							class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {method ===
							'manual'
								? 'bg-blue-600 text-white'
								: 'text-blue-300 hover:bg-blue-700/50'}"
							onclick={() => (method = 'manual')}
						>
							{$_('hyperspace.method.manual')}
						</button>
					</div>
				</div>

				<!-- Shiny Donut Level -->
				<div>
					<div class="mb-2 text-sm font-medium text-blue-200">
						{$_('hyperspace.shinyDonut.label')}
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<svg
							class="h-4 w-4 text-yellow-300 transition-opacity {shinyDonutLevel === 0
								? 'opacity-40'
								: 'opacity-100'}"
							fill="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
						>
							<g transform="translate(12 12) scale(1.25) translate(-11.8 -8.6)">
								<path
									d="M9.2 4
									   C9.9 7.3 11.2 8.6 14.5 9.3
									   C11.2 10.0 9.9 11.3 9.2 14.6
									   C8.5 11.3 7.2 10.0 3.9 9.3
									   C7.2 8.6 8.5 7.3 9.2 4
									   Z"
									fill="currentColor"
								/>
								<path
									d="M16.8 2.6
									   C17.2 4.4 17.9 5.1 19.7 5.5
									   C17.9 5.9 17.2 6.6 16.8 8.4
									   C16.4 6.6 15.7 5.9 13.9 5.5
									   C15.7 5.1 16.4 4.4 16.8 2.6
									   Z"
									fill="currentColor"
									opacity="0.95"
								/>
							</g>
						</svg>
						{#each [0, 1, 2, 3] as level (level)}
							{@const isSelected = shinyDonutLevel === level}
							<button
								type="button"
								class="rounded-full px-4 py-2 text-sm font-medium transition-colors {isSelected
									? 'bg-blue-600 text-white'
									: 'border border-blue-700 bg-blue-800/50 text-blue-300 hover:bg-blue-700/50'}"
								onclick={() => (shinyDonutLevel = level as DonutLevel)}
							>
								{#if level === 0}
									<span class="sr-only">{$_('hyperspace.level.off')}</span>
									<CircleOff class="h-4 w-4" aria-hidden="true" />
								{:else}
									{$_('hyperspace.level.lv', { values: { level } })}
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<!-- Alpha Donut Level -->
				<div>
					<div class="mb-2 text-sm font-medium text-blue-200">
						{$_('hyperspace.alphaDonut.label')}
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<img
							src="/icons/alpha.png"
							alt=""
							class="h-4 w-4 transition-opacity {alphaDonutLevel === 0
								? 'opacity-40'
								: 'opacity-100'}"
							aria-hidden="true"
						/>
						{#each [0, 1, 2, 3] as level (level)}
							{@const isSelected = alphaDonutLevel === level}
							<button
								type="button"
								class="rounded-full px-4 py-2 text-sm font-medium transition-colors {isSelected
									? 'bg-blue-600 text-white'
									: 'border border-blue-700 bg-blue-800/50 text-blue-300 hover:bg-blue-700/50'}"
								onclick={() => (alphaDonutLevel = level as DonutLevel)}
							>
								{#if level === 0}
									<span class="sr-only">{$_('hyperspace.level.off')}</span>
									<CircleOff class="h-4 w-4" aria-hidden="true" />
								{:else}
									{$_('hyperspace.level.lv', { values: { level } })}
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<!-- Pokémon per Reset -->
				<div>
					<label for="pokemon-per-reset" class="mb-2 block text-sm font-medium text-blue-200">
						{$_('hyperspace.pokemonPerReset.label')}
					</label>
					<div class="flex items-center gap-2">
						<input
							id="pokemon-per-reset"
							type="number"
							min="1"
							max="50"
							value={pokemonPerResetInput}
							oninput={(e) => updatePokemonPerReset(e.currentTarget.value)}
							class="w-20 rounded-lg border border-blue-700 bg-blue-800/50 px-3 py-2 text-white focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none {!isPokemonPerResetValid
								? 'border-red-500'
								: ''}"
						/>
						<div class="flex gap-1">
							{#each [5, 10, 15, 20] as preset (preset)}
								<button
									type="button"
									class="rounded border border-blue-700 bg-blue-800/50 px-3 py-1 text-xs text-blue-300 transition-colors hover:bg-blue-700/50"
									onclick={() => setPreset(preset)}
								>
									{preset}
								</button>
							{/each}
						</div>
					</div>
					{#if !isPokemonPerResetValid}
						<p class="mt-1 text-xs text-red-400">{$_('hyperspace.pokemonPerReset.hint')}</p>
					{/if}
				</div>

				<!-- Shiny Charm -->
				<div>
					<div class="flex items-center justify-between rounded-lg border border-blue-700 bg-blue-800/50 px-3 py-2">
						<div class="flex items-center gap-2 text-sm font-medium text-blue-200">
							<img
								src="/icons/chrome-charm.png"
								alt=""
								class="h-4 w-4 transition-opacity {shinyCharm ? 'opacity-100' : 'opacity-40'}"
								aria-hidden="true"
							/>
							{$_('hyperspace.charm.label')}
						</div>
						<button
							type="button"
							class="rounded-full px-3 py-1 text-xs font-semibold transition-colors {shinyCharm
								? 'bg-yellow-500/20 text-yellow-200'
								: 'bg-blue-800/60 text-blue-300 hover:text-white'}"
							aria-pressed={shinyCharm}
							onclick={() => (shinyCharm = !shinyCharm)}
						>
							{shinyCharm ? $_('hyperspace.charm.on') : $_('hyperspace.charm.off')}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- How it works Modal -->
{#if showHowItWorks}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={handleModalBackdropClick}
		onkeydown={(e) => {
			if (e.key === 'Escape') showHowItWorks = false;
		}}
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<div class="w-full max-w-lg space-y-4 rounded-lg border border-blue-700 bg-blue-900 p-6">
			<div class="flex items-center justify-between">
				<h2 id="modal-title" class="text-xl font-bold">{$_('hyperspace.modal.title')}</h2>
				<button
					type="button"
					class="text-2xl leading-none text-blue-300 hover:text-white"
					onclick={() => (showHowItWorks = false)}
					aria-label="Close"
				>
					×
				</button>
			</div>

			<div class="space-y-3 text-sm text-blue-200">
				<p>{$_('hyperspace.modal.intro')}</p>

				<div>
					<h3 class="mb-1 font-semibold text-white">{$_('hyperspace.modal.encounterRateTitle')}</h3>
					<p>
						{$_('hyperspace.modal.encounterRateFormula')}
						<br />
						<span class="text-blue-300">
							{$_('hyperspace.modal.currentRate', {
								values: { rate: results ? results.encountersPerMinute.toFixed(1) : '—' }
							})}
						</span>
					</p>
				</div>

				<div>
					<h3 class="mb-1 font-semibold text-white">{$_('hyperspace.modal.probabilityTitle')}</h3>
					<p>
						{$_('hyperspace.modal.probabilityBody')}
						<br />
						<code class="rounded bg-blue-950 px-2 py-1 text-blue-100">P(≥1) = 1 − (1 − p)^N</code>
						<br />
						{$_('hyperspace.modal.probabilityExplain')}
					</p>
				</div>

				<div>
					<h3 class="mb-1 font-semibold text-white">{$_('hyperspace.modal.timeTitle')}</h3>
					<p>
						{$_('hyperspace.modal.timeBody')}
					</p>
				</div>

				{#if alphaDonutLevel > 0}
					<div>
						<h3 class="mb-1 font-semibold text-white">{$_('hyperspace.modal.shalphaTitle')}</h3>
						<p>
							{$_('hyperspace.modal.shalphaBody')}
							<br />
							<code class="rounded bg-blue-950 px-2 py-1 text-blue-100">
								p_shalpha = p_shiny × p_alpha
							</code>
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Ensure modal backdrop is clickable */
</style>
