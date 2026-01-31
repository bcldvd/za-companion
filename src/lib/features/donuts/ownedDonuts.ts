import type { DonutRecipe, OwnedDonut } from './types';

const STORAGE_KEY = 'pokemon-legends-za-owned-donuts';

function generateId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function loadOwnedDonuts(): OwnedDonut[] {
	if (typeof globalThis.window === 'undefined') return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as OwnedDonut[];
			if (Array.isArray(parsed)) {
				return parsed;
			}
		}
	} catch (error) {
		console.error('Failed to load owned donuts:', error);
	}
	return [];
}

export function saveOwnedDonuts(donuts: OwnedDonut[]): void {
	if (typeof globalThis.window === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(donuts));
	} catch (error) {
		console.error('Failed to save owned donuts:', error);
	}
}

export function createOwnedDonutFromRecipe(
	recipe: DonutRecipe,
	sparklingLevel: 0 | 1 | 2 | 3,
	typeId: string,
	reservedForPokemonId?: string
): OwnedDonut {
	const isSpecialLegendary = recipe.isSpecialLegendary === true;
	const defaultReserved = isSpecialLegendary ? recipe.specialLegendaryPokemonId : undefined;

	return {
		id: generateId(),
		label: recipe.name,
		labelKey: recipe.nameKey,
		sparklingLevel,
		typeId,
		quantity: 1,
		reservedForPokemonId: reservedForPokemonId ?? defaultReserved,
		isSpecialLegendary: isSpecialLegendary || undefined,
		specialLegendaryPokemonId: recipe.specialLegendaryPokemonId,
		createdAt: new Date().toISOString()
	};
}

export function addOwnedDonut(
	donuts: OwnedDonut[],
	newDonut: OwnedDonut
): OwnedDonut[] {
	return [newDonut, ...donuts];
}

export function reserveOwnedDonut(
	donuts: OwnedDonut[],
	donutId: string,
	pokemonId: string
): OwnedDonut[] {
	return donuts.map((donut) =>
		donut.id === donutId ? { ...donut, reservedForPokemonId: pokemonId } : donut
	);
}

export function unreserveOwnedDonut(donuts: OwnedDonut[], donutId: string): OwnedDonut[] {
	return donuts.map((donut) =>
		donut.id === donutId ? { ...donut, reservedForPokemonId: undefined } : donut
	);
}

export function consumeOwnedDonut(donuts: OwnedDonut[], donutId: string): OwnedDonut[] {
	const updated = donuts.map((donut) => {
		if (donut.id !== donutId) return donut;
		if (donut.isSpecialLegendary) return { ...donut, quantity: 0 };
		return { ...donut, quantity: donut.quantity - 1 };
	});
	return updated.filter((donut) => donut.quantity > 0);
}

export function duplicateOwnedDonut(donuts: OwnedDonut[], donutId: string): OwnedDonut[] {
	const source = donuts.find((donut) => donut.id === donutId);
	if (!source || source.isSpecialLegendary) return donuts;
	const duplicated: OwnedDonut = {
		...source,
		id: generateId(),
		quantity: 1,
		createdAt: new Date().toISOString()
	};
	return [duplicated, ...donuts];
}
