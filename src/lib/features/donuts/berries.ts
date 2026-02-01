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

export type FlavorTotals = {
	sweet: number;
	spicy: number;
	sour: number;
	bitter: number;
	fresh: number;
};

export function computeFlavorTotals(
	ingredients: Array<{ itemId: string; quantity: number }>,
	berryMap: Map<string, Berry>
): FlavorTotals | null {
	const totals: FlavorTotals = { sweet: 0, spicy: 0, sour: 0, bitter: 0, fresh: 0 };

	for (const ingredient of ingredients) {
		const berry = berryMap.get(ingredient.itemId);
		if (!berry) return null; // Missing berry data

		totals.sweet += berry.stats.sweet * ingredient.quantity;
		totals.spicy += berry.stats.spicy * ingredient.quantity;
		totals.sour += berry.stats.sour * ingredient.quantity;
		totals.bitter += berry.stats.bitter * ingredient.quantity;
		totals.fresh += berry.stats.fresh * ingredient.quantity;
	}

	return totals;
}
