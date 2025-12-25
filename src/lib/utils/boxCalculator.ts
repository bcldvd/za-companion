import type { BoxPosition } from '../types/pokemon.js';

/**
 * Calculates the box position for a Pokemon based on its regional number.
 * Box layout: 6 columns × 5 rows = 30 slots per box
 * 
 * @param regionalNumber - The regional Pokedex number (1-232)
 * @returns Box position with box number, row, column, and slot index
 */
export function calculateBoxPosition(regionalNumber: number): BoxPosition {
	// Convert to 0-based index
	const index = regionalNumber - 1;
	
	// Calculate box number (0-based, then +1 for display)
	const box = Math.floor(index / 30) + 1;
	
	// Calculate position within the box (0-29)
	const slotIndex = index % 30;
	
	// Calculate row (0-based, then +1 for display)
	const row = Math.floor(slotIndex / 6) + 1;
	
	// Calculate column (0-based, then +1 for display)
	const column = (slotIndex % 6) + 1;
	
	return {
		box,
		row,
		column,
		slotIndex
	};
}

