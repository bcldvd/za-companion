export interface Pokemon {
	regionalNumber: number;
	nationalNumber: number;
	name: string;
	types: string[];
	imageUrl: string;
}

export interface BoxPosition {
	box: number;
	row: number;
	column: number;
	slotIndex: number; // 0-29 for visual grid
}

