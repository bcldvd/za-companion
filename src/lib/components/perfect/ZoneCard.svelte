<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Zone } from '$lib/perfect/types';
	import { loadPokedex, getLocalizedPokemonName, getPokemonByNationalNumber } from '$lib/utils/pokedex';
	import { onMount } from 'svelte';
	import type { Pokemon } from '$lib/types/pokemon';

	let { zone }: { zone: Zone } = $props();

	let pokedex = $state<Pokemon[]>([]);

	onMount(async () => {
		pokedex = await loadPokedex();
	});

</script>

<div class="rounded-lg border border-blue-700 bg-blue-800/50 p-4">
	<div class="mb-2 font-semibold">{$_(`perfect.zones.${zone.id}`)}</div>

	{#if zone.hasNotes}
		<div class="mb-2 text-xs text-green-400">
			{$_(`perfect.zoneNotes.${zone.id}`)}
		</div>
	{/if}

	<div class="mb-3 space-y-1">
		{#each zone.evSources as source}
			{@const pokemon = getPokemonByNationalNumber(source.nationalNumber, pokedex)}
			<div class="flex items-center justify-between text-sm">
				<div class="flex items-center gap-2 text-blue-200">
					<img
						src={`/sprites/default/${source.nationalNumber}.png`}
						alt=""
						class="h-5 w-5 object-contain"
						loading="lazy"
					/>
					<span>{pokemon ? getLocalizedPokemonName(pokemon) : `#${source.nationalNumber}`}</span>
				</div>
				<span class="rounded bg-blue-900 px-2 py-0.5 text-xs text-blue-300">
					+{source.evYield} {$_(`perfect.stats.${source.stat}`)}
				</span>
			</div>
		{/each}
	</div>

</div>
