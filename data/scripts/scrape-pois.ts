/**
 * Script to scrape Points of Interest (POIs) from Serebii's Lumiose City map
 *
 * This extracts locations for:
 * - Benches (green markers)
 * - Guaranteed Alphas (purple markers)
 * - Ladders (orange markers)
 *
 * Steps:
 * 1. Visit https://www.serebii.net/pokearth/lumiosecity/
 * 2. Inspect JavaScript to find POI marker data
 * 3. Extract coordinates and POI types
 * 4. Generate map-pois.json with structure:
 *    {
 *      "id": "bench-001",
 *      "type": "bench" | "alpha" | "ladder",
 *      "x": 100,
 *      "y": 200,
 *      "label": "Optional description",
 *      "pokemonNationalNumber": 25 // For alpha POIs
 *    }
 *
 * PLACEHOLDER IMPLEMENTATION
 */

import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { scrapeLumioseData } from './serebii-lumiose.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATIC_DIR = join(__dirname, '..', '..', 'static');
const OUTPUT_FILE = join(STATIC_DIR, 'map-pois.json');

async function main() {
	console.log('🎯 Points of Interest scraper');
	console.log('='.repeat(60));
	console.log(`Fetching: https://www.serebii.net/pokearth/lumiosecity/`);

	const { pois } = await scrapeLumioseData();

	await writeFile(OUTPUT_FILE, JSON.stringify(pois, null, 2));
	console.log(`\n✅ Wrote: ${OUTPUT_FILE}`);
	console.log(`📊 POIs: ${pois.length}`);

	if (pois.length === 0) {
		console.warn('\n⚠️  No POIs parsed. The page structure may have changed.');
		console.warn('Try inspecting the page source to update the parser.');
	}
}

main().catch((error) => {
	console.error('Failed to scrape POIs:', error);
	process.exitCode = 1;
});
