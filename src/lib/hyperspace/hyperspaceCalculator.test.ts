import { describe, it, expect } from 'vitest';
import {
	computeHyperspaceTimes,
	getShinyProbability,
	getAlphaProbability,
	formatDuration,
	type CalculatorInput
} from './hyperspaceCalculator.js';

describe('hyperspaceCalculator', () => {
	describe('getShinyProbability', () => {
		it('returns correct Charm ON probabilities', () => {
			expect(getShinyProbability(true, 0)).toBeCloseTo(1 / 1024.38, 5);
			expect(getShinyProbability(true, 1)).toBeCloseTo(1 / 819.60, 5);
			expect(getShinyProbability(true, 2)).toBeCloseTo(1 / 683.08, 5);
			expect(getShinyProbability(true, 3)).toBeCloseTo(1 / 585.57, 5);
		});

		it('returns correct Charm OFF probabilities', () => {
			expect(getShinyProbability(false, 0)).toBeCloseTo(1 / 4096.0, 5);
			expect(getShinyProbability(false, 1)).toBeCloseTo(1 / 2048.25, 5);
			expect(getShinyProbability(false, 2)).toBeCloseTo(1 / 1365.67, 5);
			expect(getShinyProbability(false, 3)).toBeCloseTo(1 / 1024.38, 5);
		});
	});

	describe('getAlphaProbability', () => {
		it('returns correct alpha probabilities', () => {
			expect(getAlphaProbability(0)).toBe(0);
			expect(getAlphaProbability(1)).toBe(0.11);
			expect(getAlphaProbability(2)).toBe(0.21);
			expect(getAlphaProbability(3)).toBe(0.51);
		});
	});

	describe('formatDuration', () => {
		it('formats seconds correctly', () => {
			expect(formatDuration(0.5)).toBe('30s');
			expect(formatDuration(0.25)).toBe('15s');
		});

		it('formats minutes correctly', () => {
			expect(formatDuration(5)).toBe('5m');
			expect(formatDuration(10)).toBe('10m');
		});

		it('formats minutes and seconds correctly', () => {
			expect(formatDuration(10.5)).toBe('10m 30s');
			expect(formatDuration(10.75)).toBe('10m 45s');
		});

		it('handles edge cases', () => {
			expect(formatDuration(0)).toBe('0s');
			expect(formatDuration(Infinity)).toBe('—');
			expect(formatDuration(-1)).toBe('—');
			expect(formatDuration(NaN)).toBe('—');
		});
	});

	describe('computeHyperspaceTimes', () => {
		it('computes reference scenario correctly', () => {
			const input: CalculatorInput = {
				method: 'auto',
				shinyDonutLevel: 3,
				alphaDonutLevel: 0,
				shinyCharm: true,
				pokemonPerReset: 10
			};

			const result = computeHyperspaceTimes(input);

			// Reference: Auto + Charm ON + Sparkling Lv3 + k=10 => t99 ≈ 10m47s
			// Allow tolerance: 10m47s = 10.783... minutes
			// We'll allow ±5 seconds tolerance
			expect(result.t99).toBeGreaterThan(10.7);
			expect(result.t99).toBeLessThan(10.9);
			expect(result.t99Formatted).toMatch(/10m \d+s/);
		});

		it('monotonicity: increasing k decreases all times', () => {
			const baseInput: CalculatorInput = {
				method: 'auto',
				shinyDonutLevel: 3,
				alphaDonutLevel: 0,
				shinyCharm: true,
				pokemonPerReset: 5
			};

			const result5 = computeHyperspaceTimes(baseInput);

			const result10 = computeHyperspaceTimes({
				...baseInput,
				pokemonPerReset: 10
			});

			const result20 = computeHyperspaceTimes({
				...baseInput,
				pokemonPerReset: 20
			});

			// Higher k should yield lower times
			expect(result5.t99).toBeGreaterThan(result10.t99);
			expect(result10.t99).toBeGreaterThan(result20.t99);
			expect(result5.t90).toBeGreaterThan(result10.t90);
			expect(result10.t90).toBeGreaterThan(result20.t90);
			expect(result5.t50).toBeGreaterThan(result10.t50);
			expect(result10.t50).toBeGreaterThan(result20.t50);
		});

		it('method comparison: auto yields smaller times than manual', () => {
			const baseInput: CalculatorInput = {
				method: 'auto',
				shinyDonutLevel: 3,
				alphaDonutLevel: 0,
				shinyCharm: true,
				pokemonPerReset: 10
			};

			const autoResult = computeHyperspaceTimes(baseInput);
			const manualResult = computeHyperspaceTimes({
				...baseInput,
				method: 'manual'
			});

			// Auto should be faster (smaller times)
			expect(autoResult.t99).toBeLessThan(manualResult.t99);
			expect(autoResult.t90).toBeLessThan(manualResult.t90);
			expect(autoResult.t50).toBeLessThan(manualResult.t50);
			expect(autoResult.tAvg).toBeLessThan(manualResult.tAvg);
		});

		it('computes encounters per minute correctly', () => {
			const autoInput: CalculatorInput = {
				method: 'auto',
				shinyDonutLevel: 3,
				alphaDonutLevel: 0,
				shinyCharm: true,
				pokemonPerReset: 10
			};

			const autoResult = computeHyperspaceTimes(autoInput);
			expect(autoResult.encountersPerMinute).toBe(25 * 10); // 25 resets/min * 10 pokemon

			const manualInput: CalculatorInput = {
				...autoInput,
				method: 'manual',
				pokemonPerReset: 5
			};

			const manualResult = computeHyperspaceTimes(manualInput);
			expect(manualResult.encountersPerMinute).toBe(10 * 5); // 10 resets/min * 5 pokemon
		});

		it('computes shalpha times when alpha donut is enabled', () => {
			const input: CalculatorInput = {
				method: 'auto',
				shinyDonutLevel: 3,
				alphaDonutLevel: 3,
				shinyCharm: true,
				pokemonPerReset: 10
			};

			const result = computeHyperspaceTimes(input);

			// Shalpha times should be finite and larger than regular shiny times
			expect(Number.isFinite(result.t99Shalpha)).toBe(true);
			expect(result.t99Shalpha).toBeGreaterThan(result.t99);
			expect(Number.isFinite(result.t90Shalpha)).toBe(true);
			expect(result.t90Shalpha).toBeGreaterThan(result.t90);
			expect(result.shalphaProbability).toBeGreaterThan(0);
		});

		it('sets shalpha times to Infinity when alpha donut is off', () => {
			const input: CalculatorInput = {
				method: 'auto',
				shinyDonutLevel: 3,
				alphaDonutLevel: 0,
				shinyCharm: true,
				pokemonPerReset: 10
			};

			const result = computeHyperspaceTimes(input);

			expect(result.t99Shalpha).toBe(Infinity);
			expect(result.t90Shalpha).toBe(Infinity);
			expect(result.t50Shalpha).toBe(Infinity);
			expect(result.tAvgShalpha).toBe(Infinity);
			expect(result.shalphaProbability).toBe(0);
		});

		it('throws error for invalid pokemonPerReset', () => {
			const input: CalculatorInput = {
				method: 'auto',
				shinyDonutLevel: 3,
				alphaDonutLevel: 0,
				shinyCharm: true,
				pokemonPerReset: 0
			};

			expect(() => computeHyperspaceTimes(input)).toThrow();
		});

		it('returns formatted strings for all times', () => {
			const input: CalculatorInput = {
				method: 'auto',
				shinyDonutLevel: 3,
				alphaDonutLevel: 0,
				shinyCharm: true,
				pokemonPerReset: 10
			};

			const result = computeHyperspaceTimes(input);

			expect(typeof result.t50Formatted).toBe('string');
			expect(typeof result.t90Formatted).toBe('string');
			expect(typeof result.t95Formatted).toBe('string');
			expect(typeof result.t99Formatted).toBe('string');
			expect(typeof result.tAvgFormatted).toBe('string');
		});

		it('handles Charm OFF correctly', () => {
			const input: CalculatorInput = {
				method: 'auto',
				shinyDonutLevel: 3,
				alphaDonutLevel: 0,
				shinyCharm: false,
				pokemonPerReset: 10
			};

			const result = computeHyperspaceTimes(input);

			// Charm OFF should yield longer times than Charm ON
			const charmOnResult = computeHyperspaceTimes({
				...input,
				shinyCharm: true
			});

			expect(result.t99).toBeGreaterThan(charmOnResult.t99);
			expect(result.t90).toBeGreaterThan(charmOnResult.t90);
			expect(result.t50).toBeGreaterThan(charmOnResult.t50);
		});
	});
});
