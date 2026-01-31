import type { AttackStyle, Move, StatKey } from './types';

export function inferAttackStyle(moves: Move[]): AttackStyle {
	const damaging = moves.filter((m) => m.category !== 'status');

	if (damaging.length === 0) {
		return 'mixed';
	}

	const physical = damaging.filter((m) => m.category === 'physical').length;
	const special = damaging.filter((m) => m.category === 'special').length;

	if (physical > special) return 'physical';
	if (special > physical) return 'special';
	return 'mixed';
}

export function buildDefaultPriority(style: AttackStyle): StatKey[] {
	switch (style) {
		case 'physical':
			return ['atk', 'hp', 'spe', 'def', 'spd', 'spa'];
		case 'special':
			return ['spa', 'hp', 'spe', 'def', 'spd', 'atk'];
		case 'mixed':
			return ['atk', 'spa', 'hp', 'spe', 'def', 'spd'];
	}
}
