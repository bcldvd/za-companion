import * as cheerio from 'cheerio';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..', '..');
const STATIC_DIR = join(ROOT_DIR, 'static');
const BERRIES_DIR = join(STATIC_DIR, 'berries');
const I18N_EN_PATH = join(ROOT_DIR, 'src', 'lib', 'i18n', 'en.json');
const I18N_FR_PATH = join(ROOT_DIR, 'src', 'lib', 'i18n', 'fr.json');

const SOURCE_URL = 'https://www.serebii.net/legendsz-a/anshasdonuts.shtml';
const POKEAPI_ITEM_BASE = 'https://pokeapi.co/api/v2/item';

type BerryStats = {
	sweet: number;
	spicy: number;
	sour: number;
	bitter: number;
	fresh: number;
	level: number;
	calories: number;
};

type BerryEntry = {
	id: string;
	nameKey: string;
	stats: Omit<BerryStats, 'level' | 'calories'>;
	level: number;
	calories: number;
	isExtra: boolean;
	spritePath: string;
	sourceUrl: string;
	itemUrl?: string;
};

function normalizeText(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

function normalizeHeader(value: string): string {
	return normalizeText(value).toLowerCase();
}

function toNumber(value: string): number {
	const cleaned = value.replace(/[^\d-]/g, '');
	return cleaned.length ? Number.parseInt(cleaned, 10) : 0;
}

function toBerryId(name: string): { id: string; baseName: string; isExtra: boolean } {
	const trimmed = normalizeText(name);
	const isExtra = /^hyper\s+/i.test(trimmed);
	const baseName = trimmed.replace(/^hyper\s+/i, '');
	const withoutBerry = baseName.replace(/\s+berry$/i, '');
	const slug = withoutBerry
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	const id = isExtra ? `hyper-${slug}` : slug;
	return { id, baseName: `${withoutBerry} Berry`, isExtra };
}

function toItemSlug(baseName: string): string {
	return baseName.toLowerCase().replace(/\s+/g, '-');
}

async function fetchFrenchName(baseName: string): Promise<string | null> {
	const slug = toItemSlug(baseName);
	try {
		const response = await fetch(`${POKEAPI_ITEM_BASE}/${slug}`);
		if (!response.ok) return null;
		const data = await response.json();
		const french = data.names?.find((entry: { language: { name: string } }) => entry.language?.name === 'fr');
		return french?.name ?? null;
	} catch {
		return null;
	}
}

async function downloadSprite(url: string, outputPath: string): Promise<void> {
	if (existsSync(outputPath)) return;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download sprite: ${response.statusText}`);
	}
	const arrayBuffer = await response.arrayBuffer();
	await writeFile(outputPath, Buffer.from(arrayBuffer));
}

function resolveUrl(src?: string): string | null {
	if (!src) return null;
	if (src.startsWith('http')) return src;
	return src.startsWith('/') ? `https://www.serebii.net${src}` : `https://www.serebii.net/${src}`;
}

function findBerryTable($: cheerio.CheerioAPI): cheerio.Element | null {
	let bestMatch: cheerio.Element | null = null;
	$('table').each((_, table) => {
		const $table = $(table);
		const headerCells = $table.find('tr').first().find('th,td');
		const headers = headerCells
			.map((_, cell) => normalizeHeader($(cell).text()))
			.get();

		const required = ['sweet', 'spicy', 'sour', 'bitter', 'fresh', 'level', 'calories'];
		const hasAll = required.every((header) => headers.includes(header));
		if (hasAll) {
			bestMatch = table;
			return false;
		}
		return true;
	});
	return bestMatch;
}

function mapHeaderIndexes($table: cheerio.Cheerio<cheerio.Element>): Record<string, number> {
	const headerCells = $table.find('tr').first().find('th,td');
	const indexes: Record<string, number> = {};

	headerCells.each((index, cell) => {
		const header = normalizeHeader($table.find(cell).text());
		if (!header) return;
		indexes[header] = index;
	});

	return indexes;
}

async function loadI18n(path: string): Promise<Record<string, unknown>> {
	const content = await readFile(path, 'utf-8');
	return JSON.parse(content) as Record<string, unknown>;
}

async function writeI18n(path: string, data: Record<string, unknown>): Promise<void> {
	await writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
}

async function scrapeBerries(): Promise<void> {
	console.log('🍩 Scraping berry donut stats...');
	const response = await fetch(SOURCE_URL, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
		}
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.statusText}`);
	}
	const html = await response.text();
	const $ = cheerio.load(html);

	const tableElement = findBerryTable($);
	if (!tableElement) {
		throw new Error('Could not locate berry donut stats table.');
	}

	const $table = $(tableElement);
	const headerIndexes = mapHeaderIndexes($table);
	const headerRow = $table.find('tr').first();

	const berries: BerryEntry[] = [];
	const nameTranslations: Record<string, { en: string; fr: string }> = {};
	const frenchCache = new Map<string, string | null>();

	await mkdir(BERRIES_DIR, { recursive: true });

	const rows = $table.find('tr').toArray().slice(1);
	for (const row of rows) {
		const $row = $(row);
		if ($row.is(headerRow)) continue;
		const cells = $row.find('td,th');
		if (cells.length === 0) continue;

		const nameIndex = headerIndexes['name'];
		if (nameIndex === undefined) continue;

		const nameCell = cells.eq(nameIndex);
		const nameText = normalizeText(nameCell.text());
		if (!nameText || !/berry/i.test(nameText)) continue;

		const { id, baseName, isExtra } = toBerryId(nameText);
		const nameKey = `berries.${id}`;

		const sweet = toNumber(cells.eq(headerIndexes['sweet']).text());
		const spicy = toNumber(cells.eq(headerIndexes['spicy']).text());
		const sour = toNumber(cells.eq(headerIndexes['sour']).text());
		const bitter = toNumber(cells.eq(headerIndexes['bitter']).text());
		const fresh = toNumber(cells.eq(headerIndexes['fresh']).text());
		const level = toNumber(cells.eq(headerIndexes['level']).text());
		const calories = toNumber(cells.eq(headerIndexes['calories']).text());

		const imageCell = headerIndexes['picture'] !== undefined ? cells.eq(headerIndexes['picture']) : $row;
		const imageSrc = imageCell.find('img').first().attr('src');
		const imageUrl = resolveUrl(imageSrc);

		const itemHref = nameCell.find('a').attr('href');
		const itemUrl = resolveUrl(itemHref || undefined) ?? undefined;

		let spritePath = '';
		if (imageUrl) {
			const spriteFile = join(BERRIES_DIR, `${id}.png`);
			try {
				await downloadSprite(imageUrl, spriteFile);
				spritePath = `/berries/${id}.png`;
			} catch (error) {
				console.warn(`⚠️  Failed to download sprite for ${nameText}:`, error);
			}
		}

		let frName = frenchCache.get(baseName) ?? null;
		if (frName === null) {
			frName = await fetchFrenchName(baseName);
			frenchCache.set(baseName, frName);
		}

		const enName = nameText;
		const frResolved = frName ? frName : baseName;
		const frNameFinal = isExtra ? `Hyper ${frResolved}` : frResolved;

		nameTranslations[id] = { en: enName, fr: frNameFinal };

		berries.push({
			id,
			nameKey,
			stats: { sweet, spicy, sour, bitter, fresh },
			level,
			calories,
			isExtra,
			spritePath,
			sourceUrl: SOURCE_URL,
			itemUrl
		});
	}

	if (berries.length === 0) {
		throw new Error('No berries found in donut stats table.');
	}

	const outputPath = join(STATIC_DIR, 'berries.json');
	await writeFile(outputPath, JSON.stringify(berries, null, 2), 'utf-8');
	console.log(`✅ Wrote ${berries.length} berries to ${outputPath}`);

	const [enData, frData] = await Promise.all([loadI18n(I18N_EN_PATH), loadI18n(I18N_FR_PATH)]);
	enData.berries = enData.berries && typeof enData.berries === 'object' ? enData.berries : {};
	frData.berries = frData.berries && typeof frData.berries === 'object' ? frData.berries : {};

	for (const [id, names] of Object.entries(nameTranslations)) {
		(enData.berries as Record<string, string>)[id] = names.en;
		(frData.berries as Record<string, string>)[id] = names.fr;
	}

	await Promise.all([writeI18n(I18N_EN_PATH, enData), writeI18n(I18N_FR_PATH, frData)]);
	console.log('✅ Updated i18n berry names in en.json and fr.json');
}

scrapeBerries().catch((error) => {
	console.error('❌ Berry scraping failed:', error);
	process.exit(1);
});
