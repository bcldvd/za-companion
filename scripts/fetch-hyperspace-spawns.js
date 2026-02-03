#!/usr/bin/env node

/**
 * One-time script to fetch Hyperspace Lumiose Pokemon spawn data from Serebii
 * Run with: node scripts/fetch-hyperspace-spawns.js
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const URL = 'https://www.serebii.net/pokearth/lumiosecity/hyperspacelumiose.shtml';

function fetchPage(url) {
	return new Promise((resolve, reject) => {
		https.get(url, (res) => {
			let data = '';
			res.on('data', (chunk) => (data += chunk));
			res.on('end', () => resolve(data));
			res.on('error', reject);
		}).on('error', reject);
	});
}

function extractPokemonFromSection(sectionHtml) {
	const pokemon = [];

	// Find all Pokemon images with their national numbers
	// Format: <img src="/legendsz-a/pokemon/001.png" ... alt="Bulbasaur" />
	const imgRegex = /<img\s+src="\/legendsz-a\/pokemon\/(\d+)(-[a-z]+)?\.png"[^>]*alt="([^"]+)"[^>]*>/gi;

	// Find all type rows - they contain type images
	// The types appear in the same order as the Pokemon images
	const typeRowRegex = /<td[^>]*class="type"[^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/td>/gi;

	// Extract all Pokemon image data
	const pokemonImages = [];
	let imgMatch;
	while ((imgMatch = imgRegex.exec(sectionHtml)) !== null) {
		const nationalNumber = parseInt(imgMatch[1], 10);
		const variant = imgMatch[2] || null; // e.g., "-a" for Alolan
		const name = imgMatch[3];
		pokemonImages.push({ nationalNumber, variant, name });
	}

	// Extract type data from all type cells
	const typeData = [];
	const typeCellRegex = /<td[^>]*class="type"[^>]*>([\s\S]*?)<\/td>/gi;
	let typeMatch;
	while ((typeMatch = typeCellRegex.exec(sectionHtml)) !== null) {
		const cellContent = typeMatch[1];
		// Only process cells that contain type images (not Level or Alpha Chance cells)
		if (cellContent.includes('/pokedex-bw/type/') && !cellContent.includes('<b>Level</b>') && !cellContent.includes('<b>Alpha Chance</b>')) {
			const types = [];
			const typeImgRegex = /\/pokedex-bw\/type\/([a-z]+)\.gif/gi;
			let typeImgMatch;
			while ((typeImgMatch = typeImgRegex.exec(cellContent)) !== null) {
				types.push(typeImgMatch[1].toLowerCase());
			}
			typeData.push(types);
		}
	}

	// Match Pokemon with their types (they should be in the same order)
	for (let i = 0; i < pokemonImages.length; i++) {
		const img = pokemonImages[i];
		const types = typeData[i] || [];

		pokemon.push({
			name: img.name,
			nationalNumber: img.nationalNumber,
			types,
			variant: img.variant
		});
	}

	return pokemon;
}

function extractSections(html) {
	const sections = {
		mainArea: [],
		star1: [],
		star2: [],
		star3: [],
		star4: [],
		star5: []
	};

	// Define section anchors and their corresponding keys
	const sectionPatterns = [
		{ anchor: 'name="xy"', key: 'mainArea', label: 'Main Area' },
		{ anchor: 'name="xy-1starorhigher"', key: 'star1', label: '1 Star or Higher' },
		{ anchor: 'name="xy-2starorhigher"', key: 'star2', label: '2 Star or Higher' },
		{ anchor: 'name="xy-3starorhigher"', key: 'star3', label: '3 Star or Higher' },
		{ anchor: 'name="xy-4starorhigher"', key: 'star4', label: '4 Star or Higher' },
		{ anchor: 'name="xy-5star"', key: 'star5', label: '5 Star' }
	];

	const htmlLower = html.toLowerCase();

	for (let i = 0; i < sectionPatterns.length; i++) {
		const { anchor, key, label } = sectionPatterns[i];
		const nextAnchor = sectionPatterns[i + 1]?.anchor;

		// Find section start
		const startIndex = htmlLower.indexOf(anchor.toLowerCase());
		if (startIndex === -1) {
			console.log(`Section not found: ${label}`);
			continue;
		}

		// Find section end (start of next section or end of content)
		let endIndex = html.length;
		if (nextAnchor) {
			const foundEnd = htmlLower.indexOf(nextAnchor.toLowerCase(), startIndex + 1);
			if (foundEnd !== -1) {
				endIndex = foundEnd;
			}
		}

		const sectionHtml = html.slice(startIndex, endIndex);
		sections[key] = extractPokemonFromSection(sectionHtml);
		console.log(`${label}: Found ${sections[key].length} Pokemon`);
	}

	return sections;
}

function buildPokemonDatabase(sections) {
	const pokemonMap = new Map();

	// Process each star level section
	// "X Star or Higher" means it spawns in X star and above
	const starLevelMapping = [
		{ key: 'star1', stars: [1, 2, 3, 4, 5] },
		{ key: 'star2', stars: [2, 3, 4, 5] },
		{ key: 'star3', stars: [3, 4, 5] },
		{ key: 'star4', stars: [4, 5] },
		{ key: 'star5', stars: [5] },
		{ key: 'mainArea', stars: [5], isMainArea: true }
	];

	for (const { key, stars, isMainArea } of starLevelMapping) {
		for (const pokemon of sections[key]) {
			// Create unique key including variant
			const uniqueKey = pokemon.variant
				? `${pokemon.nationalNumber}${pokemon.variant}`
				: `${pokemon.nationalNumber}`;

			if (!pokemonMap.has(uniqueKey)) {
				pokemonMap.set(uniqueKey, {
					name: pokemon.name,
					nationalNumber: pokemon.nationalNumber,
					types: pokemon.types,
					variant: pokemon.variant,
					starLevels: [],
					isMainArea: false
				});
			}

			const entry = pokemonMap.get(uniqueKey);

			// Add star levels that aren't already present
			for (const star of stars) {
				if (!entry.starLevels.includes(star)) {
					entry.starLevels.push(star);
				}
			}

			if (isMainArea) {
				entry.isMainArea = true;
			}
		}
	}

	// Convert to array and sort by national number
	const result = Array.from(pokemonMap.values())
		.map(p => ({
			name: p.name,
			nationalNumber: p.nationalNumber,
			types: p.types,
			...(p.variant && { variant: p.variant }),
			starLevels: p.starLevels.sort((a, b) => a - b),
			...(p.isMainArea && { isMainArea: true })
		}))
		.sort((a, b) => {
			if (a.nationalNumber !== b.nationalNumber) {
				return a.nationalNumber - b.nationalNumber;
			}
			// Sort variants after base form
			const aVariant = a.variant || '';
			const bVariant = b.variant || '';
			return aVariant.localeCompare(bVariant);
		});

	return result;
}

async function main() {
	console.log('Fetching Serebii Hyperspace Lumiose page...');

	const html = await fetchPage(URL);
	console.log(`Fetched ${html.length} bytes\n`);

	console.log('Extracting sections...');
	const sections = extractSections(html);

	console.log('\nBuilding Pokemon database...');
	const pokemon = buildPokemonDatabase(sections);

	console.log(`\nTotal unique Pokemon entries: ${pokemon.length}`);
	console.log(`Main Area Pokemon: ${pokemon.filter(p => p.isMainArea).length}`);

	// Output to JSON file
	const outputPath = path.join(__dirname, '..', 'src', 'lib', 'data', 'hyperspace-spawns.json');

	// Ensure directory exists
	const outputDir = path.dirname(outputPath);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	fs.writeFileSync(outputPath, JSON.stringify(pokemon, null, 2));
	console.log(`\nOutput written to: ${outputPath}`);

	// Print summary
	console.log('\n--- Sample output ---');
	console.log(JSON.stringify(pokemon.slice(0, 5), null, 2));
}

main().catch(console.error);
