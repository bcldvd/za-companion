import type { EvProgress, StatKey } from './types';
import { MAX_EV_PER_STAT, MAX_TOTAL_EV, POWER_ITEM_BONUS } from './constants';
import { getBestZoneForStat } from './data/evSources';

export interface StatPlan {
	stat: StatKey;
	current: number;
	target: number;
	remaining: number;
	killsNeeded: number;
	vitaminsNeeded: number;
}

export interface EvPlan {
	stats: StatPlan[];
	totalEv: number;
	totalRemaining: number;
}

export function computeEvPlan(priorities: StatKey[], progress: EvProgress): EvPlan {
	let totalEv = Object.values(progress).reduce((sum, val) => sum + val, 0);
	let totalRemaining = MAX_TOTAL_EV - totalEv;

	const stats: StatPlan[] = priorities.map((stat) => {
		const current = progress[stat];
		const maxForStat = Math.min(MAX_EV_PER_STAT, current + totalRemaining);
		const target = maxForStat;
		const remaining = Math.max(0, target - current);

		// Calculate kills needed with power item (base yield + 8 bonus)
		const zone = getBestZoneForStat(stat);
		const bestYield = zone?.evSources.reduce((max, s) => Math.max(max, s.evYield), 1) ?? 1;
		const evPerKill = bestYield + POWER_ITEM_BONUS;
		const killsNeeded = Math.ceil(remaining / evPerKill);

		// Calculate vitamins needed (10 EV each)
		const vitaminsNeeded = Math.ceil(remaining / 10);

		return {
			stat,
			current,
			target,
			remaining,
			killsNeeded,
			vitaminsNeeded
		};
	});

	return {
		stats,
		totalEv,
		totalRemaining
	};
}

export function createEmptyProgress(): EvProgress {
	return {
		hp: 0,
		atk: 0,
		def: 0,
		spa: 0,
		spd: 0,
		spe: 0
	};
}

export function addEv(progress: EvProgress, stat: StatKey, amount: number): EvProgress {
	const current = progress[stat];
	const totalOther = Object.entries(progress)
		.filter(([key]) => key !== stat)
		.reduce((sum, [, val]) => sum + val, 0);

	const maxAllowed = Math.min(MAX_EV_PER_STAT - current, MAX_TOTAL_EV - totalOther - current);
	const actualAdd = Math.min(amount, maxAllowed);

	return {
		...progress,
		[stat]: current + actualAdd
	};
}

export function subtractEv(progress: EvProgress, stat: StatKey, amount: number): EvProgress {
	const current = progress[stat];
	const actualSubtract = Math.min(amount, current);

	return {
		...progress,
		[stat]: current - actualSubtract
	};
}
