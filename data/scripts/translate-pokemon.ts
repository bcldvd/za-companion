import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
const STATIC_DIR = join(__dirname, '..', '..', 'static');

interface Pokemon {
	regionalNumber: number;
	nationalNumber: number;
	name: string;
	types: string[];
	imageUrl: string;
}

interface PokemonTranslation {
	[nationalNumber: number]: string;
}

interface TypeTranslation {
	[typeName: string]: string;
}

// PokeAPI base URL
const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// Rate limiting: wait between requests to avoid hitting rate limits
async function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch Pokemon data from PokeAPI
async function fetchPokemonData(nationalNumber: number): Promise<{
	names: { en: string; fr: string };
	types: { en: string[]; fr: string[] };
}> {
	try {
		// Fetch Pokemon data first to get species URL
		const pokemonResponse = await fetch(`${POKEAPI_BASE}/pokemon/${nationalNumber}`);
		if (!pokemonResponse.ok) {
			throw new Error(`Failed to fetch Pokemon ${nationalNumber}: ${pokemonResponse.statusText}`);
		}

		const pokemonData = await pokemonResponse.json();

		// Fetch species data for localized names
		const speciesResponse = await fetch(pokemonData.species.url);
		if (!speciesResponse.ok) {
			throw new Error(`Failed to fetch species for Pokemon ${nationalNumber}`);
		}

		const speciesData = await speciesResponse.json();

		// Extract names from species data
		const enName = speciesData.names?.find((n: any) => n.language.name === 'en')?.name || pokemonData.name;
		const frName = speciesData.names?.find((n: any) => n.language.name === 'fr')?.name || pokemonData.name;

		// Extract types
		const types: { en: string[]; fr: string[] } = { en: [], fr: [] };
		
		for (const typeSlot of pokemonData.types || []) {
			const typeName = typeSlot.type.name;
			try {
				const typeResponse = await fetch(typeSlot.type.url);
				if (typeResponse.ok) {
					const typeData = await typeResponse.json();
					const enType = typeData.names?.find((n: any) => n.language.name === 'en')?.name || typeName;
					const frType = typeData.names?.find((n: any) => n.language.name === 'fr')?.name || typeName;
					types.en.push(enType);
					types.fr.push(frType);
				} else {
					// Fallback to type name if API call fails
					types.en.push(typeName);
					types.fr.push(typeName);
				}
			} catch {
				// Fallback to type name on error
				types.en.push(typeName);
				types.fr.push(typeName);
			}
		}

		return { names: { en: enName, fr: frName }, types };
	} catch (error) {
		console.error(`Error fetching Pokemon ${nationalNumber}:`, error);
		// Return fallback data
		return {
			names: { en: `Pokemon-${nationalNumber}`, fr: `Pokemon-${nationalNumber}` },
			types: { en: [], fr: [] }
		};
	}
}

// Get all unique national numbers from pokedex files
async function getAllNationalNumbers(): Promise<Set<number>> {
	const pokedexPath = join(DATA_DIR, 'pokedex.json');
	const hyperspacePath = join(DATA_DIR, 'hyperspace-pokedex.json');

	const [pokedexData, hyperspaceData] = await Promise.all([
		readFile(pokedexPath, 'utf-8').then(JSON.parse) as Promise<Pokemon[]>,
		readFile(hyperspacePath, 'utf-8').then(JSON.parse) as Promise<Pokemon[]>
	]);

	const nationalNumbers = new Set<number>();
	
	for (const pokemon of [...pokedexData, ...hyperspaceData]) {
		nationalNumbers.add(pokemon.nationalNumber);
	}

	return nationalNumbers;
}

// Main translation function
async function translatePokemon() {
	console.log('🌍 Starting Pokemon translation from PokeAPI...');
	console.log('='.repeat(60));

	try {
		// Get all unique national numbers
		const nationalNumbers = await getAllNationalNumbers();
		console.log(`📊 Found ${nationalNumbers.size} unique Pokemon to translate`);

		const pokemonTranslations: { en: PokemonTranslation; fr: PokemonTranslation } = {
			en: {},
			fr: {}
		};

		const typeTranslations: { en: TypeTranslation; fr: TypeTranslation } = {
			en: {},
			fr: {}
		};

		const sortedNumbers = Array.from(nationalNumbers).sort((a, b) => a - b);
		let processed = 0;

		for (const nationalNumber of sortedNumbers) {
			processed++;
			console.log(`[${processed}/${sortedNumbers.length}] Fetching Pokemon #${nationalNumber}...`);

			const data = await fetchPokemonData(nationalNumber);
			
			pokemonTranslations.en[nationalNumber] = data.names.en;
			pokemonTranslations.fr[nationalNumber] = data.names.fr;

			// Store type translations
			for (let i = 0; i < data.types.en.length; i++) {
				const enType = data.types.en[i];
				const frType = data.types.fr[i];
				if (enType && frType) {
					typeTranslations.en[enType] = enType; // Keep English as-is
					typeTranslations.fr[enType] = frType; // Map English type to French
				}
			}

			// Rate limiting: wait 100ms between requests
			if (processed < sortedNumbers.length) {
				await delay(100);
			}
		}

		// Write Pokemon name translations
		const pokemonEnPath = join(STATIC_DIR, 'pokemon-names-en.json');
		const pokemonFrPath = join(STATIC_DIR, 'pokemon-names-fr.json');
		
		await Promise.all([
			writeFile(pokemonEnPath, JSON.stringify(pokemonTranslations.en, null, 2), 'utf-8'),
			writeFile(pokemonFrPath, JSON.stringify(pokemonTranslations.fr, null, 2), 'utf-8')
		]);

		console.log(`✅ Pokemon name translations written:`);
		console.log(`   📁 ${pokemonEnPath}`);
		console.log(`   📁 ${pokemonFrPath}`);

		// Write type translations
		const typesEnPath = join(STATIC_DIR, 'pokemon-types-en.json');
		const typesFrPath = join(STATIC_DIR, 'pokemon-types-fr.json');
		
		await Promise.all([
			writeFile(typesEnPath, JSON.stringify(typeTranslations.en, null, 2), 'utf-8'),
			writeFile(typesFrPath, JSON.stringify(typeTranslations.fr, null, 2), 'utf-8')
		]);

		console.log(`✅ Type translations written:`);
		console.log(`   📁 ${typesEnPath}`);
		console.log(`   📁 ${typesFrPath}`);

		console.log('\n' + '='.repeat(60));
		console.log('✅ Translation completed successfully!');
		console.log(`📊 Translated ${sortedNumbers.length} Pokemon`);
	} catch (error) {
		console.error('\n❌ Error during translation:', error);
		process.exit(1);
	}
}

translatePokemon();

