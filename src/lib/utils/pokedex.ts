import type { Pokemon } from '../types/pokemon.js';

// Client-side cache for pokedex data
let cachedPokedex: Pokemon[] | null = null;
let loadPromise: Promise<Pokemon[]> | null = null;

/**
 * Load pokedex data from static JSON files with client-side caching
 * Combines regional pokedex and hyperspace pokedex, with hyperspace pokemon
 * continuing from where regional pokemon end (starting at 233)
 * Fetches once and caches in memory for subsequent calls
 */
export async function loadPokedex(): Promise<Pokemon[]> {
	// Return cached data if available
	if (cachedPokedex !== null) {
		return cachedPokedex;
	}

	// If already loading, return the existing promise
	if (loadPromise !== null) {
		return loadPromise;
	}

	// Start loading
	loadPromise = (async () => {
		try {
			// Load both pokedexes in parallel
			const [regionalResponse, hyperspaceResponse] = await Promise.all([
				fetch('/pokedex.json'),
				fetch('/hyperspace-pokedex.json')
			]);

			if (!regionalResponse.ok) {
				throw new Error(`Failed to load regional pokedex: ${regionalResponse.statusText}`);
			}
			if (!hyperspaceResponse.ok) {
				throw new Error(`Failed to load hyperspace pokedex: ${hyperspaceResponse.statusText}`);
			}

			const regionalData: Pokemon[] = await regionalResponse.json();
			const hyperspaceData: Pokemon[] = await hyperspaceResponse.json();

			// Find the last regional number to determine the offset
			const lastRegionalNumber = regionalData.length > 0 
				? Math.max(...regionalData.map(p => p.regionalNumber))
				: 0;

			// Adjust hyperspace pokemon regional numbers to continue from regional pokedex
			const adjustedHyperspace = hyperspaceData.map(pokemon => ({
				...pokemon,
				regionalNumber: lastRegionalNumber + pokemon.regionalNumber
			}));

			// Combine both pokedexes
			const combined = [...regionalData, ...adjustedHyperspace];
			cachedPokedex = combined;
			return combined;
		} catch (error) {
			loadPromise = null; // Reset on error so we can retry
			throw error;
		}
	})();

	return loadPromise;
}

/**
 * Get the cached pokedex data (synchronous)
 * Returns null if not yet loaded
 */
export function getPokedex(): Pokemon[] | null {
	return cachedPokedex;
}

/**
 * Search Pokemon by name (case-insensitive)
 * Requires pokedex to be loaded first via loadPokedex()
 */
export function searchPokemonByName(query: string, pokedex: Pokemon[]): Pokemon[] {
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
 * Requires pokedex to be loaded first via loadPokedex()
 */
export function filterPokemonByType(types: string[], pokedex: Pokemon[]): Pokemon[] {
	if (types.length === 0) {
		return pokedex;
	}
	
	return pokedex.filter(pokemon =>
		types.some(type => pokemon.types.includes(type))
	);
}

/**
 * Get Pokemon by regional number
 * Requires pokedex to be loaded first via loadPokedex()
 */
export function getPokemonByRegionalNumber(regionalNumber: number, pokedex: Pokemon[]): Pokemon | undefined {
	return pokedex.find(p => p.regionalNumber === regionalNumber);
}

/**
 * Get Pokemon by national number
 * Requires pokedex to be loaded first via loadPokedex()
 */
export function getPokemonByNationalNumber(nationalNumber: number, pokedex: Pokemon[]): Pokemon | undefined {
	return pokedex.find(p => p.nationalNumber === nationalNumber);
}

