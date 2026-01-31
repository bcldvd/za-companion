// Map Module Type Definitions

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

export interface MapFilterState {
	benches: boolean;
	alphas: boolean;
	ladders: boolean;
	pokemonSpawns: boolean;
	selectedPokemon: number[]; // Future: filter by Pokemon
}

export interface MapConfig {
	tileUrlTemplate: string;
	maxZoom: number;
	minZoom: number;
	initialZoom: number;
	initialCenter: [number, number];
	radiusInGameUnits: number;
}
