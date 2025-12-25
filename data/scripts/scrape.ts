import { scrapePokemon } from '../src/scraper.js';
import { normalizePokemon } from '../src/normalizer.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
const STATIC_DIR = join(__dirname, '..', '..', 'static');

const LUMIOSE_URL = 'https://www.serebii.net/legendsz-a/availablepokemon.shtml';
const HYPERSPACE_URL = 'https://www.serebii.net/legendsz-a/hyperspacepokedex.shtml';

const LUMIOSE_OUTPUT = join(STATIC_DIR, 'pokedex.json');
const HYPERSPACE_OUTPUT = join(STATIC_DIR, 'hyperspace-pokedex.json');

async function scrapeDex(name: string, url: string, outputFile: string) {
	console.log(`\n📖 Scraping ${name} Pokédex...`);
	console.log(`   URL: ${url}`);

	try {
		// Scrape the data
		const scraped = await scrapePokemon(url);
		console.log(`   Found ${scraped.length} Pokemon entries`);

		// Normalize the data
		console.log(`   Normalizing data...`);
		const normalized = normalizePokemon(scraped);
		console.log(`   Normalized ${normalized.length} Pokemon entries`);

		// Write to JSON file
		console.log(`   Writing to ${outputFile}...`);
		await writeFile(outputFile, JSON.stringify(normalized, null, 2), 'utf-8');

		console.log(`   ✅ ${name} Pokédex completed!`);
		console.log(`   📁 Output: ${outputFile}`);
		console.log(`   📊 Total Pokemon: ${normalized.length}`);

		return normalized.length;
	} catch (error) {
		console.error(`   ❌ Error scraping ${name} Pokédex:`, error);
		throw error;
	}
}

async function main() {
	console.log('🚀 Starting Pokemon scraping for Legends Z-A...');
	console.log('=' .repeat(60));

	try {
		// Scrape Lumiose City Pokédex
		const lumioseCount = await scrapeDex('Lumiose City', LUMIOSE_URL, LUMIOSE_OUTPUT);

		// Scrape Hyperspace Pokédex
		const hyperspaceCount = await scrapeDex('Hyperspace', HYPERSPACE_URL, HYPERSPACE_OUTPUT);

		console.log('\n' + '='.repeat(60));
		console.log('✅ All scraping completed successfully!');
		console.log(`📊 Total Pokemon scraped: ${lumioseCount + hyperspaceCount}`);
		console.log(`   - Lumiose City: ${lumioseCount}`);
		console.log(`   - Hyperspace: ${hyperspaceCount}`);
	} catch (error) {
		console.error('\n❌ Error during scraping:', error);
		process.exit(1);
	}
}

main();

