<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { StatKey } from '$lib/perfect/types';
	import { getVitaminForStat } from '$lib/perfect/data/vitamins';

	let { stat }: { stat: StatKey } = $props();

	let vitamin = $derived(getVitaminForStat(stat));
</script>

{#if vitamin}
	<div class="rounded-lg border app-card-muted p-4">
		<div class="mb-1 font-semibold">{$_(`perfect.vitamins.${vitamin.id}`)}</div>
		<div class="text-sm app-text-subtle">
			+{vitamin.evPerUse} {$_(`perfect.stats.${stat}`)} per use
		</div>
	</div>
{/if}
