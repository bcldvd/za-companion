<script lang="ts">
import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
	import type { StatKey, EvProgress } from '$lib/perfect/types';
	import { ALL_STATS } from '$lib/perfect/types';
	import { MAX_TOTAL_EV, STORAGE_KEY } from '$lib/perfect/constants';
	import { computeEvPlan, createEmptyProgress } from '$lib/perfect/evCalculator';
	import { recommendAromate } from '$lib/perfect/data/aromates';
	import { getZonesForStat } from '$lib/perfect/data/evSources';
	import EvCounter from '$lib/components/perfect/EvCounter.svelte';
	import AromateCard from '$lib/components/perfect/AromateCard.svelte';
	import ZoneCard from '$lib/components/perfect/ZoneCard.svelte';
	import InfoTooltip from '$lib/components/perfect/InfoTooltip.svelte';

	let priorities = $state<StatKey[]>(['atk', 'hp', 'spe', 'def', 'spd', 'spa']);
	let evProgress = $state<EvProgress>(createEmptyProgress());
	let activePath = $state<'battles' | 'vitamins'>('battles');
	let zoneOpen = $state<Record<StatKey, boolean>>({
		hp: true,
		atk: true,
		def: true,
		spa: true,
		spd: true,
		spe: true
	});
	let autoCollapsed = $state<Record<StatKey, boolean>>({
		hp: false,
		atk: false,
		def: false,
		spa: false,
		spd: false,
		spe: false
	});

	function parsePriorities(param: string | null): StatKey[] {
		if (!param) return ['atk', 'hp', 'spe', 'def', 'spd', 'spa'];
		const parts = param.split(',');
		const validStats = parts.filter((s): s is StatKey => ALL_STATS.includes(s as StatKey));
		if (validStats.length !== 6) {
			return ['atk', 'hp', 'spe', 'def', 'spd', 'spa'];
		}
		return validStats;
	}

	function loadProgress(): EvProgress {
		if (typeof window === 'undefined') return createEmptyProgress();
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored) as EvProgress;
			}
		} catch (error) {
			console.error('Error loading progress:', error);
		}
		return createEmptyProgress();
	}

	function saveProgress(progress: EvProgress) {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
		} catch (error) {
			console.error('Error saving progress:', error);
		}
	}

	function resetProgress() {
		evProgress = createEmptyProgress();
		saveProgress(evProgress);
	}

	let plan = $derived(computeEvPlan(priorities, evProgress));
	let aromate = $derived(recommendAromate(priorities));
	let topPriorities = $derived(priorities.slice(0, 3));

	// Save progress whenever evProgress changes
	$effect(() => {
		// Only save after initial load
		if (typeof window !== 'undefined') {
			saveProgress(evProgress);
		}
	});

	$effect(() => {
		for (const stat of topPriorities) {
			const statPlan = plan.stats.find((s) => s.stat === stat);
			if (!statPlan) continue;
			if (evProgress[stat] >= statPlan.target && !autoCollapsed[stat]) {
				zoneOpen[stat] = false;
				autoCollapsed[stat] = true;
			}
			if (evProgress[stat] < statPlan.target && autoCollapsed[stat]) {
				autoCollapsed[stat] = false;
			}
		}
	});

	// Parse priorities from URL on mount
	$effect(() => {
		const param = $page.url.searchParams.get('p');
		priorities = parsePriorities(param);
	});

	onMount(() => {
		if (typeof window !== 'undefined') {
			const scroller = document.querySelector('main');
			if (scroller instanceof HTMLElement) {
				scroller.scrollTo({ top: 0 });
			} else {
				window.scrollTo({ top: 0 });
			}
			requestAnimationFrame(() => {
				if (scroller instanceof HTMLElement) {
					scroller.scrollTo({ top: 0 });
				} else {
					window.scrollTo({ top: 0 });
				}
			});
		}
		evProgress = loadProgress();
	});
</script>

