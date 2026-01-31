export type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
export type AttackStyle = 'physical' | 'special' | 'mixed';
export type MoveCategory = 'physical' | 'special' | 'status';

export interface Move {
	id: string;
	category: MoveCategory;
}

export interface EvSource {
	nationalNumber: number;
	evYield: number;
	stat: StatKey;
}

export interface Zone {
	id: string;
	stat: StatKey;
	evSources: EvSource[];
	hasNotes?: boolean;
}

export interface PowerItem {
	id: string;
	stat: StatKey;
	evBonus: number;
}

export interface Vitamin {
	id: string;
	stat: StatKey;
	evPerUse: number;
}

export interface Aromate {
	id: string;
	boostsStat: StatKey;
	lowersStat: StatKey;
}

export interface EvProgress {
	hp: number;
	atk: number;
	def: number;
	spa: number;
	spd: number;
	spe: number;
}

export const ALL_STATS: StatKey[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
