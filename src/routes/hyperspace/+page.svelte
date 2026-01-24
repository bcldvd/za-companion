<script lang="ts">
	import { _ } from 'svelte-i18n';
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

	// Last valid result (for graceful invalid handling)
	let lastValidResult = $state<ReturnType<typeof computeHyperspaceTimes> | null>(null);

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

	// Compute results reactively
	let computed = $derived.by(() => {
		const input: CalculatorInput = {
			method,
			shinyDonutLevel,
			alphaDonutLevel,
			shinyCharm,
			pokemonPerReset
		};
		return computeHyperspaceTimes(input);
	});

	$effect(() => {
		if (isPokemonPerResetValid) {
			lastValidResult = computed;
		}
	});

	let results = $derived.by(() => (isPokemonPerResetValid ? computed : lastValidResult));

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
						<!-- Primary Result: 99% chance -->
						<div class="rounded-lg border border-blue-600 bg-blue-900/50 p-4">
							<div class="mb-1 text-sm text-blue-300">{$_('hyperspace.results.primaryLabel')}</div>
							<div class="text-3xl font-bold">{results.t99Formatted}</div>
						</div>

						<!-- Secondary Results: 50%, 90%, 95% -->
						<div class="flex flex-wrap gap-2">
							<div class="rounded border border-blue-700 bg-blue-900/50 px-3 py-2">
								<div class="text-xs text-blue-300">50%</div>
								<div class="text-sm font-semibold">{results.t50Formatted}</div>
							</div>
							<div class="rounded border border-blue-700 bg-blue-900/50 px-3 py-2">
								<div class="text-xs text-blue-300">90%</div>
								<div class="text-sm font-semibold">{results.t90Formatted}</div>
							</div>
							<div class="rounded border border-blue-700 bg-blue-900/50 px-3 py-2">
								<div class="text-xs text-blue-300">95%</div>
								<div class="text-sm font-semibold">{results.t95Formatted}</div>
							</div>
						</div>

						<!-- Average Time -->
						<div class="text-sm text-blue-300">
							{$_('hyperspace.results.average')}:
							<span class="font-semibold text-white">{results.tAvgFormatted}</span>
						</div>

						<!-- Shalpha Results (if alpha donut is enabled) -->
						{#if alphaDonutLevel > 0 && results.shalphaProbability > 0}
							<div class="border-t border-blue-700 pt-4">
								<h3 class="mb-3 text-sm font-semibold text-blue-200">
									{$_('hyperspace.results.shalphaTitle')}
								</h3>
								<div class="mb-3 rounded-lg border border-blue-600 bg-blue-900/50 p-4">
									<div class="mb-1 text-sm text-blue-300">
										{$_('hyperspace.results.primaryLabel')}
									</div>
									<div class="text-2xl font-bold">{results.t99ShalphaFormatted}</div>
								</div>
								<div class="flex flex-wrap gap-2">
									<div class="rounded border border-blue-700 bg-blue-900/50 px-3 py-2">
										<div class="text-xs text-blue-300">50%</div>
										<div class="text-sm font-semibold">{results.t50ShalphaFormatted}</div>
									</div>
									<div class="rounded border border-blue-700 bg-blue-900/50 px-3 py-2">
										<div class="text-xs text-blue-300">90%</div>
										<div class="text-sm font-semibold">{results.t90ShalphaFormatted}</div>
									</div>
									<div class="rounded border border-blue-700 bg-blue-900/50 px-3 py-2">
										<div class="text-xs text-blue-300">95%</div>
										<div class="text-sm font-semibold">{results.t95ShalphaFormatted}</div>
									</div>
								</div>
								<div class="mt-2 text-sm text-blue-300">
									{$_('hyperspace.results.average')}:
									<span class="font-semibold text-white">{results.tAvgShalphaFormatted}</span>
								</div>
							</div>
						{/if}

						<!-- Footnote -->
						<div class="border-t border-blue-700 pt-2 text-xs text-blue-400">
							{$_('hyperspace.results.footnote')}
						</div>
					{:else}
						<div class="text-sm text-blue-300">{$_('hyperspace.results.enterValid')}</div>
					{/if}
				</div>
			</div>

			<!-- Inputs Section -->
			<div class="order-2 space-y-6 lg:order-1">
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
					<div class="mb-2 block text-sm font-medium text-blue-200">
						{$_('hyperspace.shinyDonut.label')}
					</div>
					<div class="flex flex-wrap gap-2">
						{#each [0, 1, 2, 3] as level}
							{@const isSelected = shinyDonutLevel === level}
							<button
								type="button"
								class="rounded-full px-4 py-2 text-sm font-medium transition-colors {isSelected
									? 'bg-blue-600 text-white'
									: 'border border-blue-700 bg-blue-800/50 text-blue-300 hover:bg-blue-700/50'}"
								onclick={() => (shinyDonutLevel = level as DonutLevel)}
							>
								{level === 0
									? $_('hyperspace.level.off')
									: $_('hyperspace.level.lv', { values: { level } })}
							</button>
						{/each}
					</div>
				</div>

				<!-- Alpha Donut Level -->
				<div>
					<div class="mb-2 block text-sm font-medium text-blue-200">
						{$_('hyperspace.alphaDonut.label')}
					</div>
					<div class="flex flex-wrap gap-2">
						{#each [0, 1, 2, 3] as level}
							{@const isSelected = alphaDonutLevel === level}
							<button
								type="button"
								class="rounded-full px-4 py-2 text-sm font-medium transition-colors {isSelected
									? 'bg-blue-600 text-white'
									: 'border border-blue-700 bg-blue-800/50 text-blue-300 hover:bg-blue-700/50'}"
								onclick={() => (alphaDonutLevel = level as DonutLevel)}
							>
								{level === 0
									? $_('hyperspace.level.off')
									: $_('hyperspace.level.lv', { values: { level } })}
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
							{#each [5, 10, 15, 20] as preset}
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
					<div class="mb-2 block text-sm font-medium text-blue-200">
						{$_('hyperspace.charm.label')}
					</div>
					<div class="flex gap-2 rounded-lg border border-blue-700 bg-blue-800/50 p-1">
						<button
							type="button"
							class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {shinyCharm
								? 'bg-blue-600 text-white'
								: 'text-blue-300 hover:bg-blue-700/50'}"
							onclick={() => (shinyCharm = true)}
						>
							{$_('hyperspace.charm.on')}
						</button>
						<button
							type="button"
							class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors {!shinyCharm
								? 'bg-blue-600 text-white'
								: 'text-blue-300 hover:bg-blue-700/50'}"
							onclick={() => (shinyCharm = false)}
						>
							{$_('hyperspace.charm.off')}
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
		onclick={() => (showHowItWorks = false)}
		onkeydown={(e) => {
			if (e.key === 'Escape') showHowItWorks = false;
		}}
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<div
			class="w-full max-w-lg space-y-4 rounded-lg border border-blue-700 bg-blue-900 p-6"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === 'Escape') showHowItWorks = false;
			}}
			role="document"
			tabindex="0"
		>
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
