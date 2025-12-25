import type { Pokemon } from '../types/pokemon.js';
import pokedexData from '../../../data/data/pokedex.json';

export const pokedex: Pokemon[] = pokedexData as Pokemon[];

/**
 * Search Pokemon by name (case-insensitive)
 */
export function searchPokemonByName(query: string): Pokemon[] {
	if (!query.trim()) {
		return [];
	}
	
	const lowerQuery = query.toLowerCase();
	return pokedex.filter(pokemon => 
		pokemon.name.toLowerCase().includes(lowerQuery)
	);
}

/**
 * Filter Pokemon by type
 */
export function filterPokemonByType(types: string[]): Pokemon[] {
	if (types.length === 0) {
		return pokedex;
	}
	
	return pokedex.filter(pokemon =>
		types.some(type => pokemon.types.includes(type))
	);
}

/**
 * Get Pokemon by regional number
 */
export function getPokemonByRegionalNumber(regionalNumber: number): Pokemon | undefined {
	return pokedex.find(p => p.regionalNumber === regionalNumber);
}

/**
 * Get Pokemon by national number
 */
export function getPokemonByNationalNumber(nationalNumber: number): Pokemon | undefined {
	return pokedex.find(p => p.nationalNumber === nationalNumber);
}

