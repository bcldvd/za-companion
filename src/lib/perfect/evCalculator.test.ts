import { describe, it, expect } from 'vitest';
import { computeEvPlan, createEmptyProgress, addEv, subtractEv } from './evCalculator';
import { MAX_EV_PER_STAT, MAX_TOTAL_EV } from './constants';

describe('computeEvPlan', () => {
	it('calculates remaining EVs correctly', () => {
		const priorities = ['atk', 'hp', 'spe', 'def', 'spd', 'spa'] as const;
		const progress = createEmptyProgress();

		const plan = computeEvPlan([...priorities], progress);

		expect(plan.totalEv).toBe(0);
		expect(plan.totalRemaining).toBe(MAX_TOTAL_EV);
		expect(plan.stats[0].stat).toBe('atk');
		expect(plan.stats[0].remaining).toBe(MAX_EV_PER_STAT);
	});

	it('accounts for existing progress', () => {
		const priorities = ['atk', 'hp', 'spe', 'def', 'spd', 'spa'] as const;
		const progress = { ...createEmptyProgress(), atk: 100 };

		const plan = computeEvPlan([...priorities], progress);

		expect(plan.totalEv).toBe(100);
		expect(plan.stats[0].current).toBe(100);
		expect(plan.stats[0].remaining).toBe(152);
	});

	it('calculates kills needed with power item bonus', () => {
		const priorities = ['atk', 'hp', 'spe', 'def', 'spd', 'spa'] as const;
		const progress = createEmptyProgress();

		const plan = computeEvPlan([...priorities], progress);

		// Attack zone has +2 yield Pokemon, + 8 power item = 10 EV per kill
		// 252 / 10 = 25.2, ceil = 26
		expect(plan.stats[0].killsNeeded).toBe(26);
	});

	it('calculates vitamins needed', () => {
		const priorities = ['atk', 'hp', 'spe', 'def', 'spd', 'spa'] as const;
		const progress = createEmptyProgress();

		const plan = computeEvPlan([...priorities], progress);

		// 252 / 10 = 25.2, ceil = 26
		expect(plan.stats[0].vitaminsNeeded).toBe(26);
	});
});

describe('addEv', () => {
	it('adds EVs to a stat', () => {
		const progress = createEmptyProgress();
		const updated = addEv(progress, 'atk', 10);

		expect(updated.atk).toBe(10);
	});

	it('respects MAX_EV_PER_STAT cap', () => {
		const progress = { ...createEmptyProgress(), atk: 250 };
		const updated = addEv(progress, 'atk', 10);

		expect(updated.atk).toBe(MAX_EV_PER_STAT);
	});

	it('respects MAX_TOTAL_EV cap', () => {
		const progress = { ...createEmptyProgress(), atk: 252, hp: 252 };
		const updated = addEv(progress, 'spe', 100);

		// 252 + 252 = 504, only 6 remaining
		expect(updated.spe).toBe(6);
	});

	it('does not mutate original progress', () => {
		const progress = createEmptyProgress();
		addEv(progress, 'atk', 10);

		expect(progress.atk).toBe(0);
	});
});

describe('subtractEv', () => {
	it('subtracts EVs from a stat', () => {
		const progress = { ...createEmptyProgress(), atk: 100 };
		const updated = subtractEv(progress, 'atk', 10);

		expect(updated.atk).toBe(90);
	});

	it('does not go below zero', () => {
		const progress = { ...createEmptyProgress(), atk: 5 };
		const updated = subtractEv(progress, 'atk', 10);

		expect(updated.atk).toBe(0);
	});

	it('does not mutate original progress', () => {
		const progress = { ...createEmptyProgress(), atk: 100 };
		subtractEv(progress, 'atk', 10);

		expect(progress.atk).toBe(100);
	});
});
