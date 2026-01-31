import type { Aromate, StatKey } from '../types';

export const AROMATES: Aromate[] = [
	// Physical natures
	{ id: 'adamant', boostsStat: 'atk', lowersStat: 'spa' },
	{ id: 'jolly', boostsStat: 'spe', lowersStat: 'spa' },
	{ id: 'brave', boostsStat: 'atk', lowersStat: 'spe' },
	// Special natures
	{ id: 'modest', boostsStat: 'spa', lowersStat: 'atk' },
	{ id: 'timid', boostsStat: 'spe', lowersStat: 'atk' },
	{ id: 'quiet', boostsStat: 'spa', lowersStat: 'spe' },
	// Defensive natures
	{ id: 'impish', boostsStat: 'def', lowersStat: 'spa' },
	{ id: 'careful', boostsStat: 'spd', lowersStat: 'spa' },
	{ id: 'bold', boostsStat: 'def', lowersStat: 'atk' },
	{ id: 'calm', boostsStat: 'spd', lowersStat: 'atk' }
];

export function recommendAromate(priorities: StatKey[]): Aromate | null {
	if (priorities.length < 3) return null;

	const topStat = priorities[0];
	const topThree = new Set(priorities.slice(0, 3));
	const bottom = priorities.filter((s) => !topThree.has(s));

	// Find aromate that boosts top stat and lowers something not in top 3
	const aromate = AROMATES.find((a) => a.boostsStat === topStat && bottom.includes(a.lowersStat));

	if (aromate) return aromate;

	// Fallback: boost top stat regardless of what it lowers
	return AROMATES.find((a) => a.boostsStat === topStat) ?? null;
}
