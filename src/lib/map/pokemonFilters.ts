import type { MapSpawnLocation } from './types';
export function filterSpawnsByPokemon(
	spawns: MapSpawnLocation[],
	selectedPokemon: number[]
): MapSpawnLocation[] {
	if (!selectedPokemon || selectedPokemon.length === 0) {
		return spawns;
	}
	const selected = new Set(selectedPokemon);
	return spawns.filter((spawn) => selected.has(spawn.pokemonNationalNumber));
}
