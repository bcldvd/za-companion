import type { PowerItem } from '../types';

export const POWER_ITEMS: PowerItem[] = [
	{ id: 'power-weight', stat: 'hp', evBonus: 8 },
	{ id: 'power-bracer', stat: 'atk', evBonus: 8 },
	{ id: 'power-belt', stat: 'def', evBonus: 8 },
	{ id: 'power-lens', stat: 'spa', evBonus: 8 },
	{ id: 'power-band', stat: 'spd', evBonus: 8 },
	{ id: 'power-anklet', stat: 'spe', evBonus: 8 }
];

export function getPowerItemForStat(stat: string): PowerItem | undefined {
	return POWER_ITEMS.find((item) => item.stat === stat);
}
