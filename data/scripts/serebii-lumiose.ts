import https from 'https';
import { URL } from 'url';
import * as cheerio from 'cheerio';
import type { MapPOI, MapSpawnLocation } from '../src/map-types.js';

const PAGE_URL = 'https://www.serebii.net/pokearth/lumiosecity/';
const USER_AGENT =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

type IconType = 'bench' | 'ladder' | 'alpha' | 'pokemon';

type MarkerCandidate = {
	iconRef: string;
	tableId: number;
	x: number;
	y: number;
};

function normalizePokemonNumber(nationalNumber: number): number {
	const normalized = Math.floor(nationalNumber / 10);
	return normalized > 0 ? normalized : nationalNumber;
}

function fetchText(url: string): Promise<string> {
	return new Promise((resolve, reject) => {
		https
			.get(
				url,
				{
					headers: {
						'User-Agent': USER_AGENT
					}
				},
				(res) => {
					const status = res.statusCode || 0;
					const location = res.headers.location;
					if (status >= 300 && status < 400 && location) {
						const nextUrl = new URL(location, url).toString();
						res.resume();
						fetchText(nextUrl).then(resolve, reject);
						return;
					}

					let data = '';
					res.setEncoding('utf8');
					res.on('data', (chunk) => {
						data += chunk;
					});
					res.on('end', () => resolve(data));
				}
			)
			.on('error', reject);
	});
}

function extractScriptSources(html: string): { inline: string[]; src: string[] } {
	const $ = cheerio.load(html);
	const inline: string[] = [];
	const src: string[] = [];

	$('script').each((_, el) => {
		const scriptSrc = $(el).attr('src');
		if (scriptSrc) {
			src.push(scriptSrc);
		} else {
			const text = $(el).text().trim();
			if (text) {
				inline.push(text);
			}
		}
	});

	return { inline, src };
}

function extractPokemonFilterIds(html: string): Set<number> {
	const $ = cheerio.load(html);
	const ids = new Set<number>();

	$('a[href*="#id="]').each((_, el) => {
		const href = $(el).attr('href') ?? '';
		const imgSrc = $(el).find('img').attr('src')?.toLowerCase() ?? '';
		if (!imgSrc.includes('/pokedex-sv/icon/za/')) return;

		const match = href.match(/#id=(\d+)/);
		if (!match) return;

		const rawId = Number.parseInt(match[1], 10);
		if (!Number.isFinite(rawId)) return;

		ids.add(normalizePokemonNumber(rawId));
	});

	return ids;
}

function resolveScriptUrls(sources: string[], baseUrl: string): string[] {
	return sources
		.map((src) => {
			try {
				return new URL(src, baseUrl).toString();
			} catch {
				return null;
			}
		})
		.filter((url): url is string => Boolean(url));
}

function buildIconMap(scriptText: string): Record<string, IconType> {
	const iconMap: Record<string, IconType> = {};
	const iconRegex =
		/(?:var|let|const)\s+([A-Za-z0-9_]+)\s*=\s*(?:new\s+L\.Icon|L\.icon)\(\s*\{[^}]*?iconUrl:\s*['"]([^'"]+)['"][^}]*?\}\s*\)/g;
	let match: RegExpExecArray | null;
	while ((match = iconRegex.exec(scriptText))) {
		const varName = match[1];
		const iconUrl = match[2].toLowerCase();
		if (iconUrl.includes('pokeball')) iconMap[varName] = 'pokemon';
		if (iconUrl.includes('bench')) iconMap[varName] = 'bench';
		if (iconUrl.includes('ladder')) iconMap[varName] = 'ladder';
		if (iconUrl.includes('alpha')) iconMap[varName] = 'alpha';
		if (iconUrl.includes('alphaza')) iconMap[varName] = 'alpha';
	}
	return iconMap;
}

