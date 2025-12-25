import * as cheerio from 'cheerio';
import type { ScrapedPokemon } from './types.js';

/**
 * Extracts national dex number from image URL
 * Pattern: /legendsz-a/pokemon/small/056.png → 56
 */
function extractNationalNumber(imageUrl: string): number | null {
	const match = imageUrl.match(/(\d+)\.png$/);
	if (!match) return null;
	return parseInt(match[1], 10);
}

/**
 * Extracts regional dex number from number string
 * Pattern: #001 → 1
 */
function extractRegionalNumber(number: string): number | null {
	const match = number.match(/#(\d+)/);
	if (!match) return null;
	return parseInt(match[1], 10);
}

/**
 * Fetches and parses a Serebii Legends Z-A Pokemon page
 * @param url The URL to scrape (defaults to Lumiose City Pokédex)
 */
export async function scrapePokemon(url: string = 'https://www.serebii.net/legendsz-a/availablepokemon.shtml'): Promise<ScrapedPokemon[]> {
	// Use AbortController for timeout
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

	try {
		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
			}
		});
		clearTimeout(timeoutId);

		if (!response.ok) {
			throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
		}

		const html = await response.text();
		const $ = cheerio.load(html);

		const pokemon: ScrapedPokemon[] = [];

		// Based on the provided HTML structure, the table has:
		// Column 1: Number (#XXX) and image
		// Column 2: Name with link
		// Column 3: Types with links
		
		// Try multiple table selectors
		const tableSelectors = [
			'table.dextable',
			'table',
			'div table',
			'[class*="dex"] table'
		];

		for (const selector of tableSelectors) {
			$(selector).each((tableIdx, table) => {
				const $table = $(table);
				$table.find('tr').each((rowIdx, row) => {
					const $row = $(row);
					const cells = $row.find('td');

					// Need at least 2 cells (number/name)
					if (cells.length < 2) return;

					// Look for Pokemon number pattern in any cell
					let numberCell = '';
					let numberCellIndex = -1;

					for (let i = 0; i < cells.length; i++) {
						const cellText = cells.eq(i).text().trim();
						// Check for #XXX pattern
						if (cellText.match(/^#\d+$/)) {
							numberCell = cellText;
							numberCellIndex = i;
							break;
						}
					}

					// Skip if no number found
					if (!numberCell) return;

					// Extract name - search all cells after the number cell for a link with text
					// The name is typically in a cell with a link, not necessarily the next cell
					let name = '';
					let nameCellIndex = -1;
					
					// First, try to find a cell with a link that has text (Pokemon name link)
					for (let i = numberCellIndex + 1; i < cells.length; i++) {
						const $cell = cells.eq(i);
						const $link = $cell.find('a');
						if ($link.length > 0) {
							const linkText = $link.text().trim();
							// Skip if it's a type link (usually short or contains type keywords)
							if (linkText.length > 2 && !linkText.match(/^(grass|fire|water|electric|psychic|ice|dragon|dark|fairy|normal|fighting|flying|poison|ground|rock|bug|ghost|steel)$/i)) {
								name = linkText;
								nameCellIndex = i;
								break;
							}
						}
					}
					
					// If no link found, look for the first cell with substantial text after the number
					if (!name) {
						for (let i = numberCellIndex + 1; i < cells.length; i++) {
							const cellText = cells.eq(i).text().trim();
							// Skip empty cells and very short text (likely not a name)
							if (cellText.length > 2 && !cellText.match(/^(Pic|Type|No\.)$/i)) {
								name = cellText;
								nameCellIndex = i;
								break;
							}
						}
					}

					if (!name || name.length === 0) return;

					// Extract image URL - check first two cells
					let imageUrl = '';
					for (let i = 0; i <= Math.min(1, cells.length - 1); i++) {
						const $img = cells.eq(i).find('img').first();
						if ($img.length > 0) {
							const src = $img.attr('src') || '';
							if (src && !src.includes('type') && !src.includes('icon')) {
								imageUrl = src.startsWith('http') 
									? src 
									: `https://www.serebii.net${src.startsWith('/') ? src : '/' + src}`;
								break;
							}
						}
					}

					// Extract regional and national numbers
					const regionalNumber = extractRegionalNumber(numberCell);
					const nationalNumber = imageUrl ? extractNationalNumber(imageUrl) : null;

					// Skip if we can't extract both numbers
					if (regionalNumber === null || nationalNumber === null) {
						console.warn(`Warning: Could not extract numbers for ${name} (regional: ${regionalNumber}, national: ${nationalNumber})`);
						return;
					}

					// Extract types - check all cells after the name for type links
					const typeUrls: string[] = [];
					
					// Check all remaining cells after the name for type links
					for (let i = nameCellIndex + 1; i < cells.length; i++) {
						const $typeCell = cells.eq(i);
						
						// Look for type links
						$typeCell.find('a').each((_, link) => {
							const href = $(link).attr('href') || '';
							if (href && (href.includes('.shtml') || href.includes('/pokedex'))) {
								const normalizedUrl = href.startsWith('http') 
									? href 
									: href.startsWith('/') 
										? href 
										: '/' + href;
								// Only add if it looks like a type URL
								if (normalizedUrl.match(/\/pokedex[^/]*\/(grass|fire|water|electric|psychic|ice|dragon|dark|fairy|normal|fighting|flying|poison|ground|rock|bug|ghost|steel)\.shtml$/i)) {
									typeUrls.push(normalizedUrl);
								}
							}
						});

						// If no links found yet, try to infer from images
						if (typeUrls.length === 0) {
							$typeCell.find('img').each((_, img) => {
								const src = $(img).attr('src') || '';
								const alt = $(img).attr('alt') || '';
								// Try to extract type from src or alt
								const typeMatch = (src + ' ' + alt).toLowerCase().match(/\b(grass|fire|water|electric|psychic|ice|dragon|dark|fairy|normal|fighting|flying|poison|ground|rock|bug|ghost|steel)\b/);
								if (typeMatch) {
									typeUrls.push(`/pokedex-sv/${typeMatch[1]}.shtml`);
								}
							});
						}
					}

					// Add Pokemon if we have valid data
					if (name && regionalNumber !== null && nationalNumber !== null) {
						// Check if we already have this Pokemon (by regional number)
						const existingIndex = pokemon.findIndex(p => p.regionalNumber === regionalNumber);
						if (existingIndex === -1) {
							pokemon.push({
								regionalNumber,
								nationalNumber,
								number: numberCell, // Keep for compatibility
								name,
								imageUrl,
								typeUrls
							});
						}
					}
				});
			});

			// If we found Pokemon, break out of selector loop
			if (pokemon.length > 0) break;
		}

		return pokemon;
	} catch (error) {
		clearTimeout(timeoutId);
		if (error instanceof Error) {
			if (error.name === 'AbortError') {
				throw new Error(`Request timeout while fetching ${url}`);
			}
			throw error;
		}
		throw new Error(`Unknown error: ${error}`);
	}
}

