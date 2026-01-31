import type { MapFilterState, MapSpawnLocation, MapPOI } from './types';

const FILTER_STORAGE_KEY = 'pokemon-legends-za-map-filters';

// Default filter state - all enabled
const defaultFilterState: MapFilterState = {
	benches: true,
	alphas: true,
	ladders: true,
	pokemonSpawns: true,
	selectedPokemon: []
};

// Load filter state from localStorage
export function loadFilterState(): MapFilterState {
	if (typeof window === 'undefined') return defaultFilterState;

	try {
		const stored = localStorage.getItem(FILTER_STORAGE_KEY);
		if (stored) {
			return { ...defaultFilterState, ...JSON.parse(stored) };
		}
	} catch (error) {
		console.error('Failed to load filter state:', error);
	}

	return defaultFilterState;
}

// Save filter state to localStorage
export function saveFilterState(state: MapFilterState): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.error('Failed to save filter state:', error);
	}
}

const MAX_KNOWN_NATIONAL_NUMBER = 1025;

// Normalize form-specific numbers (e.g. 6691 -> 669)
export function normalizePokemonNumber(nationalNumber: number): number {
	if (nationalNumber > MAX_KNOWN_NATIONAL_NUMBER) {
		return Math.floor(nationalNumber / 10);
	}
	return nationalNumber;
}

// Get sprite URL for a Pokemon
export function getSpriteUrl(nationalNumber: number, isShiny: boolean): string {
	const variant = isShiny ? 'shiny' : 'default';
	const normalizedNumber = normalizePokemonNumber(nationalNumber);
	return `/sprites/${variant}/${normalizedNumber}.png`;
}

// Load spawn locations from static JSON
export async function loadSpawnLocations(): Promise<MapSpawnLocation[]> {
	try {
		const response = await fetch('/map-spawns.json');
		// #region agent log
		fetch('http://127.0.0.1:7249/ingest/6db62e92-df2d-4211-b8d7-02d65778a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/map/mapData.ts:loadSpawnLocations',message:'fetch spawns',data:{ok:response.ok,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'E'})}).catch(()=>{});
		// #endregion agent log
		if (!response.ok) {
			throw new Error(`Failed to load spawns: ${response.statusText}`);
		}
		const data = await response.json();
		// #region agent log
		fetch('http://127.0.0.1:7249/ingest/6db62e92-df2d-4211-b8d7-02d65778a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/map/mapData.ts:loadSpawnLocations',message:'spawns loaded',data:{count:Array.isArray(data)?data.length:-1},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'E'})}).catch(()=>{});
		// #endregion agent log
		return data;
	} catch (error) {
		console.error('Failed to load spawn locations:', error);
		// #region agent log
		fetch('http://127.0.0.1:7249/ingest/6db62e92-df2d-4211-b8d7-02d65778a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/map/mapData.ts:loadSpawnLocations',message:'spawns error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'E'})}).catch(()=>{});
		// #endregion agent log
		return [];
	}
}

// Load POIs from static JSON
export async function loadPOIs(): Promise<MapPOI[]> {
	try {
		const response = await fetch('/map-pois.json');
		// #region agent log
		fetch('http://127.0.0.1:7249/ingest/6db62e92-df2d-4211-b8d7-02d65778a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/map/mapData.ts:loadPOIs',message:'fetch pois',data:{ok:response.ok,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
		// #endregion agent log
		if (!response.ok) {
			throw new Error(`Failed to load POIs: ${response.statusText}`);
		}
		const data = await response.json();
		// #region agent log
		fetch('http://127.0.0.1:7249/ingest/6db62e92-df2d-4211-b8d7-02d65778a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/map/mapData.ts:loadPOIs',message:'pois loaded',data:{count:Array.isArray(data)?data.length:-1},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
		// #endregion agent log
		return data;
	} catch (error) {
		console.error('Failed to load POIs:', error);
		// #region agent log
		fetch('http://127.0.0.1:7249/ingest/6db62e92-df2d-4211-b8d7-02d65778a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/map/mapData.ts:loadPOIs',message:'pois error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
		// #endregion agent log
		return [];
	}
}
