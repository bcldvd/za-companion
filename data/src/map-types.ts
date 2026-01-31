export interface MapSpawnLocation {
	id: string; // "spawn-001"
	pokemonNationalNumber: number; // 25
	x: number; // Game X coordinate
	y: number; // Game Y coordinate
	spawnType: 'normal' | 'alpha';
}

export interface MapPOI {
	id: string; // "bench-001"
	type: 'bench' | 'alpha' | 'ladder';
	x: number;
	y: number;
	label?: string; // Optional description
	pokemonNationalNumber?: number; // For alpha POIs
}
