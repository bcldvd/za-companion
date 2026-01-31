/**
 * Script to scrape Pokemon spawn locations from Serebii's Lumiose City map
 *
 * This extracts spawn coordinates and Pokemon data for the interactive map.
 *
 * Steps:
 * 1. Visit https://www.serebii.net/pokearth/lumiosecity/
 * 2. Inspect JavaScript to find spawn marker data (look for arrays like 'pmarkers')
 * 3. Extract coordinates and Pokemon IDs
 * 4. Generate map-spawns.json with structure:
 *    {
 *      "id": "spawn-001",
 *      "pokemonNationalNumber": 25,
 *      "x": 100,
 *      "y": 200,
 *      "spawnType": "normal" | "alpha"
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
const OUTPUT_FILE = join(STATIC_DIR, 'map-spawns.json');

async function main() {
	console.log('📍 Pokemon spawn location scraper');
	console.log('='.repeat(60));
	console.log(`Fetching: https://www.serebii.net/pokearth/lumiosecity/`);

	const { spawns } = await scrapeLumioseData();

	await writeFile(OUTPUT_FILE, JSON.stringify(spawns, null, 2));
	console.log(`\n✅ Wrote: ${OUTPUT_FILE}`);
	console.log(`📊 Spawns: ${spawns.length}`);

	if (spawns.length === 0) {
		console.warn('\n⚠️  No spawns parsed. The page structure may have changed.');
		console.warn('Try inspecting the page source to update the parser.');
	}
}

main().catch((error) => {
	console.error('Failed to scrape spawns:', error);
	process.exitCode = 1;
});