<div class="min-h-screen app-shell p-4 pb-24">
	<div class="mx-auto max-w-2xl space-y-6">
		<!-- Top Priorities -->
		<div>
			<div class="mb-2 flex items-center justify-between text-sm font-medium app-text-muted">
				<div class="flex flex-wrap items-center gap-2">
					<span>{$_('perfect.plan.topPriorities')}</span>
					{#each topPriorities as stat, index (stat)}
						<div class="rounded-full app-accent-bg px-3 py-1 text-sm font-medium">
							{index + 1}. {$_(`perfect.stats.${stat}`)}
						</div>
					{/each}
				</div>
				<InfoTooltip />
			</div>
		</div>

		<!-- Aromate Recommendation -->
		<AromateCard {aromate} />

		<!-- Path Selection -->
		<div>
			<div class="mb-2 text-sm font-medium app-text-muted">{$_('perfect.plan.path')}</div>
			<div class="flex gap-2 rounded-lg border app-border app-surface-muted p-1">
				<button
					type="button"
					class="flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors {activePath ===
					'battles'
						? 'app-button-primary'
						: 'app-button'}"
					onclick={() => (activePath = 'battles')}
				>
					{$_('perfect.plan.battles')}
				</button>
				<button
					type="button"
					class="flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors {activePath ===
					'vitamins'
						? 'app-button-primary'
						: 'app-button'}"
					onclick={() => (activePath = 'vitamins')}
				>
					{$_('perfect.plan.vitamins')}
				</button>
			</div>
		</div>

		<!-- EV Counters for top 3 priorities -->
		<div class="space-y-4">
			<div class="text-sm font-medium app-text-muted">{$_('perfect.plan.evProgress')}</div>
			<div class="rounded-lg border app-card-muted p-3">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium app-text-muted">
						{$_('perfect.plan.totalProgress', {
							values: { current: plan.totalEv, max: MAX_TOTAL_EV }
						})}
					</span>
					<button
						type="button"
						class="text-xs app-link"
						onclick={resetProgress}
					>
						{$_('perfect.plan.reset')}
					</button>
				</div>
				<div class="h-2 overflow-hidden rounded-full bg-[var(--app-surface-strong)]">
					<div
						class="h-full transition-all duration-200 {plan.totalEv >= MAX_TOTAL_EV
							? 'bg-green-500'
							: 'bg-[var(--app-accent)]'}"
						style="width: {(plan.totalEv / MAX_TOTAL_EV) * 100}%"
					></div>
				</div>
			</div>
			{#each topPriorities as stat (stat)}
				{@const statPlan = plan.stats.find((s) => s.stat === stat)}
				{#if statPlan}
					<EvCounter
						{stat}
						bind:current={evProgress[stat]}
						target={statPlan.target}
						killsRemaining={statPlan.killsNeeded}
						vitaminsRemaining={statPlan.vitaminsNeeded}
						mode={activePath}
						showDetailsToggle={activePath === 'battles'}
						bind:detailsOpen={zoneOpen[stat]}
					>
						{#snippet details()}
							{@const zones = getZonesForStat(stat)}
							{#each zones as zone (zone.id)}
								<ZoneCard {zone} />
							{/each}
						{/snippet}
					</EvCounter>
				{/if}
			{/each}
		</div>

		<!-- IV Caps Info -->
		<div class="rounded-lg border app-card-muted p-4">
			<div class="flex items-stretch gap-3">
				<div class="relative flex items-stretch">
					<img
						src="/icons/silver-capsule.png"
						alt=""
						class="absolute bottom-[5px] left-0 z-10 h-1/2 w-auto -translate-x-[10px] -scale-x-100 object-contain opacity-80"
					/>
					<img src="/icons/gold-capsule.png" alt="" class="relative z-0 h-full w-auto object-contain" />
				</div>
				<div>
					<div class="font-semibold">{$_('perfect.tooltip.ivTitle')}</div>
					<div class="text-sm app-text-subtle">{$_('perfect.tooltip.ivBody')}</div>
				</div>
			</div>
		</div>
	</div>
</div>