function extractMarkerCandidates(scriptText: string): MarkerCandidate[] {
	const blockMatch = scriptText.match(/var\s+pmarkers\s*=\s*(\[[\s\S]*?\]);/);
	if (!blockMatch) return [];

	const block = blockMatch[1];
	const markerRegex =
		/\{\s*coords:\s*\[([^\]]+)\][^}]*?icon:\s*([A-Za-z0-9_]+)[^}]*?tableID:\s*(\d+)[^}]*?\}/g;
	const candidates: MarkerCandidate[] = [];
	let match: RegExpExecArray | null;

	while ((match = markerRegex.exec(block))) {
		const coordsRaw = match[1];
		const iconRef = match[2];
		const tableId = Number.parseInt(match[3], 10);
		const coords = coordsRaw
			.split(',')
			.map((value) => Number.parseFloat(value.trim()))
			.filter((value) => Number.isFinite(value));

		if (coords.length < 2) continue;
		const xCoord = coords[0];
		const zCoord = coords.length >= 3 ? coords[2] : coords[1];

		// Serebii uses a 4096 map scaled to 512 in CRS.Simple
		const scale = 512 / 4096;
		const x = xCoord * scale;
		const y = zCoord * scale;

		candidates.push({
			iconRef,
			tableId,
			x,
			y
		});
	}

	return candidates;
}

function extractPokeTableMapping(scriptText: string): Record<number, number> {
	const mapping: Record<number, number> = {};
	const blockMatch = scriptText.match(/var\s+pokeFilter\s*=\s*\{[\s\S]*?\};/);
	if (!blockMatch) return mapping;

	const block = blockMatch[0];
	const entryRegex = /(\d+)\s*:\s*\{\s*tableIDs\s*:\s*\[([^\]]*)\]\s*\}/g;
	let match: RegExpExecArray | null;
	while ((match = entryRegex.exec(block))) {
		const pokemonId = Number.parseInt(match[1], 10);
		const ids = match[2]
			.split(',')
			.map((value) => Number.parseInt(value.trim(), 10))
			.filter((value) => Number.isFinite(value));
		for (const id of ids) {
			mapping[id] = pokemonId;
		}
	}

	return mapping;
}

function classifyCandidates(
	candidates: MarkerCandidate[],
	iconMap: Record<string, IconType>,
	tableToPokemon: Record<number, number>,
	validPokemon?: Set<number>
): { spawns: MapSpawnLocation[]; pois: MapPOI[] } {
	const spawns: MapSpawnLocation[] = [];
	const pois: MapPOI[] = [];
	let spawnIndex = 1;
	let poiIndex = 1;
	const shouldFilterByPokemon = Boolean(validPokemon && validPokemon.size > 0);

	for (const candidate of candidates) {
		const iconType = iconMap[candidate.iconRef];
		if (iconType && iconType !== 'pokemon') {
			pois.push({
				id: `${iconType}-${String(poiIndex).padStart(3, '0')}`,
				type: iconType,
				x: candidate.x,
				y: candidate.y,
				label: undefined,
				pokemonNationalNumber:
					iconType === 'alpha'
						? normalizePokemonNumber(tableToPokemon[candidate.tableId])
						: undefined
			});
			poiIndex += 1;
			continue;
		}

		if (iconType !== 'pokemon') {
			continue;
		}

		const pokemonId = tableToPokemon[candidate.tableId];
		if (pokemonId) {
			const normalized = normalizePokemonNumber(pokemonId);
			if (shouldFilterByPokemon && !validPokemon!.has(normalized)) {
				continue;
			}
			spawns.push({
				id: `spawn-${String(spawnIndex).padStart(3, '0')}`,
				pokemonNationalNumber: normalized,
				x: candidate.x,
				y: candidate.y,
				spawnType: 'normal'
			});
			spawnIndex += 1;
		}
	}

	return { spawns, pois };
}

export async function scrapeLumioseData() {
	const html = await fetchText(PAGE_URL);
	const { inline, src } = extractScriptSources(html);
	const scriptUrls = resolveScriptUrls(src, PAGE_URL);
	const externalScripts = await Promise.all(
		scriptUrls.map((url) => fetchText(url).catch(() => ''))
	);

	const combinedScripts = [...inline, ...externalScripts].join('\n');
	const iconMap = buildIconMap(combinedScripts);
	const candidates = extractMarkerCandidates(combinedScripts);
	const tableToPokemon = extractPokeTableMapping(combinedScripts);

	const validPokemon = extractPokemonFilterIds(html);
	return classifyCandidates(candidates, iconMap, tableToPokemon, validPokemon);
}
