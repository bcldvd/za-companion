import type { LatLng } from 'leaflet';
import type { MapConfig } from './types';

// Leaflet configuration for game coordinate system
export const mapConfig: MapConfig = {
	tileUrlTemplate: '/map/tiles/tile_{z}-{x}-{y}.png',
	maxZoom: 3, // Serebii has zoom levels 0-3
	minZoom: 0,
	initialZoom: 2, // Start at zoom 2 for better view
	initialCenter: [256, 256], // Center of 512x512 map
	radiusInGameUnits: 25
};

// Coordinate conversion functions
// Convert game coordinates to Leaflet LatLng
// Using CRS.Simple, we map game coordinates directly
// Y-axis may need inversion depending on tile coordinate system
export function gameToLeaflet(x: number, y: number): [number, number] {
	// For CRS.Simple, Leaflet uses [y, x] (lat, lng)
	// We invert Y because game coordinates typically have Y increasing upward
	// but Leaflet's Y increases downward
	return [-y, x];
}

// Convert Leaflet LatLng to game coordinates
export function leafletToGame(latLng: LatLng): { x: number; y: number } {
	return {
		x: latLng.lng,
		y: -latLng.lat
	};
}

// Calculate pixel size for radius circle
// This ensures the circle is exactly 50 game units
export function radiusToPixels(radiusInGameUnits: number, zoom: number): number {
	// In CRS.Simple with default scale, 1 game unit = 1 pixel at zoom 0
	// At each zoom level, the scale doubles
	const scale = Math.pow(2, zoom);
	return radiusInGameUnits * scale;
}
