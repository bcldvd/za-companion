<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { computeHyperspaceTimes, type CalculatorInput, type Method, type DonutLevel } from '$lib/hyperspace/hyperspaceCalculator.js';

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

<div class="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 text-white p-4">
	<div class="max-w-6xl mx-auto">
		<div class="text-center py-8 mb-8">
			<h1 class="text-4xl font-bold mb-2">{$_('hyperspace.title')}</h1>
			<p class="text-blue-300">{$_('hyperspace.subtitle')}</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Inputs Section -->
			<div class="space-y-6">
				<!-- Method Selection -->
				<div>
					<label class="block text-sm font-medium mb-2 text-blue-200">{$_('hyperspace.method.label')}</label>
					<div class="flex gap-2 bg-blue-800/50 rounded-lg p-1 border border-blue-700">
						<button
							type="button"
							class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors {method === 'auto'
								? 'bg-blue-600 text-white'
								: 'text-blue-300 hover:bg-blue-700/50'}"
							onclick={() => (method = 'auto')}
						>
							{$_('hyperspace.method.auto')}
						</button>
						<button
							type="button"
							class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors {method === 'manual'
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
					<label class="block text-sm font-medium mb-2 text-blue-200">{$_('hyperspace.shinyDonut.label')}</label>
					<div class="flex gap-2 flex-wrap">
						{#each [0, 1, 2, 3] as level}
							{@const isSelected = shinyDonutLevel === level}
							<button
								type="button"
								class="px-4 py-2 rounded-full text-sm font-medium transition-colors {isSelected
									? 'bg-blue-600 text-white'
									: 'bg-blue-800/50 text-blue-300 hover:bg-blue-700/50 border border-blue-700'}"
								onclick={() => (shinyDonutLevel = level as DonutLevel)}
							>
							{level === 0 ? $_('hyperspace.level.off') : $_('hyperspace.level.lv', { values: { level } })}
							</button>
						{/each}
					</div>
				</div>

				<!-- Alpha Donut Level -->
				<div>
					<label class="block text-sm font-medium mb-2 text-blue-200">{$_('hyperspace.alphaDonut.label')}</label>
					<div class="flex gap-2 flex-wrap">
						{#each [0, 1, 2, 3] as level}
							{@const isSelected = alphaDonutLevel === level}
							<button
								type="button"
								class="px-4 py-2 rounded-full text-sm font-medium transition-colors {isSelected
									? 'bg-blue-600 text-white'
									: 'bg-blue-800/50 text-blue-300 hover:bg-blue-700/50 border border-blue-700'}"
								onclick={() => (alphaDonutLevel = level as DonutLevel)}
							>
							{level === 0 ? $_('hyperspace.level.off') : $_('hyperspace.level.lv', { values: { level } })}
							</button>
						{/each}
					</div>
				</div>

				<!-- Shiny Charm -->
				<div>
					<label class="block text-sm font-medium mb-2 text-blue-200">{$_('hyperspace.charm.label')}</label>
					<div class="flex gap-2 bg-blue-800/50 rounded-lg p-1 border border-blue-700">
						<button
							type="button"
							class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors {shinyCharm
								? 'bg-blue-600 text-white'
								: 'text-blue-300 hover:bg-blue-700/50'}"
							onclick={() => (shinyCharm = true)}
						>
							{$_('hyperspace.charm.on')}
						</button>
						<button
							type="button"
							class="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors {!shinyCharm
								? 'bg-blue-600 text-white'
								: 'text-blue-300 hover:bg-blue-700/50'}"
							onclick={() => (shinyCharm = false)}
						>
							{$_('hyperspace.charm.off')}
						</button>
					</div>
				</div>

				<!-- Pokémon per Reset -->
				<div>
					<label class="block text-sm font-medium mb-2 text-blue-200">
						{$_('hyperspace.pokemonPerReset.label')}
					</label>
					<div class="flex gap-2 items-center">
					<input
						type="number"
						min="1"
						max="50"
						value={pokemonPerResetInput}
						oninput={(e) => updatePokemonPerReset(e.currentTarget.value)}
							class="w-20 px-3 py-2 rounded-lg bg-blue-800/50 border border-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent {!isPokemonPerResetValid
								? 'border-red-500'
								: ''}"
						/>
						<div class="flex gap-1">
							{#each [5, 10, 15, 20] as preset}
								<button
									type="button"
									class="px-3 py-1 text-xs rounded bg-blue-800/50 text-blue-300 hover:bg-blue-700/50 border border-blue-700 transition-colors"
									onclick={() => setPreset(preset)}
								>
									{preset}
								</button>
							{/each}
						</div>
					</div>
					{#if !isPokemonPerResetValid}
						<p class="text-red-400 text-xs mt-1">{$_('hyperspace.pokemonPerReset.hint')}</p>
					{/if}
				</div>
			</div>

			<!-- Results Section -->
			<div class="lg:sticky lg:top-4 h-fit">
				<div class="bg-blue-800/50 rounded-lg border border-blue-700 p-6 space-y-4">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-bold">{$_('hyperspace.results.title')}</h2>
						<button
							type="button"
							class="text-sm text-blue-300 hover:text-white underline"
							onclick={() => (showHowItWorks = true)}
						>
							{$_('hyperspace.results.howItWorks')}
						</button>
					</div>

					{#if results}
						<!-- Primary Result: 99% chance -->
						<div class="bg-blue-900/50 rounded-lg p-4 border border-blue-600">
							<div class="text-sm text-blue-300 mb-1">{$_('hyperspace.results.primaryLabel')}</div>
							<div class="text-3xl font-bold">{results.t99Formatted}</div>
						</div>

						<!-- Secondary Results: 50%, 90%, 95% -->
						<div class="flex gap-2 flex-wrap">
							<div class="bg-blue-900/50 rounded px-3 py-2 border border-blue-700">
							<div class="text-xs text-blue-300">50%</div>
								<div class="text-sm font-semibold">{results.t50Formatted}</div>
							</div>
							<div class="bg-blue-900/50 rounded px-3 py-2 border border-blue-700">
							<div class="text-xs text-blue-300">90%</div>
								<div class="text-sm font-semibold">{results.t90Formatted}</div>
							</div>
							<div class="bg-blue-900/50 rounded px-3 py-2 border border-blue-700">
							<div class="text-xs text-blue-300">95%</div>
								<div class="text-sm font-semibold">{results.t95Formatted}</div>
							</div>
						</div>

						<!-- Average Time -->
						<div class="text-sm text-blue-300">
							{$_('hyperspace.results.average')}: <span class="font-semibold text-white">{results.tAvgFormatted}</span>
						</div>

						<!-- Shalpha Results (if alpha donut is enabled) -->
						{#if alphaDonutLevel > 0 && results.shalphaProbability > 0}
							<div class="pt-4 border-t border-blue-700">
								<h3 class="text-sm font-semibold mb-3 text-blue-200">{$_('hyperspace.results.shalphaTitle')}</h3>
								<div class="bg-blue-900/50 rounded-lg p-4 border border-blue-600 mb-3">
									<div class="text-sm text-blue-300 mb-1">{$_('hyperspace.results.primaryLabel')}</div>
									<div class="text-2xl font-bold">{results.t99ShalphaFormatted}</div>
								</div>
								<div class="flex gap-2 flex-wrap">
									<div class="bg-blue-900/50 rounded px-3 py-2 border border-blue-700">
								<div class="text-xs text-blue-300">50%</div>
										<div class="text-sm font-semibold">{results.t50ShalphaFormatted}</div>
									</div>
									<div class="bg-blue-900/50 rounded px-3 py-2 border border-blue-700">
								<div class="text-xs text-blue-300">90%</div>
										<div class="text-sm font-semibold">{results.t90ShalphaFormatted}</div>
									</div>
									<div class="bg-blue-900/50 rounded px-3 py-2 border border-blue-700">
								<div class="text-xs text-blue-300">95%</div>
										<div class="text-sm font-semibold">{results.t95ShalphaFormatted}</div>
									</div>
								</div>
							<div class="text-sm text-blue-300 mt-2">
								{$_('hyperspace.results.average')}: <span class="font-semibold text-white">{results.tAvgShalphaFormatted}</span>
								</div>
							</div>
						{/if}

						<!-- Footnote -->
						<div class="text-xs text-blue-400 pt-2 border-t border-blue-700">
							{$_('hyperspace.results.footnote')}
						</div>
					{:else}
						<div class="text-blue-300 text-sm">{$_('hyperspace.results.enterValid')}</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- How it works Modal -->
{#if showHowItWorks}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={() => (showHowItWorks = false)}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<div
			class="bg-blue-900 rounded-lg border border-blue-700 max-w-lg w-full p-6 space-y-4"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between">
				<h2 id="modal-title" class="text-xl font-bold">{$_('hyperspace.modal.title')}</h2>
				<button
					type="button"
					class="text-blue-300 hover:text-white text-2xl leading-none"
					onclick={() => (showHowItWorks = false)}
					aria-label="Close"
				>
					×
				</button>
			</div>

			<div class="space-y-3 text-sm text-blue-200">
				<p>{$_('hyperspace.modal.intro')}</p>

				<div>
					<h3 class="font-semibold text-white mb-1">{$_('hyperspace.modal.encounterRateTitle')}</h3>
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
					<h3 class="font-semibold text-white mb-1">{$_('hyperspace.modal.probabilityTitle')}</h3>
					<p>
						{$_('hyperspace.modal.probabilityBody')}
						<br />
						<code class="bg-blue-950 px-2 py-1 rounded text-blue-100">P(≥1) = 1 − (1 − p)^N</code>
						<br />
						{$_('hyperspace.modal.probabilityExplain')}
					</p>
				</div>

				<div>
					<h3 class="font-semibold text-white mb-1">{$_('hyperspace.modal.timeTitle')}</h3>
					<p>
						{$_('hyperspace.modal.timeBody')}
					</p>
				</div>

				{#if alphaDonutLevel > 0}
					<div>
					<h3 class="font-semibold text-white mb-1">{$_('hyperspace.modal.shalphaTitle')}</h3>
						<p>
						{$_('hyperspace.modal.shalphaBody')}
							<br />
							<code class="bg-blue-950 px-2 py-1 rounded text-blue-100">
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
