/**
 * Hyperspace spawn data utilities
 */

export type HyperspaceSpawn = {
	name: string;
	nationalNumber: number;
	types: string[];
	variant?: string;
	starLevels: number[];
	isMainArea?: boolean;
};

let cachedSpawns: HyperspaceSpawn[] | null = null;
let loadPromise: Promise<HyperspaceSpawn[]> | null = null;

/**
 * Load hyperspace spawn data from JSON file
 */
export async function loadHyperspaceSpawns(): Promise<HyperspaceSpawn[]> {
	if (cachedSpawns !== null) {
		return cachedSpawns;
	}

	if (loadPromise !== null) {
		return loadPromise;
	}

	loadPromise = (async () => {
		try {
			const response = await fetch('/hyperspace-spawns.json');
			if (!response.ok) {
				throw new Error(`Failed to load hyperspace spawns: ${response.statusText}`);
			}
			const data: HyperspaceSpawn[] = await response.json();
			cachedSpawns = data;
			return data;
		} catch (error) {
			loadPromise = null;
			throw error;
		}
	})();

	return loadPromise;
}

/**
 * Get cached hyperspace spawns (synchronous)
 */
export function getHyperspaceSpawns(): HyperspaceSpawn[] | null {
	return cachedSpawns;
}

/**
 * Create a map for fast lookup by national number + variant
 */
export function createSpawnLookup(
	spawns: HyperspaceSpawn[]
): Map<string, HyperspaceSpawn> {
	const map = new Map<string, HyperspaceSpawn>();
	for (const spawn of spawns) {
		// Key without variant for base forms
		map.set(String(spawn.nationalNumber), spawn);
		// Key with variant for regional forms
		if (spawn.variant) {
			map.set(`${spawn.nationalNumber}${spawn.variant}`, spawn);
		}
	}
	return map;
}

/**
 * Get spawn info for a Pokemon by national number
 */
export function getSpawnByNationalNumber(
	nationalNumber: number,
	spawns: HyperspaceSpawn[]
): HyperspaceSpawn | undefined {
	return spawns.find((s) => s.nationalNumber === nationalNumber);
}

/**
 * Filter spawns by type (Pokemon that have at least one matching type)
 */
export function filterSpawnsByType(
	types: string[],
	spawns: HyperspaceSpawn[]
): HyperspaceSpawn[] {
	if (types.length === 0) {
		return spawns;
	}
	const normalizedTypes = types.map((t) => t.toLowerCase());
	return spawns.filter((spawn) =>
		spawn.types.some((type) => normalizedTypes.includes(type.toLowerCase()))
	);
}

/**
 * Format star levels for display (e.g., "1-5" or "3, 4, 5")
 */
export function formatStarLevels(starLevels: number[]): string {
	if (starLevels.length === 0) return '';

	const sorted = [...starLevels].sort((a, b) => a - b);

	// Check if consecutive
	const isConsecutive = sorted.every((val, i) =>
		i === 0 || val === sorted[i - 1] + 1
	);

	if (isConsecutive && sorted.length > 2) {
		return `${sorted[0]}-${sorted[sorted.length - 1]}`;
	}

	return sorted.join(', ');
}
