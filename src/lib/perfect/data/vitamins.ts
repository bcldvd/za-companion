import type { Vitamin } from '../types';

export const VITAMINS: Vitamin[] = [
	{ id: 'hp-up', stat: 'hp', evPerUse: 10 },
	{ id: 'protein', stat: 'atk', evPerUse: 10 },
	{ id: 'iron', stat: 'def', evPerUse: 10 },
	{ id: 'calcium', stat: 'spa', evPerUse: 10 },
	{ id: 'zinc', stat: 'spd', evPerUse: 10 },
	{ id: 'carbos', stat: 'spe', evPerUse: 10 }
];

export function getVitaminForStat(stat: string): Vitamin | undefined {
	return VITAMINS.find((v) => v.stat === stat);
}
