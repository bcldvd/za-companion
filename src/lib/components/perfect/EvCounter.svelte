<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Snippet } from 'svelte';
	import type { StatKey } from '$lib/perfect/types';
	import { MAX_EV_PER_STAT } from '$lib/perfect/constants';
	import { getVitaminForStat } from '$lib/perfect/data/vitamins';
	import { getPowerItemForStat } from '$lib/perfect/data/powerItems';
	import { Plus, Minus } from 'lucide-svelte';
	import CompassIcon from '$lib/components/icons/CompassIcon.svelte';

	let {
		stat,
		current = $bindable(0),
		target = MAX_EV_PER_STAT,
		killsRemaining = 0,
		vitaminsRemaining = 0,
		mode = 'battles',
		showDetailsToggle = false,
		detailsOpen = $bindable(false),
		details
	}: {
		stat: StatKey;
		current?: number;
		target?: number;
		killsRemaining?: number;
		vitaminsRemaining?: number;
		mode?: 'battles' | 'vitamins';
		showDetailsToggle?: boolean;
		detailsOpen?: boolean;
		details?: Snippet;
	} = $props();

	let progress = $derived(Math.min((current / target) * 100, 100));
	let remaining = $derived(Math.max(target - current, 0));
	let isMaxed = $derived(current >= target);
	let vitamin = $derived(mode === 'vitamins' ? getVitaminForStat(stat) : null);
	let powerItem = $derived(mode === 'battles' ? getPowerItemForStat(stat) : null);
	let powerItemEnabled = $state(true);
	let battleStep = $derived(powerItem && powerItemEnabled ? 1 + powerItem.evBonus : 1);
	let battlesRemaining = $derived(
		mode === 'battles' ? Math.ceil(remaining / battleStep) : killsRemaining
	);

	function add(amount: number) {
		current = Math.min(current + amount, target);
	}

	function subtract(amount: number) {
		current = Math.max(current - amount, 0);
	}
</script>

<div class="rounded-lg border app-card-muted p-3">
	<div class="flex min-h-[68px] items-stretch gap-3">
		{#if vitamin}
			<div class="flex items-center self-stretch">
				<img
					src={`/icons/vitamin-${vitamin.id}.png`}
					alt=""
					class="h-14 w-14 object-contain"
					aria-hidden="true"
				/>
			</div>
		{/if}
		{#if powerItem}
			<div class="flex w-[68px] self-stretch">
				<button
					type="button"
					class="flex h-full w-full items-center justify-center rounded-lg border app-button app-text-subtle transition-colors hover:text-[var(--app-text)] {powerItemEnabled
						? 'border-[var(--app-accent)] bg-[var(--app-surface-strong)] app-accent-text app-accent-glow'
						: ''}"
					onclick={() => (powerItemEnabled = !powerItemEnabled)}
					aria-pressed={powerItemEnabled}
					aria-label="Toggle power item"
				>
					<img src={`/icons/${powerItem.id}.png`} alt="" class="h-10 w-10 object-contain" />
				</button>
			</div>
		{/if}
		<div class="flex flex-1 flex-col gap-1 leading-tight">
			<div class="flex items-start justify-between gap-3">
				<div class="text-sm font-medium app-text-muted">
					{$_(`perfect.stats.${stat}`)}
				</div>
				<div class="flex items-center gap-2">
					<span class="text-sm app-text-subtle">
						{current} / {target}
					</span>
					{#if showDetailsToggle}
						<button
							type="button"
							class="flex h-7 w-7 items-center justify-center rounded border app-button app-text-subtle transition-colors hover:text-[var(--app-text)]"
							onclick={() => (detailsOpen = !detailsOpen)}
							aria-expanded={detailsOpen}
							aria-label="Toggle zones"
						>
							<CompassIcon className="h-4 w-4" />
						</button>
					{/if}
				</div>
			</div>
			{#if vitamin}
				<div class="text-xs font-medium app-text-subtle">
					{$_(`perfect.vitamins.${vitamin.id}`)}
				</div>
			{/if}
			<div class="mt-1 flex items-center gap-3">
				<div class="flex-1">
					<div class="h-2 overflow-hidden rounded-full bg-[var(--app-surface-strong)]">
						<div
							class="h-full transition-all duration-200 {isMaxed ? 'bg-green-500' : 'bg-[var(--app-accent)]'}"
							style="width: {progress}%"
						></div>
					</div>
				</div>
				<div class="text-xs app-text-subtle">
					{#if isMaxed}
						{$_('perfect.plan.maxReached')}
					{:else if mode === 'battles'}
						{$_('perfect.plan.killsRemaining', { values: { count: battlesRemaining } })}
					{:else}
						{$_('perfect.plan.vitaminsRemaining', { values: { count: vitaminsRemaining } })}
					{/if}
				</div>
				<div class="flex items-center gap-2">
					{#if mode === 'vitamins'}
						<button
							type="button"
							class="flex h-8 w-8 items-center justify-center rounded border app-button app-text-subtle text-sm transition-colors hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-50"
							onclick={() => subtract(10)}
							disabled={current === 0}
							aria-label="Remove 1 vitamin"
						>
							-
						</button>
						<button
							type="button"
							class="flex h-8 w-8 items-center justify-center rounded border app-button app-text-subtle text-sm transition-colors hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-50"
							onclick={() => add(10)}
							disabled={isMaxed}
							aria-label="Add 1 vitamin"
						>
							+
						</button>
					{:else}
						<button
							type="button"
							class="flex h-8 w-8 items-center justify-center rounded border app-button app-text-subtle transition-colors hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-50"
							onclick={() => subtract(battleStep)}
							disabled={current === 0}
							aria-label="Remove EV"
						>
							<Minus class="h-4 w-4" />
						</button>
						<button
							type="button"
							class="flex h-8 w-8 items-center justify-center rounded border app-button app-text-subtle transition-colors hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-50"
							onclick={() => add(battleStep)}
							disabled={isMaxed}
							aria-label="Add EV"
						>
							<Plus class="h-4 w-4" />
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>

	{#if showDetailsToggle && detailsOpen && details}
		<div class="mt-3 space-y-4">
			{@render details()}
		</div>
	{/if}
</div>
