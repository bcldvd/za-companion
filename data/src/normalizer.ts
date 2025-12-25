import type { ScrapedPokemon, Pokemon } from './types.js';

/**
 * Maps type URLs to normalized type names
 */
function extractTypeFromUrl(url: string): string | null {
	// Type URLs typically look like: /pokedex-sv/grass.shtml, /pokedex-sv/fire.shtml, etc.
	// Also handle full URLs: https://www.serebii.net/pokedex-sv/grass.shtml
	const match = url.match(/\/([^/]+)\.shtml$/);
	if (!match) return null;

	const typeName = match[1].toLowerCase();
	
	// Skip if it's not a type name (e.g., pokemon names)
	if (typeName.length > 10) return null;
	
	// Map common variations to standard type names
	const typeMap: Record<string, string> = {
		'grass': 'Grass',
		'fire': 'Fire',
		'water': 'Water',
		'electric': 'Electric',
		'psychic': 'Psychic',
		'ice': 'Ice',
		'dragon': 'Dragon',
		'dark': 'Dark',
		'fairy': 'Fairy',
		'normal': 'Normal',
		'fighting': 'Fighting',
		'flying': 'Flying',
		'poison': 'Poison',
		'ground': 'Ground',
		'rock': 'Rock',
		'bug': 'Bug',
		'ghost': 'Ghost',
		'steel': 'Steel'
	};

	return typeMap[typeName] || typeName.charAt(0).toUpperCase() + typeName.slice(1);
}

/**
 * Normalizes scraped Pokemon data into a consistent format
 * Preserves order (no sorting) to maintain regional dex numbering
 */
export function normalizePokemon(scraped: ScrapedPokemon[]): Pokemon[] {
	return scraped
		.map((pokemon) => {
			try {
				const types = pokemon.typeUrls
					.map(extractTypeFromUrl)
					.filter((type): type is string => type !== null);

				// Ensure we have at least one type
				if (types.length === 0) {
					console.warn(`Warning: No types found for ${pokemon.name} (regional #${pokemon.regionalNumber})`);
				}

				return {
					regionalNumber: pokemon.regionalNumber,
					nationalNumber: pokemon.nationalNumber,
					name: pokemon.name.trim(),
					types,
					imageUrl: pokemon.imageUrl
				};
			} catch (error) {
				console.error(`Error normalizing ${pokemon.name}:`, error);
				return null;
			}
		})
		.filter((pokemon): pokemon is Pokemon => pokemon !== null);
	// No sorting - preserve regional dex order
}

