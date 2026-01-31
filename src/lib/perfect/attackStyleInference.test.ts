import { describe, it, expect } from 'vitest';
import { inferAttackStyle, buildDefaultPriority } from './attackStyleInference';
import type { Move } from './types';

describe('inferAttackStyle', () => {
	it('returns physical when more physical moves', () => {
		const moves: Move[] = [
			{ id: '1', category: 'physical' },
			{ id: '2', category: 'physical' },
			{ id: '3', category: 'special' }
		];
		expect(inferAttackStyle(moves)).toBe('physical');
	});

	it('returns special when more special moves', () => {
		const moves: Move[] = [
			{ id: '1', category: 'special' },
			{ id: '2', category: 'special' },
			{ id: '3', category: 'special' }
		];
		expect(inferAttackStyle(moves)).toBe('special');
	});

	it('returns mixed when equal physical and special', () => {
		const moves: Move[] = [
			{ id: '1', category: 'physical' },
			{ id: '2', category: 'special' }
		];
		expect(inferAttackStyle(moves)).toBe('mixed');
	});

	it('ignores status moves when counting', () => {
		const moves: Move[] = [
			{ id: '1', category: 'status' },
			{ id: '2', category: 'physical' },
			{ id: '3', category: 'status' }
		];
		expect(inferAttackStyle(moves)).toBe('physical');
	});

	it('returns mixed when no damaging moves', () => {
		const moves: Move[] = [
			{ id: '1', category: 'status' },
			{ id: '2', category: 'status' }
		];
		expect(inferAttackStyle(moves)).toBe('mixed');
	});

	it('returns mixed when empty moveset', () => {
		expect(inferAttackStyle([])).toBe('mixed');
	});
});

describe('buildDefaultPriority', () => {
	it('prioritizes atk for physical style', () => {
		const priority = buildDefaultPriority('physical');
		expect(priority[0]).toBe('atk');
		expect(priority).toContain('spa');
		expect(priority.indexOf('atk')).toBeLessThan(priority.indexOf('spa'));
	});

	it('prioritizes spa for special style', () => {
		const priority = buildDefaultPriority('special');
		expect(priority[0]).toBe('spa');
		expect(priority).toContain('atk');
		expect(priority.indexOf('spa')).toBeLessThan(priority.indexOf('atk'));
	});

	it('prioritizes both atk and spa for mixed style', () => {
		const priority = buildDefaultPriority('mixed');
		expect(priority[0]).toBe('atk');
		expect(priority[1]).toBe('spa');
	});

	it('always returns all 6 stats', () => {
		expect(buildDefaultPriority('physical')).toHaveLength(6);
		expect(buildDefaultPriority('special')).toHaveLength(6);
		expect(buildDefaultPriority('mixed')).toHaveLength(6);
	});
});
