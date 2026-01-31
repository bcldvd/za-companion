<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { StatKey } from '$lib/perfect/types';
	import { getVitaminForStat } from '$lib/perfect/data/vitamins';

	let { stat }: { stat: StatKey } = $props();

	let vitamin = $derived(getVitaminForStat(stat));
</script>

{#if vitamin}
	<div class="rounded-lg border border-blue-700 bg-blue-800/50 p-4">
		<div class="mb-1 font-semibold">{$_(`perfect.vitamins.${vitamin.id}`)}</div>
		<div class="text-sm text-blue-300">
			+{vitamin.evPerUse} {$_(`perfect.stats.${stat}`)} per use
		</div>
	</div>
{/if}
