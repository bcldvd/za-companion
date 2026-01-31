/**
 * Script to scrape map tiles from Serebii's Lumiose City map
 * URL pattern: https://www.serebii.net/pokearth/lumiosecity/map/tile_{z}-{x}-{y}.png
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATIC_DIR = join(__dirname, '..', '..', 'static');
const TILES_DIR = join(STATIC_DIR, 'map', 'tiles');

const BASE_URL = 'https://www.serebii.net/pokearth/lumiosecity/map';

// Configuration - adjust these if needed
const MAX_ZOOM = 5; // Try up to zoom level 5
const MAX_TILES_PER_AXIS = 20; // Try up to 20x20 grid per zoom level
const MAX_CONSECUTIVE_FAILURES = 3; // Stop after 3 consecutive 404s

interface TileResult {
	z: number;
	x: number;
	y: number;
	success: boolean;
}

async function downloadTile(z: number, x: number, y: number): Promise<TileResult> {
	const url = `${BASE_URL}/tile_${z}-${x}-${y}.png`;
	const outputPath = join(TILES_DIR, `tile_${z}-${x}-${y}.png`);

	// Skip if already exists
	if (existsSync(outputPath)) {
		return { z, x, y, success: true };
	}

	try {
		const response = await fetch(url);
		if (!response.ok) {
			return { z, x, y, success: false };
		}

		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		await writeFile(outputPath, buffer);

		return { z, x, y, success: true };
	} catch (error) {
		return { z, x, y, success: false };
	}
}

async function discoverAndDownloadTiles() {
	const results: TileResult[] = [];
	let totalDownloaded = 0;

	for (let z = 0; z <= MAX_ZOOM; z++) {
		console.log(`\n📦 Zoom level ${z}:`);
		let tilesAtThisZoom = 0;
		let consecutiveFailures = 0;

		for (let x = 0; x < MAX_TILES_PER_AXIS; x++) {
			let rowHasTiles = false;

			for (let y = 0; y < MAX_TILES_PER_AXIS; y++) {
				const result = await downloadTile(z, x, y);
				results.push(result);

				if (result.success) {
					tilesAtThisZoom++;
					totalDownloaded++;
					rowHasTiles = true;
					consecutiveFailures = 0;
					process.stdout.write('.');
				} else {
					consecutiveFailures++;
					if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
						break; // Stop this row
					}
				}

				// Small delay to avoid overwhelming server
				await new Promise(resolve => setTimeout(resolve, 50));
			}

			// If this row had no tiles, assume we've gone past the boundary
			if (!rowHasTiles) {
				break;
			}

			consecutiveFailures = 0; // Reset for next row
		}

		console.log(`\n   Found ${tilesAtThisZoom} tiles`);

		// If no tiles at this zoom level, stop trying higher zooms
		if (tilesAtThisZoom === 0) {
			console.log(`   No tiles found at zoom ${z}, stopping.`);
			break;
		}
	}

	return { results, totalDownloaded };
}

async function main() {
	console.log('🗺️  Map tile downloader for Lumiose City');
	console.log('=' .repeat(60));
	console.log(`📍 Source: ${BASE_URL}/tile_{{z}}-{{x}}-{{y}}.png`);
	console.log(`📁 Output: ${TILES_DIR}`);

	// Create output directory
	await mkdir(TILES_DIR, { recursive: true });

	console.log('\n⬇️  Discovering and downloading tiles...');
	console.log('   (This may take a few minutes)\n');

	const { results, totalDownloaded } = await discoverAndDownloadTiles();

	// Summary
	console.log('\n' + '='.repeat(60));
	console.log('✅ Tile download completed!');
	console.log(`📊 Total tiles downloaded: ${totalDownloaded}`);
	console.log(`📁 Output directory: ${TILES_DIR}`);

	// Show breakdown by zoom level
	const byZoom = new Map<number, number>();
	results.filter(r => r.success).forEach(r => {
		byZoom.set(r.z, (byZoom.get(r.z) || 0) + 1);
	});

	console.log('\n📦 Tiles per zoom level:');
	byZoom.forEach((count, zoom) => {
		console.log(`   Zoom ${zoom}: ${count} tiles`);
	});

	if (totalDownloaded === 0) {
		console.log('\n⚠️  No tiles were downloaded!');
		console.log('   Please verify the URL pattern is correct.');
		console.log('   Expected: https://www.serebii.net/pokearth/lumiosecity/map/tile_Z-X-Y.png');
	}
}

main();
