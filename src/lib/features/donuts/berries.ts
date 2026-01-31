export type Berry = {
	id: string;
	nameKey: string;
	spritePath: string;
	stats: {
		sweet: number;
		spicy: number;
		sour: number;
		bitter: number;
		fresh: number;
	};
	level: number;
	calories: number;
	isExtra: boolean;
};

let cachedBerries: Berry[] | null = null;
let berriesPromise: Promise<Berry[]> | null = null;

export async function loadBerries(): Promise<Berry[]> {
	if (cachedBerries) return cachedBerries;
	if (berriesPromise) return berriesPromise;

	berriesPromise = (async () => {
		if (typeof window === 'undefined') return [];
		const response = await fetch('/berries.json');
		if (!response.ok) {
			throw new Error(`Failed to load berries: ${response.statusText}`);
		}
		const data = (await response.json()) as Berry[];
		cachedBerries = data;
		return data;
	})();

	return berriesPromise;
}

export function getBerryMap(berries: Berry[]): Map<string, Berry> {
	return new Map(berries.map((berry) => [berry.id, berry]));
}
