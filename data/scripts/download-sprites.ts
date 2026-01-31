import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATIC_DIR = join(__dirname, '..', '..', 'static');
const SPRITES_DIR = join(STATIC_DIR, 'sprites');
const DEFAULT_DIR = join(SPRITES_DIR, 'default');
const SHINY_DIR = join(SPRITES_DIR, 'shiny');

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// Pokemon national numbers to download (adjust based on Legends Z-A pokedex)
// This downloads the full National Dex currently supported by PokéAPI
const MAX_POKEMON = 1025;

interface SpriteDownloadResult {
	nationalNumber: number;
	success: boolean;
	variant: 'default' | 'shiny';
	error?: string;
}

async function fetchPokemonData(nationalNumber: number): Promise<any> {
	try {
		const response = await fetch(`${POKEAPI_BASE}/pokemon/${nationalNumber}/`);
		if (!response.ok) {
			throw new Error(`PokéAPI returned ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		console.error(`Error fetching Pokémon ${nationalNumber}:`, error);
		throw error;
	}
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download image: ${response.statusText}`);
	}
	const arrayBuffer = await response.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	await writeFile(outputPath, buffer);
}

async function downloadSprite(
	nationalNumber: number,
	isShiny: boolean
): Promise<SpriteDownloadResult> {
	const variant = isShiny ? 'shiny' : 'default';
	const outputDir = isShiny ? SHINY_DIR : DEFAULT_DIR;
	const outputPath = join(outputDir, `${nationalNumber}.png`);

	// Skip if already exists
	if (existsSync(outputPath)) {
		return { nationalNumber, success: true, variant };
	}

	try {
		const pokemonData = await fetchPokemonData(nationalNumber);

		// Try Pokémon Home sprites first (higher quality)
		let spriteUrl: string | null = null;
		if (pokemonData.sprites?.other?.home) {
			if (isShiny) {
				spriteUrl = pokemonData.sprites.other.home.front_shiny || null;
			} else {
				spriteUrl = pokemonData.sprites.other.home.front_default || null;
			}
		}

		// Fallback to default sprites
		if (!spriteUrl) {
			if (isShiny) {
				spriteUrl = pokemonData.sprites?.front_shiny || null;
			} else {
				spriteUrl = pokemonData.sprites?.front_default || null;
			}
		}

		if (!spriteUrl) {
			throw new Error(`No ${variant} sprite available`);
		}

		await downloadImage(spriteUrl, outputPath);
		return { nationalNumber, success: true, variant };
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		return { nationalNumber, success: false, variant, error: errorMsg };
	}
}

async function main() {
	console.log('🎨 Starting Pokemon sprite download for map module...');
	console.log('=' .repeat(60));

	// Create directories
	console.log('📁 Creating sprite directories...');
	await mkdir(SPRITES_DIR, { recursive: true });
	await mkdir(DEFAULT_DIR, { recursive: true });
	await mkdir(SHINY_DIR, { recursive: true });

	const results: SpriteDownloadResult[] = [];
	let successCount = 0;
	let failureCount = 0;

	console.log(`\n⬇️  Downloading sprites for ${MAX_POKEMON} Pokemon (default + shiny)...`);
	console.log('   This may take several minutes...\n');

	for (let i = 1; i <= MAX_POKEMON; i++) {
		// Download default and shiny variants
		const [defaultResult, shinyResult] = await Promise.all([
			downloadSprite(i, false),
			downloadSprite(i, true)
		]);

		results.push(defaultResult, shinyResult);

		if (defaultResult.success) successCount++;
		else failureCount++;

		if (shinyResult.success) successCount++;
		else failureCount++;

		// Show progress every 50 Pokemon
		if (i % 50 === 0) {
			console.log(`   Progress: ${i}/${MAX_POKEMON} Pokemon processed...`);
		}

		// Rate limiting to avoid overwhelming PokéAPI
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	// Report results
	console.log('\n' + '='.repeat(60));
	console.log('✅ Sprite download completed!');
	console.log(`📊 Total sprites: ${results.length}`);
	console.log(`   ✅ Successful: ${successCount}`);
	console.log(`   ❌ Failed: ${failureCount}`);
	console.log(`📁 Output directory: ${SPRITES_DIR}`);

	// Show failures if any
	const failures = results.filter(r => !r.success);
	if (failures.length > 0) {
		console.log('\n⚠️  Failed downloads:');
		failures.forEach(f => {
			console.log(`   - #${f.nationalNumber} (${f.variant}): ${f.error}`);
		});
	}
}

main();
