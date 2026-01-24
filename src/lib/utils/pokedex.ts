import type { Pokemon } from '../types/pokemon.js';
import { getCurrentLanguage } from '../i18n/index.js';

// Client-side cache for pokedex data
let cachedPokedex: Pokemon[] | null = null;
let loadPromise: Promise<Pokemon[]> | null = null;

// Cache for translations
let pokemonNameTranslations: { en: Record<string, string>; fr: Record<string, string> } | null =
	null;
let typeTranslations: { en: Record<string, string>; fr: Record<string, string> } | null = null;
let translationLoadPromise: Promise<void> | null = null;

/**
 * Load Pokemon name and type translations
 */
async function loadTranslations(): Promise<void> {
	if (pokemonNameTranslations !== null && typeTranslations !== null) {
		return;
	}

	if (translationLoadPromise !== null) {
		return translationLoadPromise;
	}

	translationLoadPromise = (async () => {
		try {
			const [pokemonEnResponse, pokemonFrResponse, typesEnResponse, typesFrResponse] =
				await Promise.all([
					fetch('/pokemon-names-en.json'),
					fetch('/pokemon-names-fr.json'),
					fetch('/pokemon-types-en.json'),
					fetch('/pokemon-types-fr.json')
				]);

			if (
				!pokemonEnResponse.ok ||
				!pokemonFrResponse.ok ||
				!typesEnResponse.ok ||
				!typesFrResponse.ok
			) {
				console.warn('Failed to load some translation files, using fallbacks');
				pokemonNameTranslations = { en: {}, fr: {} };
				typeTranslations = { en: {}, fr: {} };
				return;
			}

			pokemonNameTranslations = {
				en: await pokemonEnResponse.json(),
				fr: await pokemonFrResponse.json()
			};

			typeTranslations = {
				en: await typesEnResponse.json(),
				fr: await typesFrResponse.json()
			};
		} catch (error) {
			console.error('Error loading translations:', error);
			pokemonNameTranslations = { en: {}, fr: {} };
			typeTranslations = { en: {}, fr: {} };
		}
	})();

	return translationLoadPromise;
}

/**
 * Get localized Pokemon name
 */
export function getLocalizedPokemonName(pokemon: Pokemon, locale?: 'en' | 'fr'): string {
	const translations = pokemonNameTranslations;
	if (!translations) {
		return pokemon.name; // Fallback to original name
	}

	const lang = locale || getCurrentLanguage();
	// Translation files use string keys, so convert nationalNumber to string
	const translation = translations[lang]?.[String(pokemon.nationalNumber)];
	return translation || pokemon.name;
}

/**
 * Get localized type names
 */
export function getLocalizedTypes(types: string[], locale?: 'en' | 'fr'): string[] {
	const translations = typeTranslations;
	if (!translations) {
		return types; // Fallback to original types
	}

	const lang = locale || getCurrentLanguage();
	return types.map((type) => {
		const translation = translations[lang]?.[type];
		return translation || type;
	});
}

/**
 * Load pokedex data from static JSON files with client-side caching
 * Combines regional pokedex and hyperspace pokedex, with hyperspace pokemon
 * continuing from where regional pokemon end (starting at 233)
 * Fetches once and caches in memory for subsequent calls
 * Also loads translations in parallel
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
			// Load translations and pokedex data in parallel
			const [regionalResponse, hyperspaceResponse] = await Promise.all([
				fetch('/pokedex.json'),
				fetch('/hyperspace-pokedex.json'),
				loadTranslations() // Load translations in parallel
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
			const lastRegionalNumber =
				regionalData.length > 0 ? Math.max(...regionalData.map((p) => p.regionalNumber)) : 0;

			// Adjust hyperspace pokemon regional numbers to continue from regional pokedex
			const adjustedHyperspace = hyperspaceData.map((pokemon) => ({
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
 * Normalize a string by removing accents and converting to lowercase
 * This makes search accent-insensitive (e.g., "leviator" matches "léviator")
 */
function normalizeString(str: string): string {
	return str
		.normalize('NFD') // Decompose characters into base + combining marks
		.replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks (accents)
		.toLowerCase();
}

/**
 * Search Pokemon by name (case-insensitive and accent-insensitive)
 * Searches in both original and translated names
 * Requires pokedex to be loaded first via loadPokedex()
 */
export function searchPokemonByName(query: string, pokedex: Pokemon[]): Pokemon[] {
	if (!query.trim()) {
		return [];
	}

	const normalizedQuery = normalizeString(query);
	return pokedex.filter((pokemon) => {
		// Search in original name
		const originalMatch = normalizeString(pokemon.name).includes(normalizedQuery);
		if (originalMatch) return true;

		// Also search in translated names
		const enName = normalizeString(getLocalizedPokemonName(pokemon, 'en'));
		const frName = normalizeString(getLocalizedPokemonName(pokemon, 'fr'));

		return enName.includes(normalizedQuery) || frName.includes(normalizedQuery);
	});
}

/**
 * Filter Pokemon by type
 * Requires pokedex to be loaded first via loadPokedex()
 */
export function filterPokemonByType(types: string[], pokedex: Pokemon[]): Pokemon[] {
	if (types.length === 0) {
		return pokedex;
	}

	return pokedex.filter((pokemon) => types.some((type) => pokemon.types.includes(type)));
}

/**
 * Get Pokemon by regional number
 * Requires pokedex to be loaded first via loadPokedex()
 */
export function getPokemonByRegionalNumber(
	regionalNumber: number,
	pokedex: Pokemon[]
): Pokemon | undefined {
	return pokedex.find((p) => p.regionalNumber === regionalNumber);
}

/**
 * Get Pokemon by national number
 * Requires pokedex to be loaded first via loadPokedex()
 */
export function getPokemonByNationalNumber(
	nationalNumber: number,
	pokedex: Pokemon[]
): Pokemon | undefined {
	return pokedex.find((p) => p.nationalNumber === nationalNumber);
}
