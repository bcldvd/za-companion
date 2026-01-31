/**
 * PokéAPI v2 utility functions for fetching Pokémon sprites
 */

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// Cache for sprite URLs to avoid repeated API calls
// Key format: "{nationalNumber}-{isShiny}"
const spriteCache = new Map<string, string>();

// Cache for full Pokémon data to avoid repeated fetches
const pokemonDataCache = new Map<number, any>();
const baseStatsCache = new Map<number, Record<string, number>>();

/**
 * Fetches Pokémon data from PokéAPI v2
 * @param nationalNumber The national Pokédex number
 * @returns Promise with Pokémon data
 */
async function fetchPokemonData(nationalNumber: number): Promise<any> {
	// Check cache first
	if (pokemonDataCache.has(nationalNumber)) {
		return pokemonDataCache.get(nationalNumber);
	}

	try {
		const response = await fetch(`${POKEAPI_BASE}/pokemon/${nationalNumber}/`);
		if (!response.ok) {
			throw new Error(`PokéAPI returned ${response.status}`);
		}
		const data = await response.json();
		// Cache the data
		pokemonDataCache.set(nationalNumber, data);
		return data;
	} catch (error) {
		console.error(`Error fetching Pokémon ${nationalNumber} from PokéAPI:`, error);
		throw error;
	}
}

/**
 * Gets the sprite URL for a Pokémon from PokéAPI v2
 * Prefers Pokémon Home sprites (newer, higher quality) over default sprites
 * @param nationalNumber The national Pokédex number
 * @param isShiny Whether to get the shiny sprite
 * @param fallbackUrl Fallback URL to use if PokéAPI fails (e.g., serebii imageUrl)
 * @returns Promise with sprite URL
 */
export async function getPokemonSprite(
	nationalNumber: number,
	isShiny: boolean,
	fallbackUrl?: string
): Promise<string> {
	const cacheKey = `${nationalNumber}-${isShiny}`;

	// Check cache first
	if (spriteCache.has(cacheKey)) {
		return spriteCache.get(cacheKey)!;
	}

	try {
		const pokemonData = await fetchPokemonData(nationalNumber);
		
		// Try Pokémon Home sprites first (newer, higher quality)
		let spriteUrl: string | null = null;
		if (pokemonData.sprites?.other?.home) {
			if (isShiny) {
				spriteUrl = pokemonData.sprites.other.home.front_shiny || null;
			} else {
				spriteUrl = pokemonData.sprites.other.home.front_default || null;
			}
		}
		
		// Fallback to default sprites if Home sprites aren't available
		if (!spriteUrl) {
			if (isShiny) {
				spriteUrl = pokemonData.sprites?.front_shiny || null;
			} else {
				spriteUrl = pokemonData.sprites?.front_default || null;
			}
		}

		if (spriteUrl) {
			// Cache the sprite URL
			spriteCache.set(cacheKey, spriteUrl);
			return spriteUrl;
		}

		// If sprite URL is null/undefined, fall back
		if (fallbackUrl) {
			console.warn(`Pokémon ${nationalNumber} has no ${isShiny ? 'shiny' : 'default'} sprite, using fallback`);
			return fallbackUrl;
		}

		throw new Error(`No ${isShiny ? 'shiny' : 'default'} sprite available for Pokémon ${nationalNumber}`);
	} catch (error) {
		console.error(`Error getting sprite for Pokémon ${nationalNumber}:`, error);
		// Fallback to serebii URL if available
		if (fallbackUrl) {
			return fallbackUrl;
		}
		// Last resort: return a placeholder or throw
		throw error;
	}
}

/**
 * Gets base stats for a Pokemon from PokéAPI v2
 */
export async function getPokemonBaseStats(
	nationalNumber: number
): Promise<{ hp: number; atk: number; def: number; spa: number; spd: number; spe: number }> {
	if (baseStatsCache.has(nationalNumber)) {
		return baseStatsCache.get(nationalNumber)! as {
			hp: number;
			atk: number;
			def: number;
			spa: number;
			spd: number;
			spe: number;
		};
	}

	const pokemonData = await fetchPokemonData(nationalNumber);
	const stats = pokemonData.stats as Array<{ base_stat: number; stat: { name: string } }>;
	const map = new Map<string, number>(
		stats.map((entry) => [entry.stat.name, entry.base_stat])
	);

	const baseStats = {
		hp: map.get('hp') ?? 0,
		atk: map.get('attack') ?? 0,
		def: map.get('defense') ?? 0,
		spa: map.get('special-attack') ?? 0,
		spd: map.get('special-defense') ?? 0,
		spe: map.get('speed') ?? 0
	};

	baseStatsCache.set(nationalNumber, baseStats);
	return baseStats;
}

/**
 * Clears the sprite cache (useful for testing or memory management)
 */
export function clearSpriteCache(): void {
	spriteCache.clear();
	pokemonDataCache.clear();
	baseStatsCache.clear();
}

